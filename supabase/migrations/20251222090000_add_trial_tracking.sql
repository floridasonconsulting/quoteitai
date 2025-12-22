-- Migration: Add Trial Tracking Columns
-- Description: Adds columns to track trial status, end dates, and per-feature AI usage.

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' 
CHECK (subscription_status IN ('free', 'trialing', 'active', 'past_due', 'canceled', 'unpaid'));

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS trial_ai_usage JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ;

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Index for status-based queries (marketing automation)
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON public.organizations(subscription_status);
