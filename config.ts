/**
 * Configuration file for the application
 * 
 * This file manages loading and providing environment variables
 * and other configuration values needed by the application.
 * 
 * IMPORTANT: Do NOT hardcode sensitive information like API keys.
 * Use environment variables or secure storage instead.
 */

// In a real app, use a proper environment variable library like react-native-config
// For now, we're creating a placeholder configuration

export const Config = {
  // Stripe API Keys
  // In production, these should be loaded from environment variables or secure storage
  STRIPE: {
    PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
    SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  }
};

export default Config; 