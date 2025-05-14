const { config } = require("dotenv");

// Load environment variables from .env file
const env = config();

// Get default values from app.json
const appConfig = require("./app.json");

module.exports = {
  ...appConfig,
  expo: {
    ...appConfig.expo,
    extra: {
      ...appConfig.expo.extra,
      // Firebase Configuration
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
      FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,

      // MoMo Configuration
      MOMO_PARTNER_CODE: process.env.MOMO_PARTNER_CODE,
      MOMO_ACCESS_KEY: process.env.MOMO_ACCESS_KEY,
      MOMO_SECRET_KEY: process.env.MOMO_SECRET_KEY,
      MOMO_ENDPOINT: process.env.MOMO_ENDPOINT,
      MOMO_REDIRECT_URL: process.env.MOMO_REDIRECT_URL,
      MOMO_POS_ENDPOINT: process.env.MOMO_POS_ENDPOINT,
    },
  },
};
