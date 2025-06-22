#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('Setting up deployment configuration...');

// Create deployment configuration
const deployConfig = {
  buildCommand: "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
  startCommand: "NODE_ENV=production node dist/index.js",
  installCommand: "npm install --include=dev",
  nodeVersion: "20"
};

// Write deployment configuration
fs.writeFileSync('replit.toml', `
[deployment]
run = "${deployConfig.startCommand}"
build = "${deployConfig.buildCommand}"
ignorePaths = ["client/src", "node_modules/.cache", "*.log"]

[build]
include = ["dist", "public", "package.json", "package-lock.json"]
exclude = ["client/src", "scripts", "*.md"]
`);

// Create production start script
const prodScript = `#!/usr/bin/env node

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
`;

fs.writeFileSync('start.js', prodScript);

console.log('Deployment configuration created successfully');