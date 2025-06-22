import fs from "fs";
import path from "path";
import express, { Express } from "express";

interface BuildPaths {
  staticDir: string;
  indexFile: string;
}

/**
 * Configures static file serving for production deployment
 * Handles multiple build output locations with proper fallbacks
 */
export function configureStaticServing(app: Express): void {
  const buildPaths = _resolveBuildPaths();
  _validateBuildOutput(buildPaths);
  _setupStaticMiddleware(app, buildPaths);
  _setupSPAFallback(app, buildPaths);
}

/**
 * Validates deployment build configuration
 * Ensures all required files exist before starting server
 */
export function validateDeploymentConfig(): boolean {
  try {
    const buildPaths = _resolveBuildPaths();
    _validateBuildOutput(buildPaths);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the current build output directory path
 */
export function getBuildOutputPath(): string {
  return _resolveBuildPaths().staticDir;
}

// Private functions

function _resolveBuildPaths(): BuildPaths {
  const possiblePaths = [
    path.resolve("dist", "public"),
    path.resolve("public"),
    path.resolve("client", "dist")
  ];
  
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      return {
        staticDir: testPath,
        indexFile: path.join(testPath, "index.html")
      };
    }
  }
  
  throw new Error(`No build output found. Searched: ${possiblePaths.join(", ")}`);
}

function _validateBuildOutput(paths: BuildPaths): void {
  if (!fs.existsSync(paths.indexFile)) {
    throw new Error(`Build incomplete: ${paths.indexFile} not found`);
  }
}

function _setupStaticMiddleware(app: Express, paths: BuildPaths): void {
  const cacheConfig = process.env.NODE_ENV === "production" 
    ? { maxAge: "1y", etag: false }
    : { maxAge: "0" };
    
  app.use(express.static(paths.staticDir, cacheConfig));
}

function _setupSPAFallback(app: Express, paths: BuildPaths): void {
  app.use("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "API route not found" });
    }
    res.sendFile(paths.indexFile);
  });
}

export default {
  configureStaticServing,
  validateDeploymentConfig,
  getBuildOutputPath
};