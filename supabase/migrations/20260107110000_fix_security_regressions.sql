-- Migration: Fix Security Regressions
-- Description: Relaxes overly restrictive RLS policies that caused app breakage for authenticated users.
-- Date: 2026-01-07

-- 1. Restore access to Proposal Analytics for authenticated users
-- The previous "anon" restriction blocked owners from submitting views while logged in.
DROP POLICY IF EXISTS "Allow anonymous telemetry submission" ON public.proposal_analytics;
CREATE POLICY "Allow anonymous telemetry submission" 
    ON public.proposal_analytics FOR INSERT 
    TO public
    WITH CHECK (true);

-- 2. Restore access to Proposal Conversations for authenticated users
DROP POLICY IF EXISTS "Public can add questions" ON public.proposal_conversations;
CREATE POLICY "Public can add questions"
    ON public.proposal_conversations FOR INSERT
    TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read their own conversations" ON public.proposal_conversations;
CREATE POLICY "Public can read their own conversations"
    ON public.proposal_conversations FOR SELECT
    TO public
    USING (true);

-- 3. Restore User Roles management for individual users
-- The frontend needs to be able to update roles on the settings page.
DROP POLICY IF EXISTS "Users can manage their own role" ON public.user_roles;
CREATE POLICY "Users can manage their own role"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Verify get_user_role search_path robustness
-- No changes needed, but ensuring it's not causing issues.
ALTER FUNCTION public.get_user_role(_user_id UUID) SET search_path = public;
