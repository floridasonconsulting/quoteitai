-- Add image_url column to items table (if not exists)
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add enhanced_description column for rich item descriptions
ALTER TABLE items
ADD COLUMN IF NOT EXISTS enhanced_description TEXT;

-- Create index on category for efficient grouping
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);

-- Update existing items to use standardized categories
-- Map common variations to standard categories
UPDATE items 
SET category = CASE
  WHEN LOWER(category) LIKE '%pool%' AND LOWER(category) LIKE '%structure%' THEN 'Pool Structure'
  WHEN LOWER(category) LIKE '%coping%' OR LOWER(category) LIKE '%tile%' THEN 'Coping & Tile'
  WHEN LOWER(category) LIKE '%deck%' THEN 'Decking'
  WHEN LOWER(category) LIKE '%equipment%' OR LOWER(category) LIKE '%pump%' OR LOWER(category) LIKE '%filter%' THEN 'Equipment'
  WHEN LOWER(category) LIKE '%accessories%' OR LOWER(category) LIKE '%accessory%' THEN 'Accessories'
  WHEN LOWER(category) LIKE '%service%' OR LOWER(category) LIKE '%maintenance%' THEN 'Services'
  ELSE category
END
WHERE category IS NOT NULL;