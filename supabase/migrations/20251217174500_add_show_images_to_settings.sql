-- Add show_proposal_images column to company_settings table
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS show_proposal_images BOOLEAN DEFAULT TRUE;

-- Add comment for documentation
COMMENT ON COLUMN company_settings.show_proposal_images IS 'Toggle to show/hide rich imagery in proposals';
