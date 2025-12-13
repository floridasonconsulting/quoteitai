-- Consolidate All Data to Single User Account
-- This fixes the multi-user chaos by moving everything to the user with company_settings

-- Step 1: Identify the "primary" user (the one with company_settings)
DO $$
DECLARE
  primary_user_id UUID;
BEGIN
  -- Get the user_id from company_settings (the one with actual company info)
  SELECT user_id INTO primary_user_id
  FROM company_settings
  WHERE name IS NOT NULL AND name != ''
  LIMIT 1;
  
  IF primary_user_id IS NULL THEN
    RAISE EXCEPTION 'No primary user found with company settings';
  END IF;
  
  RAISE NOTICE 'Primary user identified: %', primary_user_id;
  
  -- Step 2: Update ALL quotes to belong to primary user
  UPDATE quotes
  SET user_id = primary_user_id
  WHERE user_id != primary_user_id;
  
  RAISE NOTICE 'Updated % quotes to primary user', (SELECT COUNT(*) FROM quotes WHERE user_id = primary_user_id);
  
  -- Step 3: Update ALL items to belong to primary user
  UPDATE items
  SET user_id = primary_user_id
  WHERE user_id != primary_user_id;
  
  RAISE NOTICE 'Updated % items to primary user', (SELECT COUNT(*) FROM items WHERE user_id = primary_user_id);
  
  -- Step 4: Update ALL customers to belong to primary user
  UPDATE customers
  SET user_id = primary_user_id
  WHERE user_id != primary_user_id;
  
  RAISE NOTICE 'Updated % customers to primary user', (SELECT COUNT(*) FROM customers WHERE user_id = primary_user_id);
  
  -- Step 5: Clean up any duplicate company_settings (keep only primary)
  DELETE FROM company_settings
  WHERE user_id != primary_user_id;
  
  RAISE NOTICE 'Consolidation complete! All data now belongs to: %', primary_user_id;
END $$;