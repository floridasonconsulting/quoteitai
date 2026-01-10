-- Allow anonymous users to view customer contact info when accessing quotes via share_token
-- This enables "Prepared for [Contact Name]" to work on public quote pages

CREATE POLICY "Anyone can view customer contact info for shared quotes"
    ON customers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM quotes
            WHERE quotes.customer_id = customers.id
            AND quotes.share_token IS NOT NULL
            AND quotes.expires_at > NOW()
        )
    );
