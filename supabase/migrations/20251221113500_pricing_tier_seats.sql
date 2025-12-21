-- Migration: Premium Tier Structure & Seat Limits
-- Description: Updates the seat limits and tier structure to align with the new pricing model.

-- 1. Update the check constraint on organizations table
-- First, drop the old constraint if we can find its name, or just redefine it if it's a simple CHECK.
-- Note: In Supabase, these often don't have explicit names in simple ALTER statements, but we can target the column.
DO $$ 
BEGIN 
    ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_subscription_tier_check;
EXCEPTION 
    WHEN undefined_object THEN NULL; 
END $$;

ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_subscription_tier_check 
CHECK (subscription_tier IN ('starter', 'pro', 'business', 'enterprise', 'max_ai'));

-- 2. Update existing data to reflect new limits
-- Starter: 1 (Same)
-- Pro: 2 (Decr from 3)
-- Business: 5 (Decr from 10)
-- Enterprise: 10 (New)

UPDATE public.organizations
SET allowed_seats = 1
WHERE subscription_tier = 'starter';

UPDATE public.organizations
SET allowed_seats = 2
WHERE subscription_tier = 'pro';

UPDATE public.organizations
SET allowed_seats = 5
WHERE subscription_tier = 'business';

UPDATE public.organizations
SET allowed_seats = 10, subscription_tier = 'enterprise'
WHERE subscription_tier = 'max_ai';

-- 3. Update Seat Limit Enforcement Function
CREATE OR REPLACE FUNCTION public.check_seat_limits()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
    max_seats INTEGER;
    current_tier TEXT;
    custom_limit INTEGER;
BEGIN
    -- Only check if organization_id is being set or changed
    IF NEW.organization_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Avoid check if profile already has this organization_id (re-saves or updates)
    -- This allows updating other fields on existing profiles without hitting the check.
    IF TG_OP = 'UPDATE' AND OLD.organization_id = NEW.organization_id THEN
        RETURN NEW;
    END IF;

    SELECT subscription_tier, allowed_seats INTO current_tier, custom_limit 
    FROM public.organizations 
    WHERE id = NEW.organization_id;

    SELECT COUNT(*) INTO user_count FROM public.profiles WHERE organization_id = NEW.organization_id;

    -- Use allowed_seats if populated, otherwise fallback to tier defaults
    max_seats := COALESCE(custom_limit, CASE 
        WHEN current_tier = 'starter' THEN 1
        WHEN current_tier = 'pro' THEN 2
        WHEN current_tier = 'business' THEN 5
        WHEN current_tier = 'enterprise' THEN 10
        ELSE 999999 -- Fallback
    END);

    -- Trigger enforcement for non-admin inserts
    IF user_count >= max_seats THEN
        RAISE EXCEPTION 'Seat limit reached for % tier (Limit: % seats). Please upgrade or add seats via Billing.', current_tier, max_seats;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
