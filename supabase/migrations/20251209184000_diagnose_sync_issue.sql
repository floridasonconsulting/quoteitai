-- Diagnostic Script: Find out why quote sync isn't working
-- Run this to identify the exact problem

-- Query 1: Check if quotes exist and have items
SELECT 
  'Quotes Check' as diagnostic,
  COUNT(*) as total_quotes,
  COUNT(CASE WHEN items IS NOT NULL THEN 1 END) as quotes_with_items,
  COUNT(CASE WHEN jsonb_array_length(items) > 0 THEN 1 END) as quotes_with_non_empty_items
FROM quotes;

-- Query 2: Check user_id matching between quotes and items
SELECT 
  'User ID Check' as diagnostic,
  q.user_id as quote_user_id,
  (SELECT COUNT(*) FROM items WHERE user_id = q.user_id) as matching_items_count,
  (SELECT COUNT(*) FROM items) as total_items_count
FROM quotes q
WHERE items IS NOT NULL
LIMIT 5;

-- Query 3: Check exact item name matching
WITH quote_items AS (
  SELECT 
    q.id as quote_id,
    q.user_id,
    item->>'name' as item_name
  FROM quotes q,
  LATERAL jsonb_array_elements(q.items) AS item
  WHERE q.items IS NOT NULL
  LIMIT 10
)
SELECT 
  qi.item_name as quote_item_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM items i 
      WHERE i.name = qi.item_name 
      AND i.user_id = qi.user_id
    ) THEN '✅ MATCH FOUND'
    ELSE '❌ NO MATCH'
  END as match_status,
  (
    SELECT i.name 
    FROM items i 
    WHERE i.user_id = qi.user_id
    LIMIT 1
  ) as sample_item_from_table
FROM quote_items qi;

-- Query 4: Show actual data side-by-side
SELECT 
  'Items Table' as source,
  name,
  category,
  LEFT(user_id::text, 12) as user_id_preview,
  CASE WHEN image_url IS NOT NULL THEN 'HAS IMAGE' ELSE 'NO IMAGE' END as image_status
FROM items
ORDER BY name
LIMIT 10;

SELECT 
  'Quote Items JSONB' as source,
  item->>'name' as name,
  item->>'category' as category,
  LEFT(q.user_id::text, 12) as user_id_preview,
  COALESCE(item->>'imageUrl', 'NULL') as imageUrl_field,
  COALESCE(item->>'image_url', 'NULL') as image_url_field
FROM quotes q,
LATERAL jsonb_array_elements(q.items) AS item
WHERE q.items IS NOT NULL
ORDER BY item->>'name'
LIMIT 10;