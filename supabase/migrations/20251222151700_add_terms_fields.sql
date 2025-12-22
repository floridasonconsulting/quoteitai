-- Add payment_terms and legal_terms columns to quotes table
-- These allow per-quote overrides of global company settings

ALTER TABLE quotes 
ADD COLUMN payment_terms TEXT,
ADD COLUMN legal_terms TEXT;

COMMENT ON COLUMN quotes.payment_terms IS 'Quote-specific payment/warranty terms (overrides company_settings.terms)';
COMMENT ON COLUMN quotes.legal_terms IS 'Quote-specific legal clauses presented during contract acceptance (overrides company_settings.legal_terms)';

-- Add legal_terms column to company_settings table  
ALTER TABLE company_settings
ADD COLUMN legal_terms TEXT;

COMMENT ON COLUMN company_settings.legal_terms IS 'Global default legal clauses shown during proposal acceptance/signing';
COMMENT ON COLUMN company_settings.terms IS 'Global default payment/warranty terms shown at end of proposal';
