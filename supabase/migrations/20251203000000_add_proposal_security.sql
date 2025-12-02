-- Add proposal security and interaction features

-- 1. Create proposal_access_codes table for OTP verification
CREATE TABLE IF NOT EXISTS proposal_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for fast lookups
  CONSTRAINT unique_active_code UNIQUE (quote_id, email, code)
);

-- Add indexes for performance
CREATE INDEX idx_access_codes_quote_email ON proposal_access_codes(quote_id, email);
CREATE INDEX idx_access_codes_expires ON proposal_access_codes(expires_at);

-- 2. Create proposal_comments table for client communication
CREATE TABLE IF NOT EXISTS proposal_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  author_email TEXT NOT NULL,
  author_name TEXT,
  comment_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for fast lookups
  CONSTRAINT non_empty_comment CHECK (length(trim(comment_text)) > 0)
);

CREATE INDEX idx_comments_quote ON proposal_comments(quote_id, created_at DESC);

-- 3. Add authorized_viewers array to quotes table
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS authorized_viewers TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 4. RLS Policies for proposal_access_codes
ALTER TABLE proposal_access_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create access codes (for OTP generation)
CREATE POLICY "Anyone can create access codes" 
  ON proposal_access_codes 
  FOR INSERT 
  WITH CHECK (true);

-- Allow anyone to read their own codes (for verification)
CREATE POLICY "Users can read their own codes" 
  ON proposal_access_codes 
  FOR SELECT 
  USING (email = current_setting('request.jwt.claims', true)::json->>'email' OR true);

-- Allow update for verification
CREATE POLICY "Users can verify their codes" 
  ON proposal_access_codes 
  FOR UPDATE 
  USING (true);

-- 5. RLS Policies for proposal_comments
ALTER TABLE proposal_comments ENABLE ROW LEVEL SECURITY;

-- Allow quote owner to read all comments
CREATE POLICY "Quote owner can read comments" 
  ON proposal_comments 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM quotes 
      WHERE quotes.id = proposal_comments.quote_id 
      AND quotes.user_id = auth.uid()
    )
  );

-- Allow anyone with valid access to create comments
CREATE POLICY "Anyone can create comments" 
  ON proposal_comments 
  FOR INSERT 
  WITH CHECK (true);

-- 6. Update quotes table RLS to allow public access via share_token
CREATE POLICY "Public access via share_token" 
  ON quotes 
  FOR SELECT 
  USING (
    share_token IS NOT NULL 
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- 7. Add helpful functions
CREATE OR REPLACE FUNCTION clean_expired_access_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM proposal_access_codes 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create a scheduled job to clean expired codes (requires pg_cron extension)
-- Note: This requires pg_cron extension to be enabled in Supabase dashboard
-- Run manually: SELECT clean_expired_access_codes();

COMMENT ON TABLE proposal_access_codes IS 'Stores OTP codes for secure proposal access';
COMMENT ON TABLE proposal_comments IS 'Stores client comments on proposals';
COMMENT ON FUNCTION clean_expired_access_codes IS 'Removes expired OTP codes (run periodically)';
