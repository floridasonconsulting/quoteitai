import { loadStripe, Stripe } from '@stripe/stripe-js';

// Initialize Stripe (using publishable key from environment)
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error('Stripe publishable key not found in environment variables');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface CreatePaymentIntentParams {
  quoteId: string;
  amount: number;
  currency?: string;
  paymentType: 'full' | 'deposit';
  depositPercentage?: number;
}

/**
 * Create a payment intent for a quote via Supabase Edge Function
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<{ id: string; url: string }> {
  try {
    // Import supabase client
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Call Supabase Edge Function to create payment intent
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: params,
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to create payment intent');
    }

    if (!data || !data.id) {
      throw new Error('Invalid response from payment service');
    }

    return {
      id: data.id,
      url: data.url, // Stripe Checkout Session URL
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

/**
 * Confirm a payment
 */
export async function confirmPayment(
  clientSecret: string,
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const stripe = await getStripe();
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    const { error } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethodId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error confirming payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment failed',
    };
  }
}

/**
 * Calculate deposit amount based on percentage
 */
export function calculateDepositAmount(
  totalAmount: number,
  depositPercentage: number
): number {
  return Math.round(totalAmount * (depositPercentage / 100));
}
