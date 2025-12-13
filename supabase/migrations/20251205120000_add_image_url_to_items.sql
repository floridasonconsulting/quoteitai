-- Add image_url column to items table
-- Supports visual proposal presentations with product/service images

-- Add the column (nullable to support existing records)
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN items.image_url IS 'URL to product/service image for proposal presentations';

-- Optional: Add validation for URL format (uncomment if needed)
-- ALTER TABLE items 
-- ADD CONSTRAINT items_image_url_format 
-- CHECK (image_url IS NULL OR image_url ~* '^https?://');