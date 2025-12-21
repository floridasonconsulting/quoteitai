-- Migration: Fix missing columns in company_settings
-- Description: Ensures all required columns exist for branding, financing, and multi-tenancy.

-- Add organization_id if missing
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- Add industry if missing
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS industry text DEFAULT 'other';

-- Add proposal visualization columns if missing
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS show_proposal_images boolean DEFAULT true;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS default_cover_image text DEFAULT NULL;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS default_header_image text DEFAULT NULL;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS visual_rules jsonb DEFAULT NULL;

-- Add financing columns if missing
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS show_financing boolean DEFAULT false;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS financing_text text DEFAULT NULL;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS financing_link text DEFAULT NULL;

-- Add branding colors if missing
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS primary_color text DEFAULT NULL;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS accent_color text DEFAULT NULL;

-- Add onboarding status if missing
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Add business-specific columns if missing
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS license text DEFAULT NULL;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS insurance text DEFAULT NULL;

-- Backfill organization_id from profiles if it's null
UPDATE public.company_settings cs
SET organization_id = p.organization_id
FROM public.profiles p
WHERE cs.user_id = p.id
AND cs.organization_id IS NULL
AND p.organization_id IS NOT NULL;

-- Log success
DO $$
BEGIN
  RAISE NOTICE '✅ company_settings table columns verified and updated';
END $$;
