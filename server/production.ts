import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: Express) {
  // Try both possible build output locations
  const possiblePaths = [
    path.resolve(import.meta.dirname, "..", "dist", "public"),
    path.resolve(import.meta.dirname, "..", "public"),
    path.resolve(import.meta.dirname, "public")
  ];
  
  let distPath: string | null = null;
  
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      distPath = testPath;
      break;
    }
  }

  if (!distPath) {
    const errorMsg = `Could not find build directory. Tried: ${possiblePaths.join(', ')}. Make sure to build the client first with 'npm run build'.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const indexPath = path.join(distPath, "index.html");
  
  if (!fs.existsSync(indexPath)) {
    throw new Error(`index.html not found in ${distPath}. Build may be incomplete.`);
  }

  log(`Serving static files from: ${distPath}`);

  // Serve static files with proper caching headers
  app.use(express.static(distPath, {
    maxAge: process.env.NODE_ENV === "production" ? "1y" : "0",
    etag: false,
  }));

  // Handle client-side routing - serve index.html for all non-API routes
  app.use("*", (req, res) => {
    // Skip API routes
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "API route not found" });
    }
    
    try {
      res.sendFile(indexPath);
    } catch (error) {
      console.error("Error serving static files:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}