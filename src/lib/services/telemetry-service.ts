import { supabase } from "@/integrations/supabase/client";

// FEATURE FLAG: Disable telemetry temporarily to debug connection issues
const TELEMETRY_ENABLED = false;

export interface TelemetryEvent {
    quoteId: string;
    sessionId: string;
    sectionId: string;
    dwellTimeMs: number;
    isOwner?: boolean;
    userAgent?: string;
    metadata?: Record<string, any>;
}

class TelemetryService {
    private buffer: TelemetryEvent[] = [];
    private flushInterval: number = 10000; // Increased to 10 seconds
    private timer: NodeJS.Timeout | null = null;
    private isFlushing: boolean = false;

    constructor() {
        if (typeof window !== 'undefined' && TELEMETRY_ENABLED) {
            this.startFlushing();
            // Don't add beforeunload handler - it can cause issues
        }
    }

    private startFlushing() {
        this.timer = setInterval(() => this.flush(), this.flushInterval);
    }

    public track(event: TelemetryEvent) {
        if (!TELEMETRY_ENABLED) {
            console.log('[Telemetry] DISABLED - not tracking:', event.sectionId);
            return;
        }
        console.log('[Telemetry] Buffered:', event);
        this.buffer.push({
            ...event,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
        });
    }

    public async flush() {
        if (!TELEMETRY_ENABLED) return;

        // Prevent concurrent flushes and avoid interfering with main app
        if (this.buffer.length === 0 || this.isFlushing) return;

        this.isFlushing = true;
        const eventsToFlush = [...this.buffer];
        this.buffer = [];

        console.log('[Telemetry] Flushing events:', eventsToFlush.length);

        // Use completely isolated try-catch - NEVER let telemetry errors affect main app
        try {
            const { error } = await supabase
                .from('proposal_analytics' as any)
                .insert(
                    eventsToFlush.map(e => ({
                        quote_id: e.quoteId,
                        session_id: e.sessionId,
                        section_id: e.sectionId,
                        dwell_time_ms: e.dwellTimeMs,
                        is_owner: !!e.isOwner,
                        user_agent: e.userAgent,
                        metadata: e.metadata || {}
                    })) as any,
                    { count: null } // Suppress count for performance
                );

            if (error) {
                console.warn('[Telemetry] Flush failed (non-critical):', error.message);
            } else {
                console.log('[Telemetry] Flush successful');
            }
        } catch (err: any) {
            console.warn('[Telemetry] Flush error (ignored):', err?.message || err);
        } finally {
            this.isFlushing = false;
        }
    }

    public cleanup() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
}

export const telemetryService = new TelemetryService();
