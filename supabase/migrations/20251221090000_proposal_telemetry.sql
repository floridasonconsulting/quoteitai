-- Migration: Proposal Behavioral Telemetry
-- Description: Creates table for tracking client engagement and dwell time on proposals.

-- 1. Create Analytics Table
CREATE TABLE IF NOT EXISTS public.proposal_analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  section_id text NOT NULL,
  dwell_time_ms bigint DEFAULT 0,
  viewed_at timestamptz DEFAULT now(),
  user_agent text,
  is_owner boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 2. Performance Tracking Indices
CREATE INDEX IF NOT EXISTS idx_proposal_analytics_quote_id ON public.proposal_analytics(quote_id);
CREATE INDEX IF NOT EXISTS idx_proposal_analytics_session_id ON public.proposal_analytics(session_id);

-- 3. RLS Policies
ALTER TABLE public.proposal_analytics ENABLE ROW LEVEL SECURITY;

-- Visitors can INSERT their own telemetry
CREATE POLICY "Allow anonymous telemetry submission" 
    ON public.proposal_analytics FOR INSERT 
    WITH CHECK (true);

-- Owners can VIEW analytics for their proposals
CREATE POLICY "Owners can view analytics"
    ON public.proposal_analytics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.quotes q
            WHERE q.id = proposal_analytics.quote_id
            AND (q.organization_id = get_my_organization() OR q.user_id = auth.uid())
        )
    );

-- 4. Function to increment dwell time (UPSERT style)
CREATE OR REPLACE FUNCTION public.track_proposal_dwell(
  p_quote_id uuid,
  p_session_id uuid,
  p_section_id text,
  p_dwell_ms bigint,
  p_is_owner boolean DEFAULT false,
  p_user_agent text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO public.proposal_analytics (quote_id, session_id, section_id, dwell_time_ms, is_owner, user_agent)
  VALUES (p_quote_id, p_session_id, p_section_id, p_dwell_ms, p_is_owner, p_user_agent)
  ON CONFLICT (id) DO NOTHING; -- We don't have a unique constraint on id for upsert yet, but we'll use inserts for raw timeline data
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
