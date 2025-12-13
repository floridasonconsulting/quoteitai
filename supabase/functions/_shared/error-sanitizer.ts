/**
 * Error sanitization for edge functions
 * Prevents information leakage in production
 */

export function sanitizeError(error: unknown): string {
  const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';
  
  // In development, return full error for debugging
  if (isDevelopment) {
    return error instanceof Error ? error.message : String(error);
  }
  
  // Production: map to generic messages
  const errorMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  // Log full error server-side for debugging
  console.error('[INTERNAL ERROR]', error);
  
  // Return generic messages based on error type
  if (errorMsg.includes('auth') || errorMsg.includes('unauthorized')) {
    return 'Authentication failed. Please sign in again.';
  }
  if (errorMsg.includes('not found') || errorMsg.includes('no customer')) {
    return 'Resource not found.';
  }
  if (errorMsg.includes('stripe') || errorMsg.includes('payment')) {
    return 'Payment processing error. Please try again.';
  }
  if (errorMsg.includes('database') || errorMsg.includes('supabase')) {
    return 'Unable to process request.';
  }
  if (errorMsg.includes('invalid') || errorMsg.includes('required')) {
    return 'Invalid request data.';
  }
  
  // Default generic error
  return 'An error occurred. Please try again.';
}
