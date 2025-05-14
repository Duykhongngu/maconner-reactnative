/**
 * Configuration file for the application
 * 
 * This file manages loading and providing environment variables
 * and other configuration values needed by the application.
 * 
 * IMPORTANT: Do NOT hardcode sensitive information like API keys.
 * Use environment variables or secure storage instead.
 */

// Import environment variables
import Constants from 'expo-constants';

// Helper function to safely get environment variables
const getEnv = (key: string, defaultValue: string = ''): string => {
  // Try to get from process.env (for Jest tests and direct Node.js usage)
  if (process.env[key]) {
    return process.env[key] || defaultValue;
  }
  
  // Try to get from Expo's Constants.expoConfig.extra (for Expo managed workflow)
  if (Constants.expoConfig?.extra && key in Constants.expoConfig.extra) {
    return Constants.expoConfig.extra[key] || defaultValue;
  }
  
  return defaultValue;
};

export const Config = {
  // MoMo API Keys
  MOMO: {
    PARTNER_CODE: getEnv('MOMO_PARTNER_CODE'),
    ACCESS_KEY: getEnv('MOMO_ACCESS_KEY'),
    SECRET_KEY: getEnv('MOMO_SECRET_KEY'),
    ENDPOINT: getEnv('MOMO_ENDPOINT'),
    REDIRECT_URL: getEnv('MOMO_REDIRECT_URL'),
    POS_ENDPOINT: getEnv('MOMO_POS_ENDPOINT'),
    PUBLIC_KEY: getEnv('MOMO_PUBLIC_KEY'),
  },
   
  
  // Firebase Configuration
  FIREBASE: {
    API_KEY: getEnv('FIREBASE_API_KEY'),
    AUTH_DOMAIN: getEnv('FIREBASE_AUTH_DOMAIN'),
    PROJECT_ID: getEnv('FIREBASE_PROJECT_ID'),
    STORAGE_BUCKET: getEnv('FIREBASE_STORAGE_BUCKET'),
    MESSAGING_SENDER_ID: getEnv('FIREBASE_MESSAGING_SENDER_ID'),
    APP_ID: getEnv('FIREBASE_APP_ID'),
    MEASUREMENT_ID: getEnv('FIREBASE_MEASUREMENT_ID'),
  },
  
  // Cloudinary Configuration
  CLOUDINARY: {
    URL: getEnv('CLOUDINARY_URL'),
    UPLOAD_PRESET: getEnv('CLOUDINARY_UPLOAD_PRESET'),
  },
};

export default Config; 