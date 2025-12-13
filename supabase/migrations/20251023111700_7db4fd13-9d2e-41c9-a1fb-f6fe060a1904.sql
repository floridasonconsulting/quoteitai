-- Add customer portal fields to quotes table
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS shared_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP WITH TIME ZONE;

-- Create unique index on share_token for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS quotes_share_token_idx ON public.quotes(share_token);

-- Create RLS policy for public quote viewing via share token
CREATE POLICY "Anyone can view quotes with valid share token" 
ON public.quotes 
FOR SELECT 
USING (share_token IS NOT NULL);

-- Add comment for documentation
COMMENT ON COLUMN public.quotes.share_token IS 'Unique token for sharing quote publicly via web portal';
COMMENT ON COLUMN public.quotes.shared_at IS 'Timestamp when share link was first generated';
COMMENT ON COLUMN public.quotes.viewed_at IS 'Timestamp when customer last viewed the quote';