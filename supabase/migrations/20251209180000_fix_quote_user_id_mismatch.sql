-- Fix Quote User ID Mismatch
-- Move quotes to the user who owns the items (94b666f9-c0d...)

DO $$
DECLARE
  items_user_id UUID;
  quote_user_id UUID;
  affected_quotes INTEGER;
BEGIN
  -- Get the user_id from items table (the one with actual data)
  SELECT user_id INTO items_user_id
  FROM items
  LIMIT 1;
  
  -- Get the user_id from quotes table (the mismatched one)
  SELECT user_id INTO quote_user_id
  FROM quotes
  WHERE items IS NOT NULL
  LIMIT 1;
  
  RAISE NOTICE '🔍 Items belong to user: %', items_user_id;
  RAISE NOTICE '🔍 Quotes belong to user: %', quote_user_id;
  
  -- If they're different, fix it
  IF items_user_id != quote_user_id THEN
    RAISE NOTICE '⚠️  User ID mismatch detected! Fixing...';
    
    -- Update all quotes to use the items user_id
    UPDATE quotes
    SET user_id = items_user_id
    WHERE user_id = quote_user_id;
    
    GET DIAGNOSTICS affected_quotes = ROW_COUNT;
    RAISE NOTICE '✅ Updated % quotes to correct user_id', affected_quotes;
    
    -- Also update customers if they exist with wrong user_id
    UPDATE customers
    SET user_id = items_user_id
    WHERE user_id = quote_user_id;
    
    -- Update company_settings if needed
    UPDATE company_settings
    SET user_id = items_user_id
    WHERE user_id = quote_user_id;
    
    RAISE NOTICE '✅ All data consolidated to user: %', items_user_id;
  ELSE
    RAISE NOTICE '✅ User IDs already match - no fix needed';
  END IF;
END $$;