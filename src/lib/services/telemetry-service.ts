import { supabase } from "@/integrations/supabase/client";

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
    private flushInterval: number = 5000; // 5 seconds
    private timer: NodeJS.Timeout | null = null;
    private isFlushing: boolean = false;

    constructor() {
        if (typeof window !== 'undefined') {
            this.startFlushing();
            window.addEventListener('beforeunload', () => this.flush());
        }
    }

    private startFlushing() {
        this.timer = setInterval(() => this.flush(), this.flushInterval);
    }

    public track(event: TelemetryEvent) {
        console.log('[Telemetry] Buffered:', event);
        this.buffer.push({
            ...event,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
        });
    }

    public async flush() {
        // Prevent concurrent flushes and avoid interfering with main app
        if (this.buffer.length === 0 || this.isFlushing) return;

        this.isFlushing = true;
        const eventsToFlush = [...this.buffer];
        this.buffer = [];

        console.log('[Telemetry] Flushing events:', eventsToFlush.length);

        // Use completely isolated try-catch - NEVER let telemetry errors affect main app
        try {
            // Set a hard 8s timeout using AbortController
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

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

            clearTimeout(timeoutId);

            if (error) {
                console.warn('[Telemetry] Flush failed (non-critical):', error.message);
                // Only retry buffer if it's small - don't let it grow forever
                if (eventsToFlush.length < 20 && this.buffer.length < 50) {
                    this.buffer = [...eventsToFlush, ...this.buffer];
                }
            } else {
                console.log('[Telemetry] Flush successful');
            }
        } catch (err: any) {
            // Completely swallow all errors - telemetry should NEVER break the app
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
