-- COMPREHENSIVE DIAGNOSTIC: One Query to Rule Them All
-- This will show us exactly what's wrong with the sync

-- Part 1: Overall Statistics
SELECT 
  '=== OVERALL STATS ===' as section,
  (SELECT COUNT(*) FROM quotes) as total_quotes,
  (SELECT COUNT(*) FROM quotes WHERE items IS NOT NULL) as quotes_with_items,
  (SELECT COUNT(*) FROM items) as total_items,
  (SELECT COUNT(*) FROM items WHERE image_url IS NOT NULL) as items_with_images;

-- Part 2: User ID Analysis
SELECT 
  '=== USER IDS ===' as section,
  'Quotes' as table_name,
  user_id::text as user_id,
  COUNT(*) as record_count
FROM quotes
GROUP BY user_id
UNION ALL
SELECT 
  '=== USER IDS ===' as section,
  'Items' as table_name,
  user_id::text as user_id,
  COUNT(*) as record_count
FROM items
GROUP BY user_id;

-- Part 3: Items Table - Show what we have
SELECT 
  '=== ITEMS TABLE ===' as section,
  name,
  category,
  LEFT(user_id::text, 12) as user_id_short,
  CASE 
    WHEN image_url IS NOT NULL AND image_url != '' THEN '✅ HAS IMAGE'
    ELSE '❌ NO IMAGE'
  END as image_status,
  LEFT(COALESCE(image_url, 'NULL'), 50) as image_preview
FROM items
ORDER BY category, name
LIMIT 15;

-- Part 4: Quote Items - Show what quotes have
WITH latest_quote AS (
  SELECT id, title, items, user_id
  FROM quotes
  WHERE items IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  '=== QUOTE ITEMS JSONB ===' as section,
  item->>'name' as name,
  item->>'category' as category,
  LEFT(lq.user_id::text, 12) as quote_user_id_short,
  COALESCE(item->>'imageUrl', 'NULL') as imageUrl_camel,
  COALESCE(item->>'image_url', 'NULL') as image_url_snake
FROM latest_quote lq,
LATERAL jsonb_array_elements(lq.items) AS item
LIMIT 15;

-- Part 5: CRITICAL - Check if names match
WITH latest_quote AS (
  SELECT id, title, items, user_id
  FROM quotes
  WHERE items IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1
),
quote_items AS (
  SELECT 
    lq.user_id as quote_user_id,
    item->>'name' as item_name
  FROM latest_quote lq,
  LATERAL jsonb_array_elements(lq.items) AS item
)
SELECT 
  '=== NAME MATCHING ===' as section,
  qi.item_name as quote_item_name,
  qi.quote_user_id::text as quote_user_id,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM items i 
      WHERE i.name = qi.item_name 
      AND i.user_id = qi.quote_user_id
    ) THEN '✅ EXACT MATCH'
    WHEN EXISTS (
      SELECT 1 FROM items i 
      WHERE i.user_id = qi.quote_user_id
    ) THEN '⚠️ USER MATCH BUT NAME DIFFERENT'
    ELSE '❌ NO MATCH AT ALL'
  END as match_status,
  (
    SELECT name
    FROM items i
    WHERE i.user_id = qi.quote_user_id
    ORDER BY name
    LIMIT 1
  ) as sample_items_table_name
FROM quote_items qi
LIMIT 15;

-- Part 6: Show the EXACT problem
SELECT 
  '=== THE SMOKING GUN ===' as section,
  'Quote User ID' as type,
  user_id::text as value
FROM quotes
WHERE items IS NOT NULL
LIMIT 1

UNION ALL

SELECT 
  '=== THE SMOKING GUN ===' as section,
  'Items User ID' as type,
  user_id::text as value
FROM items
LIMIT 1;