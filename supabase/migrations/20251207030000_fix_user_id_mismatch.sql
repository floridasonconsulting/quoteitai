-- Fix User ID Mismatch Between Quotes and Company Settings
-- This migration ensures quotes can find their company settings

-- STRATEGY 1: Copy company settings to any user who has quotes but no settings
INSERT INTO company_settings (
  user_id, 
  name, 
  address, 
  city, 
  state, 
  zip, 
  phone, 
  email, 
  website, 
  license, 
  insurance, 
  terms,
  logo,
  logo_display_option,
  proposal_template,
  proposal_theme,
  notify_email_accepted,
  notify_email_declined,
  onboarding_completed,
  created_at,
  updated_at
)
SELECT DISTINCT
  q.user_id,
  cs.name,
  cs.address,
  cs.city,
  cs.state,
  cs.zip,
  cs.phone,
  cs.email,
  cs.website,
  cs.license,
  cs.insurance,
  cs.terms,
  cs.logo,
  cs.logo_display_option,
  cs.proposal_template,
  cs.proposal_theme,
  cs.notify_email_accepted,
  cs.notify_email_declined,
  cs.onboarding_completed,
  NOW(),
  NOW()
FROM quotes q
CROSS JOIN company_settings cs
WHERE NOT EXISTS (
  SELECT 1 FROM company_settings cs2 
  WHERE cs2.user_id = q.user_id
)
LIMIT 1; -- Only copy from the first (primary) company settings record

-- Log the operation
DO $$
DECLARE
  affected_rows INTEGER;
BEGIN
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Company settings copied to % user(s) who had quotes but no settings', affected_rows;
END $$;