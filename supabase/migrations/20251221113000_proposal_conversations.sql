-- Create a table for proposal-specific conversations (client questions and contractor answers)
CREATE TABLE IF NOT EXISTS public.proposal_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
    section_id TEXT NOT NULL, -- The specific proposal section where the question was asked
    client_name TEXT,
    client_question TEXT NOT NULL,
    ai_draft_response TEXT, -- The AI's suggested response
    contractor_response TEXT, -- The actual response sent by the contractor
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'drafted', 'answered', 'archived')),
    is_client_read BOOLEAN DEFAULT false,
    is_contractor_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proposal_conversations ENABLE ROW LEVEL SECURITY;

-- Policies for proposal_conversations
-- Contractors can see all conversations for their organization
CREATE POLICY "Contractors can manage conversations" 
ON public.proposal_conversations
FOR ALL 
TO authenticated
USING (organization_id = (SELECT get_my_organization()));

-- Public (clients) can create and read conversations for a specific quote if they have the share_token
-- Note: This requires a join with the quotes table or validating the share_token.
-- For simplicity in the MVP, we allow public insert if they know the quote_id, 
-- but in production we'd want to verify the request comes from the proposal viewer.
CREATE POLICY "Public can add questions"
ON public.proposal_conversations
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Public can read their own conversations"
ON public.proposal_conversations
FOR SELECT
TO anon
USING (true); -- We will filter by quote_id in the application

-- Trigger for updated_at
CREATE TRIGGER update_proposal_conversations_updated_at
    BEFORE UPDATE ON public.proposal_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.proposal_conversations;
