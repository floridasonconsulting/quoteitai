import { supabase } from "@/integrations/supabase/client";
import { ProposalConversation } from "@/types";

export const conversationService = {
    async submitQuestion(params: {
        quote_id: string;
        section_id: string;
        client_name?: string;
        client_question: string;
        organization_id: string;
    }) {
        console.log('[ConversationService] Submitting question:', params);

        const { data, error } = await (supabase as any)
            .from('proposal_conversations')
            .insert({
                quote_id: params.quote_id,
                section_id: params.section_id,
                client_name: params.client_name,
                client_question: params.client_question,
                organization_id: params.organization_id,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('[ConversationService] Error submitting question:', error);
            throw error;
        }

        // Trigger AI Drafting (Async)
        try {
            const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-assist', {
                body: {
                    featureType: 'proposal_response_draft',
                    prompt: params.client_question,
                    context: {
                        quote_id: params.quote_id,
                        section_id: params.section_id,
                        organization_id: params.organization_id
                    }
                }
            });

            if (!aiError && aiData?.content) {
                await (supabase as any)
                    .from('proposal_conversations')
                    .update({ ai_draft_response: aiData.content })
                    .eq('id', data.id);
            }
        } catch (aiErr) {
            console.error('[ConversationService] AI Drafting failed:', aiErr);
        }

        return data;
    },

    async getConversations(quoteId: string) {
        const { data, error } = await (supabase as any)
            .from('proposal_conversations')
            .select('*')
            .eq('quote_id', quoteId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[ConversationService] Error fetching conversations:', error);
            throw error;
        }

        return data;
    },

    subscribeToResponses(quoteId: string, callback: (payload: any) => void) {
        return supabase
            .channel(`proposal_responses_${quoteId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'proposal_conversations',
                    filter: `quote_id=eq.${quoteId}`
                },
                (payload) => {
                    callback(payload.new);
                }
            )
            .subscribe();
    }
};
