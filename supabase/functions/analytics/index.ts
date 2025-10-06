import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsEvent {
  event: string;
  timestamp: string;
  payload?: Record<string, any>;
}

// Batch processing queue
let eventQueue: AnalyticsEvent[] = [];
let processingTimeout: number | null = null;

/**
 * Process events asynchronously (fire-and-forget)
 * Batches events to reduce database load
 */
async function processAnalytics(event: AnalyticsEvent): Promise<void> {
  try {
    // Add to queue
    eventQueue.push(event);
    
    // Clear existing timeout
    if (processingTimeout) {
      clearTimeout(processingTimeout);
    }
    
    // Process batch after 2 seconds or when queue reaches 10 events
    if (eventQueue.length >= 10) {
      await flushQueue();
    } else {
      processingTimeout = setTimeout(() => flushQueue(), 2000);
    }
  } catch (error) {
    console.error('[Analytics] Error queuing event:', error);
    // Never throw - analytics errors should never impact the system
  }
}

/**
 * Flush the event queue (batch processing)
 */
async function flushQueue(): Promise<void> {
  if (eventQueue.length === 0) return;
  
  const batch = [...eventQueue];
  eventQueue = [];
  processingTimeout = null;
  
  try {
    console.log(`[Analytics] Processing batch of ${batch.length} events`);
    
    // TODO: If you want to store analytics, implement database insert here
    // For now, just log the events
    for (const event of batch) {
      console.log(`[Analytics Event] ${event.event}:`, event.payload);
    }
    
    // Optional: Insert into database
    // const supabase = createClient(
    //   Deno.env.get('SUPABASE_URL')!,
    //   Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    // );
    // await supabase.from('analytics_events').insert(batch);
    
  } catch (error) {
    console.error('[Analytics] Error flushing queue:', error);
    // Never throw - analytics errors should never impact the system
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the event
    const event: AnalyticsEvent = await req.json();
    
    // Validate event structure
    if (!event.event || !event.timestamp) {
      return new Response(
        JSON.stringify({ error: 'Invalid event format' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Fire-and-forget: respond immediately before processing
    // This ensures <50ms response time
    const response = new Response(
      JSON.stringify({ received: true }), 
      { 
        status: 202, // Accepted - processing asynchronously
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
    // Process asynchronously (non-blocking)
    processAnalytics(event).catch(error => {
      console.error('[Analytics] Background processing error:', error);
    });
    
    return response;
    
  } catch (error) {
    console.error('[Analytics] Request error:', error);
    
    // Still return success to prevent client-side errors
    // Analytics failures should never impact the user experience
    return new Response(
      JSON.stringify({ received: true, warning: 'Processing error' }), 
      { 
        status: 202,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
