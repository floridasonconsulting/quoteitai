-- Allow public read access to company_settings when viewing shared proposals
-- This enables the proposal viewer to fetch company info without authentication

-- Drop existing restrictive policy (if it exists)
DROP POLICY IF EXISTS "Users can view their own settings" ON company_settings;
DROP POLICY IF EXISTS "Enable read access for own settings" ON company_settings;
DROP POLICY IF EXISTS "Users can only access their own data" ON company_settings;

-- Create new policy: Allow authenticated users to read their own settings
CREATE POLICY "Users can read own settings"
ON company_settings
FOR SELECT
USING (auth.uid() = user_id);

-- CRITICAL: Allow unauthenticated reads for ALL company settings
-- This is safe because company_settings only contains public-facing info
-- (name, logo, address, phone, email - all visible on proposals anyway)
CREATE POLICY "Public read access for proposals"
ON company_settings
FOR SELECT
USING (true); -- Anyone can read

-- Keep write operations restricted to authenticated users
CREATE POLICY "Users can insert own settings"
ON company_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
ON company_settings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
ON company_settings
FOR DELETE
USING (auth.uid() = user_id);

-- Log the operation
DO $$
BEGIN
  RAISE NOTICE '✅ Company settings now publicly readable for proposal viewing';
END $$;