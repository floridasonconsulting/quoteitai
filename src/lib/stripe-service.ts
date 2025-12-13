
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

export interface StripeInvoice {
  id: string;
  customer: string;
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  invoice_pdf?: string;
  hosted_invoice_url?: string;
  created: number;
  due_date?: number;
  metadata: Record<string, string>;
}

export interface CreateInvoiceParams {
  quoteId: string;
  customerId?: string;
  customerEmail: string;
  customerName: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitAmount: number;
    taxRate?: number;
  }>;
  dueDate?: Date;
  notes?: string;
  metadata?: Record<string, string>;
}

export interface PaymentReminderConfig {
  enabled: boolean;
  firstReminder: number; // days before due date
  secondReminder: number; // days before due date
  finalReminder: number; // days after due date
}

/**
 * Create a payment intent for a quote via Supabase Edge Function
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<{ id: string; url: string }> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
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
      url: data.url,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

/**
 * Create a Stripe invoice from an accepted quote
 * This enables proper invoicing workflow with payment tracking
 */
export async function createInvoiceFromQuote(
  params: CreateInvoiceParams
): Promise<StripeInvoice> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('create-stripe-invoice', {
      body: params,
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to create invoice');
    }

    if (!data || !data.id) {
      throw new Error('Invalid response from invoice service');
    }

    return data as StripeInvoice;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
}

/**
 * Get invoice status and payment details
 */
export async function getInvoiceStatus(invoiceId: string): Promise<StripeInvoice> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('get-stripe-invoice', {
      body: { invoiceId },
    });

    if (error) {
      throw new Error(error.message || 'Failed to get invoice status');
    }

    return data as StripeInvoice;
  } catch (error) {
    console.error('Error getting invoice status:', error);
    throw error;
  }
}

/**
 * Send invoice to customer via email
 */
export async function sendInvoice(invoiceId: string): Promise<{ success: boolean }> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('send-stripe-invoice', {
      body: { invoiceId },
    });

    if (error) {
      throw new Error(error.message || 'Failed to send invoice');
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending invoice:', error);
    throw error;
  }
}

/**
 * Configure automatic payment reminders for an invoice
 */
export async function configurePaymentReminders(
  invoiceId: string,
  config: PaymentReminderConfig
): Promise<{ success: boolean }> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('configure-payment-reminders', {
      body: { invoiceId, config },
    });

    if (error) {
      throw new Error(error.message || 'Failed to configure reminders');
    }

    return { success: true };
  } catch (error) {
    console.error('Error configuring payment reminders:', error);
    throw error;
  }
}

/**
 * Void an invoice (cancel it)
 */
export async function voidInvoice(invoiceId: string): Promise<{ success: boolean }> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('void-stripe-invoice', {
      body: { invoiceId },
    });

    if (error) {
      throw new Error(error.message || 'Failed to void invoice');
    }

    return { success: true };
  } catch (error) {
    console.error('Error voiding invoice:', error);
    throw error;
  }
}

/**
 * Mark invoice as paid (for manual payments)
 */
export async function markInvoicePaid(
  invoiceId: string,
  paymentMethod: string
): Promise<{ success: boolean }> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('mark-invoice-paid', {
      body: { invoiceId, paymentMethod },
    });

    if (error) {
      throw new Error(error.message || 'Failed to mark invoice as paid');
    }

    return { success: true };
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
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

/**
 * Format amount for display (convert cents to dollars)
 */
export function formatAmount(amountInCents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amountInCents / 100);
}
