-- Add pricing_mode column to quotes table
-- This column stores the user's preferred pricing breakdown display mode

ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS pricing_mode TEXT DEFAULT 'category_total';

-- Add constraint to limit valid values
-- Valid values: 'itemized', 'category_total', 'grand_total'
COMMENT ON COLUMN public.quotes.pricing_mode IS 'Pricing display mode: itemized, category_total, or grand_total';
