-- Migration: Fix Recursive RLS Policies
-- Description: Resolves infinite loops/latency in RLS by using a Security Definer function to fetch organization_id.

-- 1. Create Helper Function (SECURITY DEFINER)
-- This function runs with the privileges of the creator (usually postgres/service_role),
-- allowing it to bypass RLS on the profiles table to get the organization_id.
CREATE OR REPLACE FUNCTION public.get_my_organization()
RETURNS uuid AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM public.profiles 
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Update RLS for Profiles
-- Remove recursive subquery that caused timeouts
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are viewable by organization members" ON public.profiles;
CREATE POLICY "Profiles are viewable by organization members"
    ON public.profiles FOR SELECT
    USING (organization_id = get_my_organization());

-- 3. Update RLS for Organizations
-- Ensure members can see their own organization
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see their organizations" ON public.organizations;
CREATE POLICY "Users can see their organizations"
    ON public.organizations FOR SELECT
    USING (id = get_my_organization());

-- 4. Update RLS for Items
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view organization items" ON public.items;
CREATE POLICY "Users can view organization items"
    ON public.items FOR SELECT
    USING (organization_id = get_my_organization());

-- 5. Update RLS for Quotes
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view organization quotes" ON public.quotes;
CREATE POLICY "Users can view organization quotes"
    ON public.quotes FOR SELECT
    USING (organization_id = get_my_organization());

-- 6. Update RLS for Customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view organization customers" ON public.customers;
CREATE POLICY "Users can view organization customers"
    ON public.customers FOR SELECT
    USING (organization_id = get_my_organization());

-- 7. Ensure INSERT/UPDATE/DELETE also use the helper if needed
-- (Assuming they were mostly user_id based or need similar org-level protection)
DROP POLICY IF EXISTS "Users can insert organization items" ON public.items;
CREATE POLICY "Users can insert organization items"
    ON public.items FOR INSERT
    WITH CHECK (organization_id = get_my_organization());

DROP POLICY IF EXISTS "Users can update organization items" ON public.items;
CREATE POLICY "Users can update organization items"
    ON public.items FOR UPDATE
    USING (organization_id = get_my_organization());

DROP POLICY IF EXISTS "Users can delete organization items" ON public.items;
CREATE POLICY "Users can delete organization items"
    ON public.items FOR DELETE
    USING (organization_id = get_my_organization());
