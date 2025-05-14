# Starter base

A starting point to help you set up your project quickly and use the common components provided by `react-native-reusables`. The idea is to make it easier for you to get started.

## Features

- NativeWind v4
- Dark and light mode
  - Android Navigation Bar matches mode
  - Persistent mode
- Common components
  - ThemeToggle, Avatar, Button, Card, Progress, Text, Tooltip

<img src="https://github.com/mrzachnugent/react-native-reusables/assets/63797719/42c94108-38a7-498b-9c70-18640420f1bc"
     alt="starter-base-template"
     style="width:270px;" />

## Environment Setup

This project uses environment variables for API keys and configurations. To set up:

1. Create a `.env` file in the root directory with the following content:

```
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id

# MoMo Configuration
MOMO_PARTNER_CODE=your_momo_partner_code
MOMO_ACCESS_KEY=your_momo_access_key
MOMO_SECRET_KEY=your_momo_secret_key
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=your_app_scheme://momo-return
MOMO_POS_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/pos
```

2. Replace the placeholder values with your actual API keys

Note: Never commit your `.env` file to version control.
