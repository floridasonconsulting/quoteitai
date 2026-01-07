-- Migration: Security Audit Fixes
-- Description: Addresses issues flagged by Supabase Database Linter (search_path, RLS permissions, enabled RLS)
-- Date: 2026-01-07

-- 1. Fix mutable search_path for functions
-- Adding SET search_path = public to all custom functions to prevent search path hijacking.

ALTER FUNCTION public.set_user_role_by_email(_email TEXT, _role TEXT) SET search_path = public;
ALTER FUNCTION public.list_users_with_roles() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.invoke_scheduled_followups() SET search_path = public;
ALTER FUNCTION public.trigger_scheduled_followups() SET search_path = public;
ALTER FUNCTION public.track_proposal_dwell(uuid, uuid, text, bigint, boolean, text) SET search_path = public;
ALTER FUNCTION public.check_seat_limits() SET search_path = public;

-- Also update get_user_role just in case
ALTER FUNCTION public.get_user_role(_user_id UUID) SET search_path = public;

-- 2. Tighten RLS policies
-- Restrict service_role only policies to the service_role to avoid overly permissive "true" policies for other roles.

-- User Roles
DROP POLICY IF EXISTS "Service role can manage all roles" ON public.user_roles;
CREATE POLICY "Service role can manage all roles"
    ON public.user_roles FOR ALL
    TO service_role
    USING (true);

-- Proposal Analytics
DROP POLICY IF EXISTS "Allow anonymous telemetry submission" ON public.proposal_analytics;
CREATE POLICY "Allow anonymous telemetry submission"
    ON public.proposal_analytics FOR INSERT
    TO anon
    WITH CHECK (true);

-- Proposal Conversations
DROP POLICY IF EXISTS "Public can add questions" ON public.proposal_conversations;
CREATE POLICY "Public can add questions"
    ON public.proposal_conversations FOR INSERT
    TO anon
    WITH CHECK (true);

-- 3. Enable RLS for marketing_emails table
-- It was created without RLS enabled.
ALTER TABLE public.marketing_emails ENABLE ROW LEVEL SECURITY;

-- Allow members of the organization to see their own marketing email status
DROP POLICY IF EXISTS "Users can see their organization's marketing email status" ON public.marketing_emails;
CREATE POLICY "Users can see their organization's marketing email status"
    ON public.marketing_emails FOR SELECT
    TO authenticated
    USING (organization_id = (SELECT public.get_my_organization()));

-- 4. Completion Comment
COMMENT ON TABLE public.marketing_emails IS 'Tracks marketing email status for organizations with RLS enabled.';
