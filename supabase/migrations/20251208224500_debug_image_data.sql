-- Debug Script: Investigate why items aren't showing images
-- Run this to see what's actually in your database

-- 1. Check items table - which items have images?
DO $$
DECLARE
  item_record RECORD;
BEGIN
  RAISE NOTICE '=== ITEMS TABLE (with user_id) ===';
  
  FOR item_record IN (
    SELECT 
      name, 
      category,
      user_id,
      CASE 
        WHEN image_url IS NOT NULL AND image_url != '' THEN '✅ HAS IMAGE'
        ELSE '❌ NO IMAGE'
      END as image_status,
      LEFT(COALESCE(image_url, 'NULL'), 60) as image_preview
    FROM items
    ORDER BY category, name
    LIMIT 20
  ) LOOP
    RAISE NOTICE '% | % | user: % | % | %', 
      item_record.name, 
      item_record.category, 
      item_record.user_id,
      item_record.image_status,
      item_record.image_preview;
  END LOOP;
END $$;

-- 2. Check a sample quote's items JSONB
DO $$
DECLARE
  quote_record RECORD;
  item_element JSONB;
BEGIN
  RAISE NOTICE '=== QUOTE ITEMS (from JSONB) ===';
  
  -- Get the most recent quote
  SELECT id, title, items, user_id
  INTO quote_record
  FROM quotes
  WHERE items IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF FOUND THEN
    RAISE NOTICE 'Quote: % (user: %)', quote_record.title, quote_record.user_id;
    RAISE NOTICE '---';
    
    -- Loop through items
    FOR item_element IN 
      SELECT * FROM jsonb_array_elements(quote_record.items)
    LOOP
      RAISE NOTICE 'Item: % | imageUrl (camelCase): % | image_url (snake): %',
        item_element->>'name',
        COALESCE(item_element->>'imageUrl', 'NULL'),
        COALESCE(item_element->>'image_url', 'NULL');
    END LOOP;
  END IF;
END $$;

-- 3. Check if item names match between tables
DO $$
DECLARE
  quote_items TEXT[];
  items_table TEXT[];
  matched INTEGER := 0;
  unmatched INTEGER := 0;
BEGIN
  RAISE NOTICE '=== ITEM NAME MATCHING ===';
  
  -- Get item names from most recent quote
  SELECT ARRAY_AGG(item->>'name')
  INTO quote_items
  FROM quotes,
  LATERAL jsonb_array_elements(items) AS item
  WHERE items IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Get item names from items table
  SELECT ARRAY_AGG(name)
  INTO items_table
  FROM items;
  
  IF quote_items IS NOT NULL THEN
    RAISE NOTICE 'Checking % items from quote...', array_length(quote_items, 1);
    
    -- Check each quote item
    FOR i IN 1..array_length(quote_items, 1) LOOP
      IF quote_items[i] = ANY(items_table) THEN
        matched := matched + 1;
        RAISE NOTICE '✅ MATCH: %', quote_items[i];
      ELSE
        unmatched := unmatched + 1;
        RAISE NOTICE '❌ NO MATCH: %', quote_items[i];
      END IF;
    END LOOP;
    
    RAISE NOTICE '---';
    RAISE NOTICE 'Matched: % | Unmatched: %', matched, unmatched;
  END IF;
END $$;

-- 4. Show actual user_id from quotes vs items
DO $$
DECLARE
  quote_user UUID;
  items_users UUID[];
BEGIN
  RAISE NOTICE '=== USER ID COMPARISON ===';
  
  -- Get user_id from most recent quote
  SELECT user_id INTO quote_user
  FROM quotes
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Get all unique user_ids from items
  SELECT ARRAY_AGG(DISTINCT user_id)
  INTO items_users
  FROM items;
  
  RAISE NOTICE 'Quote user_id: %', quote_user;
  RAISE NOTICE 'Items user_ids: %', items_users;
  
  IF quote_user = ANY(items_users) THEN
    RAISE NOTICE '✅ User IDs MATCH';
  ELSE
    RAISE NOTICE '❌ User IDs DO NOT MATCH - This is the problem!';
  END IF;
END $$;