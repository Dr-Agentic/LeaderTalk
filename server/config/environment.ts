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

  // RevenueCat configuration
  revenueCat: {
    secretKey: getConfigValue("RC_SECRET_KEY"),
    publicKey: getConfigValue("RC_PUBLIC_KEY"),
    projectId: getConfigValue("RC_PROJECT_ID"),
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

// Export individual getters for special cases
export { getConfigValue, getRequiredConfigValue };

// Log configuration status (without sensitive values)
console.log("🔧 Environment Configuration Loaded:");
console.log(`   Environment: ${config.nodeEnv}`);
console.log(
  `   Database: ${config.database.url ? "✅ " + config.database.url.slice(0, 8) : "❌ Missing"}`,
);
console.log(
  `   Stripe: ${config.stripe.secretKey ? "✅ " + config.stripe.secretKey.slice(0, 8) : "❌ Missing"}`,
);
console.log(
  `   RevenueCat: ${config.revenueCat.secretKey ? "✅ " + config.revenueCat.secretKey.slice(0, 8) : "❌ Missing"}`,
);
console.log(
  `   RevenueCat: ${config.revenueCat.projectId ? "✅ " + config.revenueCat.projectId.slice(0, 8) : "❌ Missing"}`,
);
console.log(
  `   OpenAI: ${config.openai.apiKey ? "✅ " + config.openai.apiKey.slice(0, 8) : "❌ Missing"}`,
);
console.log(
  `   Session: ${config.session.secret ? "✅ " + config.session.secret.slice(0, 8) : "❌ Missing"}`,
);
console.log(
  `   Supabase: ${config.supabase.url ? "✅ " + config.supabase.url.slice(0, 8) : "❌ Missing"}`,
);
console.log(`   Cookie Domain: ${config.session.cookieDomain || "Not set"}`);
