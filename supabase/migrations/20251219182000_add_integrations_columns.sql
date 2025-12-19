-- Add QuickBooks integration columns to company_settings
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS quickbooks_realm_id TEXT DEFAULT NULL;

ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS quickbooks_access_token TEXT DEFAULT NULL;

ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS quickbooks_refresh_token TEXT DEFAULT NULL;

ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS quickbooks_token_expires_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS quickbooks_company_name TEXT DEFAULT NULL;

ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS quickbooks_connected_at TIMESTAMPTZ DEFAULT NULL;

-- Add Stripe Connect columns
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT DEFAULT NULL;

ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS stripe_connected_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;

-- Add custom branding columns
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS custom_favicon TEXT DEFAULT NULL;

-- Comments for documentation
COMMENT ON COLUMN public.company_settings.quickbooks_realm_id IS 'QuickBooks Online company/realm ID';
COMMENT ON COLUMN public.company_settings.quickbooks_access_token IS 'Encrypted QuickBooks OAuth access token';
COMMENT ON COLUMN public.company_settings.quickbooks_refresh_token IS 'Encrypted QuickBooks OAuth refresh token';
COMMENT ON COLUMN public.company_settings.stripe_account_id IS 'Stripe Connect account ID for payment processing';
