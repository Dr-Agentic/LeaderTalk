import { Express, Request, Response } from "express";

export function registerCookieTestRoutes(app: Express) {
  // Test cookie setting in production
  app.get("/api/test-cookie", (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Set a test cookie with fixed production settings
    res.cookie('test-cookie', 'test-value', {
      secure: isProduction,
      httpOnly: true,
      maxAge: 60000, // 1 minute
      sameSite: 'lax' as const,
      path: '/'
      // No domain set - let browser handle automatically
    });

    res.json({
      message: 'Test cookie set',
      environment: isProduction ? 'production' : 'development',
      cookieSettings: {
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        domain: isProduction ? process.env.PROD_COOKIE_DOMAIN : undefined,
        httpOnly: true
      }
    });
  });

  // Check if test cookie was received
  app.get("/api/check-cookie", (req, res) => {
    const testCookie = req.cookies['test-cookie'];
    const sessionCookie = req.cookies['leadertalk.sid'];
    
    res.json({
      testCookieReceived: !!testCookie,
      testCookieValue: testCookie,
      sessionCookieReceived: !!sessionCookie,
      allCookies: req.cookies,
      headers: {
        cookie: req.headers.cookie || 'none'
      }
    });
  });
}