-- Add show_pricing column to quotes table
-- Controls whether individual line-item pricing is visible in proposals

-- Add the column with a default value of true (show pricing by default)
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS show_pricing BOOLEAN DEFAULT true;

-- Update existing rows to have show_pricing = true
UPDATE quotes 
SET show_pricing = true 
WHERE show_pricing IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN quotes.show_pricing IS 'Controls visibility of individual line-item pricing in proposals (true = show prices, false = hide prices, show only category totals)';