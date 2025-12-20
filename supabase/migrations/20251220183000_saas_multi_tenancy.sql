-- Migration: SaaS Multi-Tenancy & Seat Limits
-- Description: Sets up organizations, links profiles, and enforces baseline seat limits.

-- 1. Create Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  subscription_tier text DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'pro', 'business', 'max_ai')),
  stripe_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Add Organization and Role to Profiles
-- Note: Profiles already exists, so we alter it.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'member' CHECK (role IN ('owner', 'member', 'admin'));

-- 3. Migrate Existing Users
-- Every existing user without an organization gets their own organization (Starter)
DO $$
DECLARE
    user_record RECORD;
    new_org_id uuid;
BEGIN
    FOR user_record IN SELECT id, full_name FROM public.profiles WHERE organization_id IS NULL LOOP
        -- Create a default organization for the user
        INSERT INTO public.organizations (name, subscription_tier)
        VALUES (COALESCE(user_record.full_name, 'My Organization'), 'starter')
        RETURNING id INTO new_org_id;

        -- Link the user to the new organization as an owner
        UPDATE public.profiles
        SET organization_id = new_org_id, role = 'owner'
        WHERE id = user_record.id;
    END LOOP;
END;
$$;

-- 4. Create Seat Limit Function
CREATE OR REPLACE FUNCTION public.check_seat_limits()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
    max_seats INTEGER;
    current_tier TEXT;
BEGIN
    -- Only check if organization_id is being set or changed
    IF NEW.organization_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT subscription_tier INTO current_tier FROM public.organizations WHERE id = NEW.organization_id;
    SELECT COUNT(*) INTO user_count FROM public.profiles WHERE organization_id = NEW.organization_id;

    max_seats := CASE 
        WHEN current_tier = 'starter' THEN 1
        WHEN current_tier = 'pro' THEN 3
        WHEN current_tier = 'business' THEN 10
        ELSE 999999 -- Max AI
    END;

    -- Trigger enforcement for non-admin inserts
    -- Service role inserts (invites) will bypass if we handle it in the Edge Function, 
    -- but this is a hard safety net.
    IF user_count >= max_seats THEN
        RAISE EXCEPTION 'Seat limit reached for % tier (Max: % seats). Please upgrade or add seats.', current_tier, max_seats;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger to enforce limits on new profiles
DROP TRIGGER IF EXISTS enforce_org_seat_limits ON public.profiles;
CREATE TRIGGER enforce_org_seat_limits
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.check_seat_limits();

-- 6. Update RLS Policies for Multi-Tenancy
-- We need to ensure all tables filter by organization_id.
-- This is a broad update, starting with core tables.

-- Organizations: Only members can see their organization
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see their organizations" ON public.organizations;
CREATE POLICY "Users can see their organizations"
    ON public.organizations FOR SELECT
    USING (id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Profiles: Members of the same org can see each other
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by organization members" ON public.profiles;
CREATE POLICY "Profiles are viewable by organization members"
    ON public.profiles FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Core Data Tables: Link to organization_id and enforce sharing
-- Note: Assuming organization_id columns were added in a previous migration or adding them now if missing.
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- Update RLS for Quotes
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can view organization quotes" ON public.quotes;
CREATE POLICY "Users can view organization quotes"
    ON public.quotes FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Update RLS for Customers
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can view organization customers" ON public.customers;
CREATE POLICY "Users can view organization customers"
    ON public.customers FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Update RLS for Items
DROP POLICY IF EXISTS "Users can view their own items" ON public.items;
DROP POLICY IF EXISTS "Users can view organization items" ON public.items;
CREATE POLICY "Users can view organization items"
    ON public.items FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
