-- Add scope_of_work column to quotes table
-- This stores the AI-generated Scope of Work for proposal display

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS scope_of_work TEXT;

-- Add comment for documentation
COMMENT ON COLUMN quotes.scope_of_work IS 'AI-generated Scope of Work markdown content for proposal display';
