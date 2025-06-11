/**
 * Environment configuration module
 * Handles development and production environment variables with PROD_ prefix fallback
 */

function getConfigValue(key: string): string | undefined {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // Try PROD_ prefixed version first, fallback to regular version
    return process.env[`PROD_${key}`] || process.env[key];
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

// Log configuration status (without sensitive values)
console.log("🔧 Environment Configuration Loaded:");
console.log(`   Environment: ${config.nodeEnv}`);
console.log(
  `   Database: ${config.database.url ? "✅ Connected" : "❌ Missing"}`,
);
console.log(
  `   Stripe: ${config.stripe.secretKey ? "✅ Configured" : "❌ Missing"}`,
);
console.log(
  `   OpenAI: ${config.openai.apiKey ? "✅ Configured" : "❌ Missing"}`,
);
console.log(
  `   Session: ${config.session.secret ? "✅ Configured" : "❌ Missing"}`,
);
console.log(
  `   Supabase: ${config.supabase.url ? "✅ Configured" : "❌ Missing"}`,
);
console.log(`   Cookie Domain: ${config.session.cookieDomain || "Not set"}`);

// Debug cookie domain configuration
console.log("🔍 Cookie Domain Debug:", {
  NODE_ENV: process.env.NODE_ENV,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || "undefined",
  PROD_COOKIE_DOMAIN: process.env.PROD_COOKIE_DOMAIN || "undefined",
  resolved: config.session.cookieDomain || "undefined"
});
