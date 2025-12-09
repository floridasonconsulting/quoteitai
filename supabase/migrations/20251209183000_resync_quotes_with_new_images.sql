-- Re-sync ALL quotes with newly added item images
-- This updates the quote JSONB to include the new image URLs

DO $$
DECLARE
  quote_record RECORD;
  item_element JSONB;
  updated_items JSONB := '[]'::JSONB;
  matched_item RECORD;
  total_quotes INTEGER := 0;
  total_items_updated INTEGER := 0;
BEGIN
  RAISE NOTICE '🔄 Re-syncing quotes with new item images...';
  
  -- Loop through ALL quotes
  FOR quote_record IN 
    SELECT id, items, user_id 
    FROM quotes 
    WHERE items IS NOT NULL 
      AND jsonb_array_length(items) > 0
  LOOP
    total_quotes := total_quotes + 1;
    updated_items := '[]'::JSONB;
    
    -- Loop through each item in the quote
    FOR item_element IN 
      SELECT * FROM jsonb_array_elements(quote_record.items)
    LOOP
      -- Match with items table
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
        -- Update BOTH camelCase AND snake_case for compatibility
        item_element := jsonb_set(
          item_element,
          '{imageUrl}',
          COALESCE(to_jsonb(matched_item.image_url), 'null'::jsonb)
        );
        
        item_element := jsonb_set(
          item_element,
          '{image_url}',
          COALESCE(to_jsonb(matched_item.image_url), 'null'::jsonb)
        );
        
        item_element := jsonb_set(
          item_element,
          '{enhancedDescription}',
          COALESCE(to_jsonb(matched_item.enhanced_description), 'null'::jsonb)
        );
        
        item_element := jsonb_set(
          item_element,
          '{enhanced_description}',
          COALESCE(to_jsonb(matched_item.enhanced_description), 'null'::jsonb)
        );
        
        total_items_updated := total_items_updated + 1;
      END IF;
      
      updated_items := updated_items || item_element;
    END LOOP;
    
    -- Update the quote
    UPDATE quotes
    SET 
      items = updated_items,
      updated_at = NOW()
    WHERE id = quote_record.id;
    
  END LOOP;
  
  RAISE NOTICE '✅ Sync complete!';
  RAISE NOTICE '  Processed: % quotes', total_quotes;
  RAISE NOTICE '  Updated: % items', total_items_updated;
END $$;