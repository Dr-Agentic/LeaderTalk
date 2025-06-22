#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Check if build output exists
const distPath = path.resolve('dist', 'public');
const publicPath = path.resolve('public');

if (fs.existsSync(distPath) && !fs.existsSync(publicPath)) {
  console.log('Moving build files to correct location...');
  fs.renameSync(distPath, publicPath);
}

// Start the production server
import('./dist/index.js');
