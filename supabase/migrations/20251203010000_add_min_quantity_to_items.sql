-- Add min_quantity column to items table

-- 1. Add the min_quantity column with default value of 1
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS min_quantity INTEGER NOT NULL DEFAULT 1;

-- 2. Add a check constraint to ensure min_quantity is positive
ALTER TABLE items 
ADD CONSTRAINT min_quantity_positive CHECK (min_quantity > 0);

-- 3. Update any existing items to have min_quantity = 1 (just to be safe)
UPDATE items 
SET min_quantity = 1 
WHERE min_quantity IS NULL OR min_quantity < 1;

-- 4. Add an index for queries that filter by min_quantity
CREATE INDEX IF NOT EXISTS idx_items_min_quantity ON items(min_quantity);

COMMENT ON COLUMN items.min_quantity IS 'Default minimum quantity for this item when added to quotes (used by AI and manual addition)';
