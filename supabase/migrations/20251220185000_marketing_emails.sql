-- Migration: Add marketing email tracking
-- Description: Tracks when an organization upgraded to Pro/Business and which marketing emails they have received.

-- 1. Add pro_upgraded_at to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS pro_upgraded_at TIMESTAMPTZ;

-- 2. Create marketing_emails table
CREATE TABLE IF NOT EXISTS public.marketing_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL, -- 'welcome', 'sow_tutorial', 'followup_strategy'
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, email_type)
);

-- 3. Index for performance in background worker
CREATE INDEX IF NOT EXISTS idx_organizations_pro_upgraded_at ON public.organizations(pro_upgraded_at) WHERE pro_upgraded_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_marketing_emails_org_type ON public.marketing_emails(organization_id, email_type);
