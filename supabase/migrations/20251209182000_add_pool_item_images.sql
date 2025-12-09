-- Add High-Quality Pool Item Images
-- Maps common pool items to appropriate Unsplash images

-- POOL STRUCTURE ITEMS
UPDATE items SET image_url = 'https://images.unsplash.com/photo-1576013551627-0cc20b468848?w=800&q=80'
WHERE category ILIKE '%pool%structure%' AND image_url IS NULL;

UPDATE items SET image_url = 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80'
WHERE (name ILIKE '%concrete%' OR name ILIKE '%shell%') AND image_url IS NULL;

UPDATE items SET image_url = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80'
WHERE (name ILIKE '%rebar%' OR name ILIKE '%steel%' OR name ILIKE '%reinforcement%') AND image_url IS NULL;

UPDATE items SET image_url = 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&q=80'
WHERE (name ILIKE '%plumbing%' OR name ILIKE '%pipe%') AND image_url IS NULL;

-- INTERIOR SURFACE (Plaster, Pebble, Quartz)
UPDATE items SET image_url = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80'
WHERE (name ILIKE '%plaster%' OR name ILIKE '%pebble%' OR name ILIKE '%quartz%' OR name ILIKE '%finish%' OR category ILIKE '%interior%surface%') AND image_url IS NULL;

-- COPING
UPDATE items SET image_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'
WHERE (name ILIKE '%coping%' OR category ILIKE '%coping%') AND image_url IS NULL;

UPDATE items SET image_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'
WHERE (name ILIKE '%travertine%' OR name ILIKE '%stone%') AND category ILIKE '%coping%' AND image_url IS NULL;

-- TILE
UPDATE items SET image_url = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80'
WHERE (name ILIKE '%tile%' OR category ILIKE '%tile%') AND image_url IS NULL;

UPDATE items SET image_url = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80'
WHERE (name ILIKE '%waterline%' OR name ILIKE '%mosaic%') AND image_url IS NULL;

-- DECKING
UPDATE items SET image_url = 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80'
WHERE (name ILIKE '%deck%' OR category ILIKE '%deck%') AND image_url IS NULL;

UPDATE items SET image_url = 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80'
WHERE (name ILIKE '%paver%' OR name ILIKE '%brick%') AND image_url IS NULL;

UPDATE items SET image_url = 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80'
WHERE name ILIKE '%concrete%' AND category ILIKE '%deck%' AND image_url IS NULL;

-- EQUIPMENT (Pumps, Filters, Heaters, Automation)
UPDATE items SET image_url = 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&q=80'
WHERE (name ILIKE '%pump%' OR name ILIKE '%motor%') AND image_url IS NULL;

UPDATE items SET image_url = 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80'
WHERE (name ILIKE '%filter%' OR name ILIKE '%cartridge%') AND image_url IS NULL;

UPDATE items SET image_url = 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&q=80'
WHERE (name ILIKE '%heater%' OR name ILIKE '%heat%pump%') AND image_url IS NULL;

UPDATE items SET image_url = 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&q=80'
WHERE (name ILIKE '%salt%' OR name ILIKE '%chlorine%' OR name ILIKE '%ozone%') AND image_url IS NULL;

UPDATE items SET image_url = 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&q=80'
WHERE (name ILIKE '%automation%' OR name ILIKE '%control%') AND image_url IS NULL;

UPDATE items SET image_url = 'https://images.unsplash.com/photo-1576013551627-0cc20b468848?w=800&q=80'
WHERE (name ILIKE '%skimmer%' OR name ILIKE '%drain%') AND image_url IS NULL;

-- ACCESSORIES (Lights, Covers, Cleaners)
UPDATE items SET image_url = 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80'
WHERE (name ILIKE '%light%' OR name ILIKE '%led%' OR name ILIKE '%lighting%') AND image_url IS NULL;

UPDATE items SET image_url = 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80'
WHERE (name ILIKE '%cover%' OR name ILIKE '%blanket%') AND image_url IS NULL;

UPDATE items SET image_url = 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&q=80'
WHERE (name ILIKE '%cleaner%' OR name ILIKE '%vacuum%' OR name ILIKE '%robot%') AND image_url IS NULL;

UPDATE items SET image_url = 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80'
WHERE (name ILIKE '%ladder%' OR name ILIKE '%rail%' OR name ILIKE '%step%') AND image_url IS NULL;

-- CATCH-ALL for any remaining items without images
UPDATE items SET image_url = 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80'
WHERE category IS NOT NULL AND image_url IS NULL;

-- Show summary (simple version)
SELECT 
  COUNT(*) as total_items,
  COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as items_with_images,
  ROUND(COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END)::DECIMAL / COUNT(*) * 100, 1) as coverage_percent
FROM items;