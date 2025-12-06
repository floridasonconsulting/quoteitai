-- Add proposal_visuals table to store visual assets per quote
CREATE TABLE IF NOT EXISTS proposal_visuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_image TEXT,
  logo_url TEXT,
  gallery JSONB DEFAULT '[]'::jsonb,
  section_backgrounds JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE proposal_visuals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own proposal visuals"
  ON proposal_visuals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own proposal visuals"
  ON proposal_visuals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proposal visuals"
  ON proposal_visuals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own proposal visuals"
  ON proposal_visuals FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_proposal_visuals_quote_id ON proposal_visuals(quote_id);
CREATE INDEX IF NOT EXISTS idx_proposal_visuals_user_id ON proposal_visuals(user_id);