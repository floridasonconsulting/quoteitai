-- COMPREHENSIVE DIAGNOSTIC: Multiple Result Sets
-- Run each query separately to see the full picture

-- Query 1: Overall Statistics
SELECT 
  'OVERALL STATS' as diagnostic_section,
  (SELECT COUNT(*) FROM quotes) as total_quotes,
  (SELECT COUNT(*) FROM quotes WHERE items IS NOT NULL) as quotes_with_items,
  (SELECT COUNT(*) FROM items) as total_items,
  (SELECT COUNT(*) FROM items WHERE image_url IS NOT NULL) as items_with_images;

-- Query 2: User IDs in Quotes
SELECT 
  'QUOTES USER IDS' as diagnostic_section,
  user_id::text as user_id,
  COUNT(*) as record_count
FROM quotes
GROUP BY user_id;

-- Query 3: User IDs in Items
SELECT 
  'ITEMS USER IDS' as diagnostic_section,
  user_id::text as user_id,
  COUNT(*) as record_count
FROM items
GROUP BY user_id;

-- Query 4: Items Table Sample
SELECT 
  'ITEMS TABLE DATA' as diagnostic_section,
  name,
  category,
  LEFT(user_id::text, 12) as user_id_short,
  CASE 
    WHEN image_url IS NOT NULL AND image_url != '' THEN 'HAS IMAGE'
    ELSE 'NO IMAGE'
  END as image_status,
  LEFT(COALESCE(image_url, 'NULL'), 50) as image_preview
FROM items
ORDER BY category, name
LIMIT 15;

-- Query 5: Quote Items JSONB Content
SELECT 
  'QUOTE ITEMS JSONB' as diagnostic_section,
  item->>'name' as name,
  item->>'category' as category,
  LEFT(q.user_id::text, 12) as quote_user_id_short,
  COALESCE(item->>'imageUrl', 'NULL') as imageUrl_camel,
  COALESCE(item->>'image_url', 'NULL') as image_url_snake
FROM quotes q,
LATERAL jsonb_array_elements(q.items) AS item
WHERE q.items IS NOT NULL
ORDER BY q.created_at DESC
LIMIT 15;

-- Query 6: Name Matching Analysis
WITH quote_items AS (
  SELECT 
    q.user_id as quote_user_id,
    item->>'name' as item_name
  FROM quotes q,
  LATERAL jsonb_array_elements(q.items) AS item
  WHERE q.items IS NOT NULL
  LIMIT 15
)
SELECT 
  'NAME MATCHING' as diagnostic_section,
  qi.item_name as quote_item_name,
  LEFT(qi.quote_user_id::text, 12) as quote_user_id_short,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM items i 
      WHERE i.name = qi.item_name 
      AND i.user_id = qi.quote_user_id
    ) THEN 'EXACT MATCH'
    WHEN EXISTS (
      SELECT 1 FROM items i 
      WHERE i.user_id = qi.quote_user_id
    ) THEN 'USER MATCH BUT NAME DIFF'
    ELSE 'NO MATCH'
  END as match_status,
  (
    SELECT name
    FROM items i
    WHERE i.user_id = qi.quote_user_id
    ORDER BY name
    LIMIT 1
  ) as sample_items_table_name
FROM quote_items qi;

-- Query 7: The Smoking Gun - User ID Comparison
SELECT 
  'USER ID COMPARISON' as diagnostic_section,
  'Quote User ID' as type,
  user_id::text as value
FROM quotes
WHERE items IS NOT NULL
LIMIT 1;

SELECT 
  'USER ID COMPARISON' as diagnostic_section,
  'Items User ID' as type,
  user_id::text as value
FROM items
LIMIT 1;