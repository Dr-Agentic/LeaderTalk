import { Express, Request, Response } from "express";

export function registerDebugRoutes(app: Express) {
  // Debug session information
  app.get("/api/debug/session", (req, res) => {
    const sessionExists = !!req.session;
    const sessionId = req.sessionID ? req.sessionID.substring(0, 8) + '…' : 'None';
    const userId = req.session?.userId || null;
    const isLoggedIn = !!userId;
    const cookiePresent = !!req.headers.cookie;
    const sessionAge = req.session?.cookie?.maxAge || 0;
    
    // Parse cookies to see what's actually being sent
    const cookies = req.headers.cookie ? req.headers.cookie.split(';').reduce((acc: any, cookie) => {
      const [name, value] = cookie.trim().split('=');
      acc[name] = value;
      return acc;
    }, {}) : {};
    
    // Log cookie mismatch issue
    console.log("🍪 COOKIE DEBUG:", {
      expectedCookieName: 'leadertalk.sid',
      hasLeadertalkSid: !!cookies['leadertalk.sid'],
      hasConnectSid: !!cookies['connect.sid'],
      allCookieNames: Object.keys(cookies),
      sessionExists,
      userId,
      sessionId
    });
    
    // Get cookie headers for debugging
    const cookieExists = !!req.headers.cookie;
    const cookieHeader = req.headers.cookie ? 
      (req.headers.cookie.length > 50 ? 
        req.headers.cookie.substring(0, 20) + '…' : 
        req.headers.cookie) : 
      'None';

    const debugInfo = {
      sessionExists,
      sessionId,
      userId,
      isLoggedIn,
      cookiePresent,
      sessionAge,
      cookieExists,
      cookieHeader,
      nodeEnv: process.env.NODE_ENV,
      cookieDomain: process.env.PROD_COOKIE_DOMAIN || process.env.COOKIE_DOMAIN,
      host: req.headers.host,
      userAgent: req.headers['user-agent']?.substring(0, 50) + '...'
    };

    // Enhanced logging for production debugging
    if (process.env.NODE_ENV === 'production') {
      console.log("Production session debug:", { 
        sessionExists, 
        userId, 
        isLoggedIn, 
        cookiePresent,
        host: req.headers.host,
        cookieDomain: process.env.PROD_COOKIE_DOMAIN || process.env.COOKIE_DOMAIN
      });
    }

    res.json(debugInfo);
  });

  // Debug environment info
  app.get("/api/debug/env", (req, res) => {
    const envInfo = {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      port: process.env.PORT || 'unknown',
      hasDatabase: !!process.env.DATABASE_URL,
      timestamp: new Date().toISOString()
    };

    res.json(envInfo);
  });

  // Debug headers
  app.get("/api/debug/headers", (req, res) => {
    res.json({
      headers: req.headers,
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
}