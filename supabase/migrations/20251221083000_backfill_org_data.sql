-- Migration: Backfill Organization Data & Graceful RLS
-- Description: Backfills organization_id for existing records and adds a fallback to user_id in RLS during transition.

-- 1. Backfill existing items
UPDATE public.items i
SET organization_id = p.organization_id
FROM public.profiles p
WHERE i.user_id = p.id
AND i.organization_id IS NULL
AND p.organization_id IS NOT NULL;

-- 2. Backfill existing customers
UPDATE public.customers c
SET organization_id = p.organization_id
FROM public.profiles p
WHERE c.user_id = p.id
AND c.organization_id IS NULL
AND p.organization_id IS NOT NULL;

-- 3. Backfill existing quotes
UPDATE public.quotes q
SET organization_id = p.organization_id
FROM public.profiles p
WHERE q.user_id = p.id
AND q.organization_id IS NULL
AND p.organization_id IS NOT NULL;

-- 4. Update RLS policies to allow fallback to user_id OR get_my_organization()
-- This ensures that even if backfill misses something (e.g. user without an org), they can still see their own data.

-- Items
DROP POLICY IF EXISTS "Users can view organization items" ON public.items;
CREATE POLICY "Users can view organization items"
    ON public.items FOR SELECT
    USING (organization_id = get_my_organization() OR user_id = auth.uid());

-- Quotes
DROP POLICY IF EXISTS "Users can view organization quotes" ON public.quotes;
CREATE POLICY "Users can view organization quotes"
    ON public.quotes FOR SELECT
    USING (organization_id = get_my_organization() OR user_id = auth.uid());

-- Customers
DROP POLICY IF EXISTS "Users can view organization customers" ON public.customers;
CREATE POLICY "Users can view organization customers"
    ON public.customers FOR SELECT
    USING (organization_id = get_my_organization() OR user_id = auth.uid());

-- 5. Fix notifications table (User reported 404)
-- Check if table exists, if not create it.
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  organization_id uuid REFERENCES public.organizations(id)
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
CREATE POLICY "Users can view their notifications"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid() OR organization_id = get_my_organization());
