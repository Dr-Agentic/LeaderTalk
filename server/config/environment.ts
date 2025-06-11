/**
 * Environment configuration module
 * Handles development and production environment variables with PROD_ prefix fallback
 */

function getConfigValue(key: string): string | undefined {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // Try PROD_ prefixed version first, fallback to regular version
    const prodValue = process.env[`PROD_${key}`];
    const regularValue = process.env[key];
    const result = prodValue || regularValue;
    

    
    return result;
  }

  // Development: use regular version
  return process.env[key];
}

function getRequiredConfigValue(key: string): string {
  const value = getConfigValue(key);
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

export const config = {
  // Environment info
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",

  // Database configuration
  database: {
    url: getRequiredConfigValue("DATABASE_URL"),
  },

  // Stripe configuration
  stripe: {
    secretKey: getRequiredConfigValue("STRIPE_SECRET_KEY"),
    publicKey: getConfigValue("VITE_STRIPE_PUBLIC_KEY"), // Optional for server-side
  },

  // OpenAI configuration
  openai: {
    apiKey: getRequiredConfigValue("OPENAI_API_KEY"),
  },

  // Session configuration
  session: {
    secret: getRequiredConfigValue("SESSION_SECRET"),
    cookieDomain: getConfigValue("COOKIE_DOMAIN"),
  },

  // Supabase configuration
  supabase: {
    url: getConfigValue("VITE_SUPABASE_URL"),
    anonKey: getConfigValue("VITE_SUPABASE_ANON_KEY"),
  },

  // Server configuration
  server: {
    port: process.env.PORT || "5000",
  },
};

console.error(config.supabase);

// Export individual getters for special cases
export { getConfigValue, getRequiredConfigValue };
