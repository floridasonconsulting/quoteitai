-- Verify items table has image_url column and check data
-- This helps debug the "no item images" issue

-- Check if image_url column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'items' 
    AND column_name = 'image_url'
  ) THEN
    RAISE NOTICE '✅ image_url column exists in items table';
  ELSE
    RAISE NOTICE '❌ image_url column MISSING from items table - need to add it';
    
    -- Add the column if missing
    ALTER TABLE items ADD COLUMN IF NOT EXISTS image_url TEXT;
    RAISE NOTICE '✅ Added image_url column to items table';
  END IF;
END $$;

-- Check how many items have image URLs
DO $$
DECLARE
  total_items INTEGER;
  items_with_images INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_items FROM items;
  SELECT COUNT(*) INTO items_with_images FROM items WHERE image_url IS NOT NULL AND image_url != '';
  
  RAISE NOTICE 'Total items: %', total_items;
  RAISE NOTICE 'Items with images: %', items_with_images;
  RAISE NOTICE 'Items without images: %', (total_items - items_with_images);
END $$;

-- Show sample of items with their image status
DO $$
DECLARE
  item_record RECORD;
BEGIN
  RAISE NOTICE '--- Sample Items ---';
  FOR item_record IN (
    SELECT 
      name, 
      category,
      CASE 
        WHEN image_url IS NOT NULL AND image_url != '' THEN '✅ HAS IMAGE'
        ELSE '❌ NO IMAGE'
      END as image_status,
      LEFT(image_url, 50) as image_url_preview
    FROM items
    LIMIT 10
  ) LOOP
    RAISE NOTICE '% | % | % | %', 
      item_record.name, 
      item_record.category, 
      item_record.image_status,
      item_record.image_url_preview;
  END LOOP;
END $$;