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

    const visualsData = data as any;
    return {
      coverImage: visualsData.cover_image,
      logo: visualsData.logo_url,
      gallery: (visualsData.gallery as string[]) || [],
      sectionBackgrounds: (visualsData.section_backgrounds as Record<string, string>) || {},
      itemImages: (visualsData.item_images as Record<string, string>) || {}
    };
  },

  /**
   * Helper to get current user ID
   */
  async getUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    return user.id;
  },

  /**
   * Save or update visuals for a quote
   */
  async saveVisuals(quoteId: string, visuals: ProposalVisuals): Promise<void> {
    const userId = await this.getUserId();
    const dbData: any = {
      user_id: userId,
      quote_id: quoteId,
      cover_image: visuals.coverImage,
      logo_url: visuals.logo,
      gallery: visuals.gallery,
      section_backgrounds: visuals.sectionBackgrounds,
      item_images: visuals.itemImages,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('proposal_visuals')
      .upsert(dbData, { onConflict: 'quote_id' });

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
  },

  /**
   * Save an override for the cover image
   */
  async saveCoverOverride(quoteId: string, url: string): Promise<void> {
    const { data: existing } = await supabase
      .from('proposal_visuals')
      .select('id')
      .eq('quote_id', quoteId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('proposal_visuals')
        .update({ cover_image: url, updated_at: new Date().toISOString() })
        .eq('id', (existing as any).id);
    } else {
      const userId = await this.getUserId();
      await supabase
        .from('proposal_visuals')
        .insert({
          user_id: userId,
          quote_id: quoteId,
          cover_image: url,
        } as any);
    }
  },

  /**
   * Save an override for a specific section background
   */
  async saveSectionImageOverride(quoteId: string, sectionId: string, url: string): Promise<void> {
    const { data: existing } = await supabase
      .from('proposal_visuals')
      .select('id, section_backgrounds')
      .eq('quote_id', quoteId)
      .maybeSingle();

    const sectionBackgrounds = ((existing as any)?.section_backgrounds as Record<string, string>) || {};
    sectionBackgrounds[sectionId] = url;

    if (existing) {
      await supabase
        .from('proposal_visuals')
        .update({ section_backgrounds: sectionBackgrounds, updated_at: new Date().toISOString() })
        .eq('id', (existing as any).id);
    } else {
      const userId = await this.getUserId();
      await supabase
        .from('proposal_visuals')
        .insert({
          user_id: userId,
          quote_id: quoteId,
          section_backgrounds: sectionBackgrounds,
        } as any);
    }
  },

  /**
   * Save an override for an item image
   * Note: If 'item_images' column is missing, we'll gracefully fail or log for now.
   * Assuming the table will be updated or we use section_backgrounds as a catch-all.
   */
  async saveItemImageOverride(quoteId: string, itemName: string, url: string): Promise<void> {
    const { data: existing } = await supabase
      .from('proposal_visuals')
      .select('id, item_images, section_backgrounds')
      .eq('quote_id', quoteId)
      .maybeSingle();

    const existingData = existing as any;
    const itemImages = (existingData?.item_images as Record<string, string>) || {};
    itemImages[itemName] = url;

    const updateData: any = {
      item_images: itemImages,
      updated_at: new Date().toISOString()
    };

    if (existingData) {
      const { error } = await supabase
        .from('proposal_visuals')
        .update(updateData)
        .eq('id', existingData.id);

      if (error && error.message?.includes('item_images')) {
        console.warn('[Visuals] item_images column missing, falling back to section_backgrounds');
        const sectionBackgrounds = (existingData?.section_backgrounds as Record<string, string>) || {};
        sectionBackgrounds[`item_${itemName}`] = url;
        await supabase
          .from('proposal_visuals')
          .update({ section_backgrounds: sectionBackgrounds })
          .eq('id', existingData.id);
      }
    } else {
      const userId = await this.getUserId();
      const { error } = await supabase
        .from('proposal_visuals')
        .insert({
          user_id: userId,
          quote_id: quoteId,
          ...updateData
        });

      if (error && error.message?.includes('item_images')) {
        console.warn('[Visuals] item_images column missing on insert, retrying without it');
        const sectionBackgrounds = { [`item_${itemName}`]: url };
        await supabase
          .from('proposal_visuals')
          .insert({
            user_id: userId,
            quote_id: quoteId,
            section_backgrounds: sectionBackgrounds
          });
      }
    }
  }
};
