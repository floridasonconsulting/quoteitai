import { supabase } from "@/integrations/supabase/client";
import { ProposalVisuals } from "@/types/proposal";

export const visualsService = {
  /**
   * Get visuals for a specific quote
   */
  async getVisuals(quoteId: string): Promise<ProposalVisuals | null> {
    const { data, error } = await supabase
      .from('proposal_visuals')
      .select('*')
      .eq('quote_id', quoteId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching visuals:', error);
      throw error;
    }

    return {
      coverImage: data.cover_image,
      logo: data.logo_url,
      gallery: data.gallery_images || [],
      sectionBackgrounds: data.section_backgrounds || {}
    };
  },

  /**
   * Save or update visuals for a quote
   */
  async saveVisuals(quoteId: string, visuals: ProposalVisuals): Promise<void> {
    const { error } = await supabase
      .from('proposal_visuals')
      .upsert({
        quote_id: quoteId,
        cover_image: visuals.coverImage,
        logo_url: visuals.logo,
        gallery_images: visuals.gallery,
        section_backgrounds: visuals.sectionBackgrounds,
        updated_at: new Date().toISOString()
      }, { onConflict: 'quote_id' });

    if (error) {
      console.error('Error saving visuals:', error);
      throw error;
    }
  },

  /**
   * AI Auto-Match: Find images based on keywords (Mock implementation for now)
   */
  async autoMatchImages(keywords: string[]): Promise<string[]> {
    // In a real implementation, this would call Unsplash API via Edge Function
    // For now, return high-quality Unsplash fallbacks based on keywords
    const poolImages = [
      "https://images.unsplash.com/photo-1572331165267-854da2b00ca1?w=800&q=80",
      "https://images.unsplash.com/photo-1562778612-e1e0cda9915c?w=800&q=80",
      "https://images.unsplash.com/photo-1576013551627-0cc20b468848?w=800&q=80"
    ];
    return poolImages;
  }
};