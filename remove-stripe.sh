#!/bin/bash

# Script to remove Stripe dependency
echo "🔄 Removing Stripe dependency..."

# Remove the stripe-react-native package
echo "📦 Uninstalling @stripe/stripe-react-native package..."
npm uninstall @stripe/stripe-react-native

# Clean up node_modules
echo "🧹 Cleaning project cache..."
rm -rf node_modules/.cache

# Install remaining dependencies
echo "📦 Reinstalling dependencies..."
npm install

echo "✅ Stripe payment has been removed from the project!"
echo "Remember to commit your changes to the repository." 