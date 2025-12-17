-- Add industry column to company_settings table
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS industry TEXT;

-- Update existing records to 'other' if needed (though IF NOT EXISTS handles the column)
UPDATE company_settings SET industry = 'other' WHERE industry IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN company_settings.industry IS 'Primary industry of the company for smart visual matching';
