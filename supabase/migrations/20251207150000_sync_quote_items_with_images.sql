-- Sync quote items JSONB with current items table data (including image_url)
-- This fixes quotes created before items had image URLs

DO $$
DECLARE
  quote_record RECORD;
  item_element JSONB;
  updated_items JSONB := '[]'::JSONB;
  matched_item RECORD;
BEGIN
  -- Get the specific quote
  FOR quote_record IN 
    SELECT id, items, user_id 
    FROM quotes 
    WHERE share_token = 'zKAMcA74e2fv6ZPDK4hQxCmzsr9vNX4cMGjI0Yv4j/E='
  LOOP
    RAISE NOTICE '🔄 Processing quote: %', quote_record.id;
    
    -- Reset updated_items for this quote
    updated_items := '[]'::JSONB;
    
    -- Loop through each item in the quote's items array
    FOR item_element IN 
      SELECT * FROM jsonb_array_elements(quote_record.items)
    LOOP
      -- Try to match this item with the items table by name
      SELECT 
        image_url, 
        enhanced_description,
        name,
        category
      INTO matched_item
      FROM items 
      WHERE user_id = quote_record.user_id
        AND name = (item_element->>'name')
      LIMIT 1;
      
      IF FOUND THEN
        -- Update the item with data from items table
        item_element := jsonb_set(
          item_element,
          '{imageUrl}',
          COALESCE(to_jsonb(matched_item.image_url), 'null'::jsonb)
        );
        
        item_element := jsonb_set(
          item_element,
          '{enhancedDescription}',
          COALESCE(to_jsonb(matched_item.enhanced_description), 'null'::jsonb)
        );
        
        RAISE NOTICE '  ✅ Updated item: % (imageUrl: %)', 
          matched_item.name,
          CASE WHEN matched_item.image_url IS NOT NULL THEN 'YES' ELSE 'NO' END;
      ELSE
        RAISE NOTICE '  ⚠️  No match found for item: %', (item_element->>'name');
      END IF;
      
      -- Add updated item to array
      updated_items := updated_items || item_element;
    END LOOP;
    
    -- Update the quote with new items array
    UPDATE quotes
    SET items = updated_items
    WHERE id = quote_record.id;
    
    RAISE NOTICE '✅ Quote updated with % items', jsonb_array_length(updated_items);
  END LOOP;
END $$;