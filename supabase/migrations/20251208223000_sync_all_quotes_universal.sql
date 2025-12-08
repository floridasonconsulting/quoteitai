-- Universal Quote Items Sync - Works for ALL Industries
-- Syncs ALL quotes' JSONB items with current items table data (image_url + enhanced_description)

DO $$
DECLARE
  quote_record RECORD;
  item_element JSONB;
  updated_items JSONB := '[]'::JSONB;
  matched_item RECORD;
  total_quotes INTEGER := 0;
  total_items_updated INTEGER := 0;
BEGIN
  RAISE NOTICE '🔄 Starting universal quote sync for ALL quotes...';
  
  -- Loop through ALL quotes (no hardcoded share_token filter)
  FOR quote_record IN 
    SELECT id, items, user_id 
    FROM quotes 
    WHERE items IS NOT NULL 
      AND jsonb_array_length(items) > 0
  LOOP
    total_quotes := total_quotes + 1;
    RAISE NOTICE '📦 Processing quote: % (% items)', quote_record.id, jsonb_array_length(quote_record.items);
    
    -- Reset updated_items for this quote
    updated_items := '[]'::JSONB;
    
    -- Loop through each item in the quote's items array
    FOR item_element IN 
      SELECT * FROM jsonb_array_elements(quote_record.items)
    LOOP
      -- Try to match this item with the items table by name AND user_id
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
        -- CRITICAL: Update BOTH camelCase AND snake_case fields for compatibility
        -- (Frontend uses camelCase, but JSONB might have snake_case)
        
        -- Update camelCase fields (TypeScript)
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
        
        -- Update snake_case fields (Database compatibility)
        item_element := jsonb_set(
          item_element,
          '{image_url}',
          COALESCE(to_jsonb(matched_item.image_url), 'null'::jsonb)
        );
        
        item_element := jsonb_set(
          item_element,
          '{enhanced_description}',
          COALESCE(to_jsonb(matched_item.enhanced_description), 'null'::jsonb)
        );
        
        total_items_updated := total_items_updated + 1;
        
        RAISE NOTICE '  ✅ Updated: % (image: %, desc: %)', 
          matched_item.name,
          CASE WHEN matched_item.image_url IS NOT NULL THEN 'YES' ELSE 'NO' END,
          CASE WHEN matched_item.enhanced_description IS NOT NULL THEN 'YES' ELSE 'NO' END;
      ELSE
        RAISE NOTICE '  ⚠️  No match in items table for: %', (item_element->>'name');
      END IF;
      
      -- Add updated item to array
      updated_items := updated_items || item_element;
    END LOOP;
    
    -- Update the quote with new items array
    UPDATE quotes
    SET 
      items = updated_items,
      updated_at = NOW()
    WHERE id = quote_record.id;
    
  END LOOP;
  
  RAISE NOTICE '✅ Sync complete! Processed % quotes, updated % items', total_quotes, total_items_updated;
END $$;