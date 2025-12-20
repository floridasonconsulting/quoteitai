import { FollowUpSchedule } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toCamelCase, toSnakeCase } from './transformation-utils';

export const getFollowUpSchedule = async (quoteId: string): Promise<FollowUpSchedule | null> => {
    try {
        const { data, error } = await supabase
            .from('follow_up_schedules' as any)
            .select('*')
            .eq('quote_id', quoteId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching follow-up schedule:', error);
            return null;
        }

        if (!data) return null;

        return toCamelCase(data) as FollowUpSchedule;
    } catch (error) {
        console.error('Unexpected error fetching follow-up schedule:', error);
        return null;
    }
};

export const saveFollowUpSchedule = async (
    schedule: Partial<FollowUpSchedule> & { quoteId: string; userId: string }
): Promise<FollowUpSchedule | null> => {
    try {
        const dbData = toSnakeCase(schedule);

        // Remove undefined fields
        Object.keys(dbData).forEach(key => dbData[key] === undefined && delete dbData[key]);

        const { data, error } = await supabase
            .from('follow_up_schedules' as any)
            .upsert(dbData)
            .select()
            .single();

        if (error) {
            console.error('Error saving follow-up schedule:', error);
            throw error;
        }

        return toCamelCase(data) as FollowUpSchedule;
    } catch (error) {
        console.error('Unexpected error saving follow-up schedule:', error);
        throw error;
    }
};
