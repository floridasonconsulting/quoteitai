-- Migration: Add allowed_seats to organizations and update trigger
-- Description: Adds a column to store the total seats paid for and updates the enforcement logic.

-- 1. Add missing columns to organizations if they don't exist
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'pro', 'business', 'max_ai'));
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS allowed_seats INTEGER;

-- 2. Backfill allowed_seats based on tier if currently NULL
UPDATE public.organizations
SET allowed_seats = CASE 
    WHEN subscription_tier = 'starter' THEN 1
    WHEN subscription_tier = 'pro' THEN 3
    WHEN subscription_tier = 'business' THEN 10
    ELSE 999999 -- max_ai
END
WHERE allowed_seats IS NULL;

-- 3. Update Seat Limit Function to prefer allowed_seats column
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

    SELECT subscription_tier, allowed_seats INTO current_tier, custom_limit 
    FROM public.organizations 
    WHERE id = NEW.organization_id;

    SELECT COUNT(*) INTO user_count FROM public.profiles WHERE organization_id = NEW.organization_id;

    -- Use allowed_seats if populated, otherwise fallback to tier defaults
    max_seats := COALESCE(custom_limit, CASE 
        WHEN current_tier = 'starter' THEN 1
        WHEN current_tier = 'pro' THEN 3
        WHEN current_tier = 'business' THEN 10
        ELSE 999999 -- Max AI
    END);

    -- Trigger enforcement for non-admin inserts
    IF user_count >= max_seats THEN
        RAISE EXCEPTION 'Seat limit reached for % tier (Limit: % seats). Please upgrade or add seats via Billing.', current_tier, max_seats;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
