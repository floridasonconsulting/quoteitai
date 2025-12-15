import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCustomers } from '@/lib/services/customer-service';
import { getItems } from '@/lib/services/item-service';
import { getQuotes } from '@/lib/services/quote-service';

/**
 * Hook to warm up the Service Worker cache by fetching fresh data
 * from Supabase on initial load.
 */
export function useCacheWarmup() {
    const { user } = useAuth();
    // Use a ref to ensure we only warm up once per session/mount
    const hasWarmedUp = useRef(false);

    useEffect(() => {
        // Only run if user is logged in and we haven't warmed up yet
        if (!user?.id || hasWarmedUp.current) return;

        const warmUp = async () => {
            console.log('🔥 [CacheWarmup] Starting cache warmup...');
            hasWarmedUp.current = true;

            try {
                // Run in parallel to maximize specific network utilization
                // These calls with forceRefresh: true will bypass local cache/IDB returns
                // and hit the network, which the Service Worker will then cache.
                const startTime = performance.now();

                await Promise.all([
                    getCustomers(user.id, { forceRefresh: true }),
                    getItems(user.id, { forceRefresh: true }),
                    getQuotes(user.id, { forceRefresh: true }),
                ]);

                const duration = performance.now() - startTime;
                console.log(`✅ [CacheWarmup] Cache warmup complete in ${duration.toFixed(0)}ms`);
            } catch (error) {
                console.error('❌ [CacheWarmup] Failed to warm cache:', error);
            }
        };

        // Small delay to prioritize UI rendering first
        const timer = setTimeout(() => {
            warmUp();
        }, 1000);

        return () => clearTimeout(timer);
    }, [user?.id]);
}
