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
        if (this.buffer.length === 0) return;

        const eventsToFlush = [...this.buffer];
        this.buffer = [];

        console.log('[Telemetry] Flushing events:', eventsToFlush.length);

        try {
            const { error } = await (supabase.from('proposal_analytics' as any) as any).insert(
                eventsToFlush.map(e => ({
                    quote_id: e.quoteId,
                    session_id: e.sessionId,
                    section_id: e.sectionId,
                    dwell_time_ms: e.dwellTimeMs,
                    is_owner: !!e.isOwner,
                    user_agent: e.userAgent,
                    metadata: e.metadata || {}
                })) as any
            );

            if (error) {
                console.error('[Telemetry] Flush failed:', error);
                // Put events back in buffer
                this.buffer = [...eventsToFlush, ...this.buffer];
            }
        } catch (err) {
            console.error('[Telemetry] Critical error during flush:', err);
            this.buffer = [...eventsToFlush, ...this.buffer];
        }
    }

    public cleanup() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
}

export const telemetryService = new TelemetryService();
