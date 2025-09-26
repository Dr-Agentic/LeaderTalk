import { Express, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { storage } from "../storage";
import { generateLeaderAlternative } from "../openai";

export function registerLeaderRoutes(app: Express) {
  // Get all leaders
  app.get("/api/leaders", async (req, res) => {
    try {
      const leaders = await storage.getLeaders();
      res.json(leaders);
    } catch (error) {
      console.error("Error fetching leaders:", error);
      res.status(500).json({ error: "Failed to fetch leaders" });
    }
  });

  // Get specific leader
  app.get("/api/leaders/:id", async (req, res) => {
    try {
      const leaderId = parseInt(req.params.id);
      if (isNaN(leaderId)) {
        return res.status(400).json({ error: "Invalid leader ID" });
      }

      const leader = await storage.getLeader(leaderId);
      if (!leader) {
        return res.status(404).json({ error: "Leader not found" });
      }

      res.json(leader);
    } catch (error) {
      console.error("Error fetching leader:", error);
      res.status(500).json({ error: "Failed to fetch leader" });
    }
  });

  // Get leader alternatives for a specific text
  app.get("/api/leaders/:id/alternatives", requireAuth, async (req, res) => {
    try {
      const leaderId = parseInt(req.params.id);
      const { text } = req.query;

      if (isNaN(leaderId)) {
        return res.status(400).json({ error: "Invalid leader ID" });
      }

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "Text parameter is required" });
      }

      // Check if we already have an alternative for this text and leader
      const existingAlternative = await storage.getLeaderAlternative(leaderId, text);
      
      if (existingAlternative) {
        return res.json({
          id: existingAlternative.id,
          alternativeText: existingAlternative.alternativeText,
          cached: true
        });
      }

      // Generate new alternative
      const userId = req.session?.userId;
      const alternativeText = await generateLeaderAlternative(leaderId, text);
      
      // Cache the result
      const newAlternative = await storage.createLeaderAlternative({
        leaderId,
        originalText: text,
        alternativeText,
        createdBy: userId || null
      });

      res.json({
        id: newAlternative.id,
        alternativeText: newAlternative.alternativeText,
        cached: false
      });
    } catch (error) {
      console.error("Error generating leader alternative:", error);
      res.status(500).json({ error: "Failed to generate alternative" });
    }
  });

  // Get all alternatives for a leader
  app.get("/api/leaders/:id/all-alternatives", requireAuth, async (req, res) => {
    try {
      const leaderId = parseInt(req.params.id);
      
      if (isNaN(leaderId)) {
        return res.status(400).json({ error: "Invalid leader ID" });
      }

      const alternatives = await storage.getLeaderAlternatives(leaderId);
      res.json(alternatives);
    } catch (error) {
      console.error("Error fetching leader alternatives:", error);
      res.status(500).json({ error: "Failed to fetch alternatives" });
    }
  });
}