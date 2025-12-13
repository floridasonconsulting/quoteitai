-- Add show_pricing column to quotes table
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS show_pricing BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN quotes.show_pricing IS 'Controls whether pricing is displayed in proposal viewer';