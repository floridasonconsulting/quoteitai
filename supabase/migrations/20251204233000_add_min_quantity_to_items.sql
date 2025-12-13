-- Add min_quantity column to items table
-- This migration adds support for minimum quantity requirements per item

-- Add the column with a default value of 1
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 1;

-- Add a check constraint to ensure min_quantity is positive
ALTER TABLE items 
ADD CONSTRAINT items_min_quantity_positive 
CHECK (min_quantity > 0);

-- Update existing rows to have min_quantity = 1
UPDATE items 
SET min_quantity = 1 
WHERE min_quantity IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE items 
ALTER COLUMN min_quantity SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN items.min_quantity IS 'Minimum quantity that must be ordered for this item';