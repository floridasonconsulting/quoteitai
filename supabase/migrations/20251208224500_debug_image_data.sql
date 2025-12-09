-- Debug Script: Investigate why items aren't showing images
-- Returns actual data tables instead of RAISE NOTICE

-- Query 1: Check items table - which items have images?
SELECT 
  name, 
  category,
  LEFT(user_id::text, 8) as user_id,
  CASE 
    WHEN image_url IS NOT NULL AND image_url != '' THEN '✅ HAS IMAGE'
    ELSE '❌ NO IMAGE'
  END as image_status,
  LEFT(COALESCE(image_url, 'NULL'), 60) as image_preview
FROM items
ORDER BY category, name
LIMIT 20;

-- Query 2: Check quote items JSONB
SELECT 
  q.title as quote_title,
  LEFT(q.user_id::text, 8) as user_id,
  jsonb_array_length(q.items) as item_count
FROM quotes q
WHERE q.items IS NOT NULL
ORDER BY q.created_at DESC
LIMIT 1;

-- Query 3: Detailed quote items
WITH latest_quote AS (
  SELECT id, title, items, user_id
  FROM quotes
  WHERE items IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  item->>'name' as item_name,
  item->>'category' as category,
  COALESCE(item->>'imageUrl', 'NULL') as imageUrl_camelCase,
  COALESCE(item->>'image_url', 'NULL') as image_url_snake,
  COALESCE(item->>'enhancedDescription', 'NULL') as enhanced_desc
FROM latest_quote,
LATERAL jsonb_array_elements(items) AS item
LIMIT 20;

-- Query 4: Check item name matching
WITH latest_quote AS (
  SELECT id, title, items, user_id
  FROM quotes
  WHERE items IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  item->>'name' as quote_item_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM items i 
      WHERE i.name = item->>'name' 
      AND i.user_id = lq.user_id
    ) THEN '✅ MATCH'
    ELSE '❌ NO MATCH'
  END as match_status,
  (
    SELECT LEFT(i.image_url, 40)
    FROM items i 
    WHERE i.name = item->>'name' 
    AND i.user_id = lq.user_id
    LIMIT 1
  ) as items_table_image
FROM latest_quote lq,
LATERAL jsonb_array_elements(items) AS item
LIMIT 20;

-- Query 5: User ID comparison
SELECT 
  'Quote user_id' as source,
  LEFT(user_id::text, 12) as user_id
FROM quotes
WHERE items IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;

-- Query 6: Items user IDs
SELECT 
  'Items user_id' as source,
  LEFT(user_id::text, 12) as user_id
FROM items
GROUP BY user_id
LIMIT 5;