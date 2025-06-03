import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { transcribeAndAnalyzeAudio } from "../openai";
import { insertRecordingSchema } from "@shared/schema";
import multer from "multer";
import fs from "fs";
import path from "path";
import os from "os";
import { z } from "zod";

// Background processing function
async function processAudioInBackground(recordingId: number, audioBuffer: Buffer): Promise<void> {
  try {
    console.log(`[RECORDING ${recordingId}] Background processing started`);
    
    // Get the recording details
    const recording = await storage.getRecording(recordingId);
    if (!recording) {
      throw new Error(`Recording ${recordingId} not found`);
    }
    
    // Write buffer to temporary file without corruption - preserve original extension
    const timestamp = Date.now();
    const tempFilePath = path.join(os.tmpdir(), `recording_${timestamp}.webm`);
    fs.writeFileSync(tempFilePath, audioBuffer, { encoding: null });
    
    console.log(`[RECORDING ${recordingId}] Starting transcription and analysis...`);
    const { transcription, analysis } = await transcribeAndAnalyzeAudio(recording, tempFilePath);
    
    // Clean up temporary file
    fs.unlinkSync(tempFilePath);
    console.log(`[RECORDING ${recordingId}] Transcription completed, updating database...`);
    
    // Update recording with results
    await storage.updateRecordingAnalysis(recordingId, transcription, analysis);
    
    // Update status separately using correct parameters
    await storage.updateRecording(recordingId, {
      title: recording.title,
      duration: recording.duration,
      status: 'completed'
    });
    console.log(`[RECORDING ${recordingId}] Background processing completed successfully`);
    
  } catch (processingError) {
    console.error(`[RECORDING ${recordingId}] Background processing failed:`, processingError);
    
    // Update recording status to failed
    try {
      const recording = await storage.getRecording(recordingId);
      if (recording) {
        await storage.updateRecording(recordingId, { 
          title: recording.title,
          duration: recording.duration,
          status: 'failed',
          errorDetails: processingError instanceof Error ? processingError.message : 'Unknown error'
        });
      }
    } catch (updateError) {
      console.error(`[RECORDING ${recordingId}] Failed to update error status:`, updateError);
    }
  }
}

