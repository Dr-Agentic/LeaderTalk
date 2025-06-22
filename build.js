#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting production build process...');

try {
  // Step 1: Build the frontend
  console.log('📦 Building frontend with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });

  // Step 2: Build the backend
  console.log('⚙️ Building backend with esbuild...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });

  // Step 3: Fix static file paths
  console.log('🔧 Configuring static file paths...');
  
  const distPublicDir = path.resolve('dist', 'public');
  const publicDir = path.resolve('public');
  
  if (fs.existsSync(distPublicDir)) {
    // Remove existing public directory if it exists
    if (fs.existsSync(publicDir)) {
      fs.rmSync(publicDir, { recursive: true, force: true });
    }
    
    // Move dist/public to public for compatibility with serveStatic function
    fs.renameSync(distPublicDir, publicDir);
    console.log('✅ Static files moved to public/ directory');
  }

  // Step 4: Create production environment file
  console.log('📝 Creating production configuration...');
  
  const prodConfig = `# Production Environment Configuration
NODE_ENV=production
PORT=5000
`;
  
  fs.writeFileSync('.env.production', prodConfig);

  console.log('✅ Production build completed successfully!');
  console.log('📋 Build summary:');
  console.log('  - Frontend: Built and optimized');
  console.log('  - Backend: Bundled for production');
  console.log('  - Static files: Configured for deployment');
  console.log('  - Environment: Production ready');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}