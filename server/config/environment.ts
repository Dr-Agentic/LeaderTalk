export const config = {
  server: {
    port: process.env.PORT || "5000",
    host: process.env.HOST || "0.0.0.0",
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  supabase: {
    url: process.env.VITE_SUPABASE_URL,
    anonKey: process.env.VITE_SUPABASE_ANON_KEY,
  },
  session: {
    secret: process.env.SESSION_SECRET || "your-session-secret-here",
    domain: process.env.COOKIE_DOMAIN,
  },
  environment: process.env.NODE_ENV || "development",
};