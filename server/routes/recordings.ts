import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { transcribeAndAnalyzeAudio } from "../openai";
import { insertRecordingSchema } from "@shared/schema";
import multer from "multer";
import fs from "fs";
import path from "path";
import os from "os";
import { z } from "zod";

const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Configure multer for file uploads
const upload = multer({
  dest: os.tmpdir(),
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
        const recordingDate = new Date(recording.recordedAt || recording.createdAt);
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
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      const { title, duration } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: "Recording title is required" });
      }

      // Create recording record first
      const recording = await storage.createRecording({
        userId,
        title,
        duration: duration ? parseInt(duration) : 0,
        status: 'processing'
      });

      // Process audio file asynchronously
      const audioPath = req.file.path;
      
      try {
        const leaders = await storage.getLeaders();
        const { transcription, analysis } = await transcribeAndAnalyzeAudio(audioPath, recording, leaders);
        
        // Update recording with results
        await storage.updateRecording(recording.id, {
          title: recording.title,
          duration: recording.duration,
          status: 'completed',
          transcription,
          analysisResult: analysis
        });

        res.json(recording);
      } catch (processingError) {
        console.error("Error processing audio:", processingError);
        
        // Update recording status to failed
        await storage.updateRecording(recording.id, { 
          status: 'failed',
          transcription: 'Processing failed'
        });

        res.status(500).json({ 
          error: "Failed to process audio file",
          recordingId: recording.id
        });
      } finally {
        // Clean up uploaded file
        try {
          fs.unlinkSync(audioPath);
        } catch (cleanupError) {
          console.error("Error cleaning up uploaded file:", cleanupError);
        }
      }
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