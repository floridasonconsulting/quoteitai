-- Add proposal_template column to company_settings table
ALTER TABLE company_settings 
ADD COLUMN proposal_template TEXT DEFAULT 'classic' 
CHECK (proposal_template IN ('classic', 'modern', 'detailed'));