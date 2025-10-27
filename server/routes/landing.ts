import { Router, Request, Response } from 'express';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Landing page route - serves static landing page for leadertalk.app
router.get('/', (req: Request, res: Response) => {
  // Check if this is the main domain (leadertalk.app) vs app subdomain (app.leadertalk.app)
  const hostname = req.hostname || req.get('host') || '';
  
  console.log(`Landing route accessed - hostname: ${hostname}, url: ${req.url}`);
  
  // If it's the app subdomain, let the client app handle it
  if (hostname.startsWith('app.') || hostname.includes('localhost:5173') || hostname.includes('localhost:3000')) {
    // This should be handled by the client app, not the landing page
    return res.status(404).json({ error: 'Client app route - should be handled by Vite/client' });
  }
  
  // For the main domain (leadertalk.app), serve the static landing page
  const landingPagePath = path.join(__dirname, '../landing/index.html');
  
  res.sendFile(landingPagePath, (err) => {
    if (err) {
      console.error('Error serving landing page:', err);
      res.status(500).json({ error: 'Failed to serve landing page' });
    }
  });
});

// Serve landing page assets
router.use('/landing', express.static(path.join(__dirname, '../landing'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Landing page at /landing path for app.leadertalk.app/landing
router.get('/landing', (req: Request, res: Response) => {
  const landingPagePath = path.join(__dirname, '../landing/index.html');
  res.sendFile(landingPagePath, (err) => {
    if (err) {
      console.error('Error serving landing page:', err);
      res.status(500).json({ error: 'Failed to serve landing page' });
    }
  });
});

// Contact form endpoint for landing page
router.post('/api/contact', async (req: Request, res: Response) => {
  try {
    const { name, email, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, and message are required' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }
    
    // Log the contact form submission (in production, you'd save to database or send email)
    console.log('Contact form submission:', {
      name,
      email,
      message,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // TODO: In production, implement actual email sending or database storage
    // For now, just log and return success
    
    res.json({ 
      success: true, 
      message: 'Thank you for your message. We will get back to you soon!' 
    });
    
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      error: 'Failed to process contact form submission' 
    });
  }
});

export default router;
