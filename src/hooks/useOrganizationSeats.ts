import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SeatInfo {
    used: number;
    limit: number;
    tier: string;
    loading: boolean;
}

export const useOrganizationSeats = (orgId: string | null) => {
    const [seatInfo, setSeatInfo] = useState<SeatInfo>({
        used: 0,
        limit: 0,
        tier: '',
        loading: true
    });

    useEffect(() => {
        const fetchSeats = async () => {
            if (!orgId) {
                setSeatInfo(prev => ({ ...prev, loading: false }));
                return;
            }

            setSeatInfo(prev => ({ ...prev, loading: true }));

            try {
                const { data: org, error: orgError } = await supabase
                    .from('organizations')
                    .select('subscription_tier')
                    .eq('id', orgId)
                    .single();

                if (orgError) throw orgError;

                const { count, error: countError } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('organization_id', orgId);

                if (countError) throw countError;

                const limits: Record<string, number> = {
                    starter: 1,
                    pro: 2,
                    business: 5,
                    enterprise: 10,
                    max_ai: 9999
                };

                setSeatInfo({
                    used: count || 0,
                    limit: limits[org?.subscription_tier || 'starter'] || 1,
                    tier: org?.subscription_tier || 'starter',
                    loading: false
                });
            } catch (error) {
                console.error('Error fetching seat info:', error);
                setSeatInfo(prev => ({ ...prev, loading: false }));
            }
        };

        fetchSeats();
    }, [orgId]);

    return seatInfo;
};
