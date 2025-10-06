import { Express, Request, Response } from "express";
import { importLeadersFromFile } from "../import-leaders";
import { updateLeaderImages } from "../update-leader-images";
import { importTrainingData } from "../import-training-data";
import { storage } from "../storage";

export function registerAdminRoutes(app: Express) {
  // Import leaders from JSON file
  app.post("/api/admin/import-leaders", async (req, res) => {
    try {
      await importLeadersFromFile();
      res.json({ success: true, message: "Leaders imported successfully" });
    } catch (error) {
      console.error("Error importing leaders:", error);
      res.status(500).json({ error: "Failed to import leaders" });
    }
  });

  // Update leader images
  app.post("/api/admin/update-leader-images", async (req, res) => {
    try {
      await updateLeaderImages();
      res.json({ success: true, message: "Leader images updated successfully" });
    } catch (error) {
      console.error("Error updating leader images:", error);
      res.status(500).json({ error: "Failed to update leader images" });
    }
  });

  // Import training data from JSON files
  app.post("/api/admin/import-training-data", async (req, res) => {
    try {
      await importTrainingData();
      res.json({ success: true, message: "Training data imported successfully" });
    } catch (error) {
      console.error("Error importing training data:", error);
      res.status(500).json({ error: "Failed to import training data" });
    }
  });

  // Update leaders (batch update)
  app.post("/api/admin/update-leaders", async (req, res) => {
    try {
      const updates = req.body.updates;
      
      if (!Array.isArray(updates)) {
        return res.status(400).json({ error: "Updates must be an array" });
      }

      const results = [];
      for (const update of updates) {
        if (update.id && update.data) {
          try {
            const updatedLeader = await storage.updateLeader(update.id, update.data);
            results.push({ id: update.id, success: true, leader: updatedLeader });
          } catch (error) {
            results.push({ id: update.id, success: false, error: error.message });
          }
        }
      }

      res.json({ 
        success: true, 
        message: `Processed ${updates.length} leader updates`,
        results
      });
    } catch (error) {
      console.error("Error in batch leader update:", error);
      res.status(500).json({ error: "Failed to update leaders" });
    }
  });

  // Get system statistics
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const leaders = await storage.getLeaders();
      const users = await storage.getAllUsers(); // You'd need to implement this
      
      // Basic stats - you can expand this
      const stats = {
        totalLeaders: leaders.length,
        totalUsers: users?.length || 0,
        timestamp: new Date().toISOString()
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });
}