const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Configure multer for file uploads without corrupting binary data
const upload = multer({
  storage: multer.memoryStorage(), // Use memory storage to avoid file corruption
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

export function registerRecordingRoutes(app: Express) {
  // Get all recordings for user
  app.get("/api/recordings", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const recordings = await storage.getRecordings(userId);
      res.json(recordings);
    } catch (error) {
      console.error("Error fetching recordings:", error);
      res.status(500).json({ error: "Failed to fetch recordings" });
    }
  });

  // Get recordings for current billing cycle
  app.get("/api/recordings/current-cycle", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get billing cycle dates for filtering
      const { getBillingCycleWordUsageAnalytics } = await import('../subscriptionController');
      const billingData = await getBillingCycleWordUsageAnalytics(userId);
      const billingCycle = {
        start: billingData.analytics.billingCycleProgress.cycleStart,
        end: billingData.analytics.billingCycleProgress.cycleEnd
      };
      
      if (!billingCycle) {
        return res.json([]);
      }

      const allRecordings = await storage.getRecordings(userId);
      
      // Filter recordings to current billing cycle using authentic Stripe dates
      const billingCycleStart = new Date(billingCycle.start);
      const billingCycleEnd = new Date(billingCycle.end);
      
      const currentCycleRecordings = allRecordings.filter(recording => {
        const recordingDate = new Date(recording.recordedAt);
        return recordingDate >= billingCycleStart && recordingDate <= billingCycleEnd;
      });

      console.log(`📊 Found ${currentCycleRecordings.length} recordings in current billing cycle`);
      
      // Format records with chart-ready data
      const chartReadyRecordings = currentCycleRecordings.map(recording => ({
        id: recording.id,
        title: recording.title,
        wordCount: recording.wordCount || 0,
        recordedAt: recording.recordedAt,
        date: recording.recordedAt ? new Date(recording.recordedAt).toISOString().split('T')[0] : null,
        formattedDate: recording.recordedAt ? new Date(recording.recordedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }) : 'N/A'
      }));
      
      console.log(`📊 Chart-ready recordings:`, chartReadyRecordings.slice(0, 3));
      
      res.json({ recordings: chartReadyRecordings });
    } catch (error) {
      console.error("Error fetching current cycle recordings:", error);
      res.status(500).json({ error: "Failed to fetch current cycle recordings" });
    }
  });

  // Get specific recording
  app.get("/api/recordings/:id", requireAuth, async (req, res) => {
    try {
      const recordingId = parseInt(req.params.id);
      const userId = req.session?.userId;

      if (isNaN(recordingId)) {
        return res.status(400).json({ error: "Invalid recording ID" });
      }

      const recording = await storage.getRecording(recordingId);
      if (!recording) {
        return res.status(404).json({ error: "Recording not found" });
      }

      // Check if user owns this recording
      if (recording.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(recording);
    } catch (error) {
      console.error("Error fetching recording:", error);
      res.status(500).json({ error: "Failed to fetch recording" });
    }
  });

  // Create new recording
  app.post("/api/recordings", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const recordingData = insertRecordingSchema.parse({
        ...req.body,
        userId
      });

      const recording = await storage.createRecording(recordingData);
      res.json(recording);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      }
      
      console.error("Error creating recording:", error);
      res.status(500).json({ error: "Failed to create recording" });
    }
  });

  // Upload and process audio file
  app.post("/api/recordings/upload", requireAuth, upload.single('audio'), async (req, res) => {
    console.log(`[UPLOAD ROUTE] POST request received from user ${req.session?.userId}`);
    try {
      const userId = req.session?.userId;
      if (!userId) {
        console.log(`[UPLOAD ROUTE] Authentication failed - no userId`);
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      const { title, duration, recordingId } = req.body;
      console.log(`[UPLOAD ROUTE] Processing upload - title: ${title}, duration: ${duration}, recordingId: ${recordingId}`);
      
      let recording;
      if (recordingId) {
        // Recording already exists, fetch it
        recording = await storage.getRecording(parseInt(recordingId));
        if (!recording) {
          return res.status(404).json({ error: "Recording not found" });
        }
        console.log(`[UPLOAD] Using existing recording ${recording.id}`);
      } else {
        // Create new recording
        if (!title) {
          return res.status(400).json({ error: "Recording title is required" });
        }
        
        console.log(`[UPLOAD] Creating new recording for user ${userId}, title: ${title}`);
        try {
          recording = await storage.createRecording({
            userId,
            title,
            duration: duration ? parseInt(duration) : 0
          });
          console.log(`[UPLOAD] Recording created with ID: ${recording.id}`);
        } catch (createError) {
          console.error(`[UPLOAD] Failed to create recording:`, createError);
          return res.status(500).json({ error: "Failed to create recording" });
        }
      }

      // Start processing in background (non-blocking)
      console.log(`[RECORDING ${recording.id}] Starting background transcription and analysis...`);
      console.log(`[RECORDING ${recording.id}] Audio file details:`, {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
      
      // Process audio in background without waiting
      processAudioInBackground(recording.id, req.file.buffer).catch(error => {
        console.error(`[RECORDING ${recording.id}] Background processing failed:`, error);
      });
      
      // Return immediately with the recording in "processing" status
      res.json(recording);
    } catch (error) {
      console.error("Error in audio upload:", error);
      
      // Clean up uploaded file if it exists
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up uploaded file:", cleanupError);
        }
      }
      
      res.status(500).json({ error: "Failed to upload and process audio" });
    }
  });

  // Update recording
  app.put("/api/recordings/:id", requireAuth, async (req, res) => {
    try {
      const recordingId = parseInt(req.params.id);
      const userId = req.session?.userId;

      if (isNaN(recordingId)) {
        return res.status(400).json({ error: "Invalid recording ID" });
      }

      // Check if recording exists and user owns it
      const existingRecording = await storage.getRecording(recordingId);
      if (!existingRecording) {
        return res.status(404).json({ error: "Recording not found" });
      }

      if (existingRecording.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Update recording
      const updatedRecording = await storage.updateRecording(recordingId, req.body);
      
      if (!updatedRecording) {
        return res.status(500).json({ error: "Failed to update recording" });
      }

      res.json(updatedRecording);
    } catch (error) {
      console.error("Error updating recording:", error);
      res.status(500).json({ error: "Failed to update recording" });
    }
  });

  // Delete recording
  app.delete("/api/recordings/:id", requireAuth, async (req, res) => {
    try {
      const recordingId = parseInt(req.params.id);
      const userId = req.session?.userId;

      if (isNaN(recordingId)) {
        return res.status(400).json({ error: "Invalid recording ID" });
      }

      // Check if recording exists and user owns it
      const existingRecording = await storage.getRecording(recordingId);
      if (!existingRecording) {
        return res.status(404).json({ error: "Recording not found" });
      }

      if (existingRecording.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Mark as deleted rather than actual deletion
      const deletedRecording = await storage.updateRecording(recordingId, { 
        title: existingRecording.title,
        duration: existingRecording.duration,
        status: 'deleted' 
      });

      res.json({ 
        success: true, 
        message: "Recording deleted successfully",
        recording: deletedRecording
      });
    } catch (error) {
      console.error("Error deleting recording:", error);
      res.status(500).json({ error: "Failed to delete recording" });
    }
  });
}