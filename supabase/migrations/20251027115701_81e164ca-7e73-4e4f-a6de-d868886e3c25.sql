-- Allow public access to company_settings when viewing shared quotes
-- This is safe because all company_settings data is meant to be displayed on public quotes anyway
CREATE POLICY "Anyone can view company settings for shared quotes"
ON public.company_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.quotes
    WHERE quotes.user_id = company_settings.user_id
    AND quotes.share_token IS NOT NULL
  )
);