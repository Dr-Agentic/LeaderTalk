#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Source and destination paths
const distPublicDir = path.join(rootDir, 'dist', 'public');
const publicDir = path.join(rootDir, 'public');

console.log('Post-build: Fixing static file paths for production deployment...');

try {
  // Check if dist/public exists
  if (fs.existsSync(distPublicDir)) {
    console.log('Found dist/public directory, moving files to public/');
    
    // Remove existing public directory if it exists
    if (fs.existsSync(publicDir)) {
      fs.rmSync(publicDir, { recursive: true, force: true });
    }
    
    // Create public directory
    fs.mkdirSync(publicDir, { recursive: true });
    
    // Copy all files from dist/public to public
    const copyRecursive = (src, dest) => {
      const stats = fs.statSync(src);
      if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        const files = fs.readdirSync(src);
        files.forEach(file => {
          copyRecursive(path.join(src, file), path.join(dest, file));
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    };
    
    copyRecursive(distPublicDir, publicDir);
    
    console.log('✅ Static files successfully moved to public/ directory');
    console.log('✅ Production deployment paths are now properly configured');
  } else {
    console.error('❌ dist/public directory not found. Build may have failed.');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Post-build script failed:', error.message);
  process.exit(1);
}