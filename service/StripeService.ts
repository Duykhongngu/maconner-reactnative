import { Alert } from 'react-native';
import axios from 'axios';
import { CartItem } from './checkout';

// Stripe API keys from your credentials
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51REnejE6nM1R0xHPhP4OBQCLmgYSSqX27zJVQnu2wT3CDYdKnHvntwhGfqyiAOCWF2i9QOwKDuVTzfd1C9SpkRCH00Ld1x0EYn';
const STRIPE_SECRET_KEY = 'sk_test_51REnejE6nM1R0xHPDUDrBca9Il4dSuBf7da5vBdJccDEaHxvFOvGCHaL6cxXk0EsyuWbSBXpjYlYPFnsLcJfgc89000zar9M2T';

// Base URL for Stripe API
const STRIPE_API_URL = 'https://api.stripe.com/v1';

// Create a payment intent for checkout
export const createPaymentIntent = async (
  amount: number,
  currency: string = 'vnd',
  description: string = 'NadShop Order'
): Promise<{ clientSecret: string } | null> => {
  try {
    // Convert amount to smallest currency unit (e.g., cents for USD)
    // For VND, which has no decimal places, we don't need to multiply
    const amountInSmallestUnit = Math.round(amount);
    
    // Make API request to create payment intent
    const response = await axios.post(
      `${STRIPE_API_URL}/payment_intents`,
      {
        amount: amountInSmallestUnit,
        currency,
        description,
        payment_method_types: ['card'],
      },
      {
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return { clientSecret: response.data.client_secret };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    Alert.alert('Payment Error', 'Could not initialize payment. Please try again.');
    return null;
  }
};

// Confirm a payment intent (to be called from your frontend)
export const confirmPayment = async (
  paymentIntentId: string,
  paymentMethodId: string
): Promise<boolean> => {
  try {
    const response = await axios.post(
      `${STRIPE_API_URL}/payment_intents/${paymentIntentId}/confirm`,
      {
        payment_method: paymentMethodId,
      },
      {
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data.status === 'succeeded';
  } catch (error) {
    console.error('Error confirming payment:', error);
    return false;
  }
};

// Format cart items for Stripe checkout (for receipt/description)
export const formatCartItemsForStripe = (items: CartItem[]): string => {
  return items.map(item => `${item.name} x${item.quantity}`).join(', ');
};

// Process a payment with Stripe
export const processStripePayment = async (
  amount: number,
  currency: string = 'vnd',
  items: CartItem[],
  customerEmail: string,
  customerName: string
): Promise<{ success: boolean; paymentIntentId?: string }> => {
  try {
    // Create description from cart items
    const description = `NadShop Order: ${formatCartItemsForStripe(items)}`;
    
    // Create a payment intent
    const paymentIntent = await createPaymentIntent(amount, currency, description);
    
    if (!paymentIntent?.clientSecret) {
      return { success: false };
    }

    // In a real implementation, you would return the client secret to your
    // frontend and complete the payment there using Stripe's SDK

    // For now, we'll simulate a successful payment
    return {
      success: true,
      paymentIntentId: paymentIntent.clientSecret.split('_secret_')[0],
    };
  } catch (error) {
    console.error('Error processing Stripe payment:', error);
    return { success: false };
  }
};

// Test if Stripe API key is valid
export const testStripeConnection = async (): Promise<boolean> => {
  try {
    // Try to retrieve balance, which requires authentication
    const response = await axios.get(`${STRIPE_API_URL}/balance`, {
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      },
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Stripe connection test failed:', error);
    return false;
  }
};

// Get Stripe public key
export const getStripePublishableKey = (): string => {
  return STRIPE_PUBLISHABLE_KEY;
};