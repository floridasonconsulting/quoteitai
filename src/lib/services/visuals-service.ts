import { supabase } from "@/integrations/supabase/client";
import { ProposalVisuals } from "@/types/proposal";

export const visualsService = {
  /**
   * Get visuals for a specific quote
   */
  async getVisuals(quoteId: string): Promise<ProposalVisuals | null> {
    const { data, error } = await supabase
      .from('proposal_visuals' as any)
      .select('*')
      .eq('quote_id', quoteId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching visuals:', error);
      throw error;
    }

    const visualsData = data as any;

    // Extract item images from both sources for backward compatibility
    const itemImagesFromColumn = (visualsData.item_images as Record<string, string>) || {};
    const sectionBackgrounds = (visualsData.section_backgrounds as Record<string, string>) || {};

    // Extract item images from section_backgrounds (fallback storage)
    const itemImagesFromSections: Record<string, string> = {};
    const cleanedSectionBackgrounds: Record<string, string> = {};
    for (const [key, value] of Object.entries(sectionBackgrounds)) {
      if (key.startsWith('item_')) {
        itemImagesFromSections[key.substring(5)] = value; // Remove "item_" prefix
      } else {
        cleanedSectionBackgrounds[key] = value;
      }
    }

    // Merge: item_images column takes precedence over section_backgrounds fallback
    const mergedItemImages = { ...itemImagesFromSections, ...itemImagesFromColumn };

    return {
      coverImage: visualsData.cover_image,
      logo: visualsData.logo_url,
      gallery: (visualsData.gallery as string[]) || [],
      sectionBackgrounds: cleanedSectionBackgrounds,
      itemImages: mergedItemImages
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
      .from('proposal_visuals' as any)
      .upsert(dbData, { onConflict: 'quote_id' });

    if (error) {
      console.error('Error saving visuals:', error);
      throw error;
    }
  },



  /**
   * Save an override for the cover image
   */
  async saveCoverOverride(quoteId: string, url: string): Promise<void> {
    const { data: existing } = await supabase
      .from('proposal_visuals' as any)
      .select('id')
      .eq('quote_id', quoteId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('proposal_visuals' as any)
        .update({ cover_image: url, updated_at: new Date().toISOString() })
        .eq('id', (existing as any).id);
    } else {
      const userId = await this.getUserId();
      await supabase
        .from('proposal_visuals' as any)
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
      .from('proposal_visuals' as any)
      .select('id, section_backgrounds')
      .eq('quote_id', quoteId)
      .maybeSingle();

    const sectionBackgrounds = ((existing as any)?.section_backgrounds as Record<string, string>) || {};
    sectionBackgrounds[sectionId] = url;

    if (existing) {
      await supabase
        .from('proposal_visuals' as any)
        .update({ section_backgrounds: sectionBackgrounds, updated_at: new Date().toISOString() })
        .eq('id', (existing as any).id);
    } else {
      const userId = await this.getUserId();
      await supabase
        .from('proposal_visuals' as any)
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
      .from('proposal_visuals' as any)
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
        .from('proposal_visuals' as any)
        .update(updateData)
        .eq('id', existingData.id);

      if (error) {
        console.warn('[Visuals] Error saving item_images, falling back to section_backgrounds:', error.message);
        const sectionBackgrounds = (existingData?.section_backgrounds as Record<string, string>) || {};
        sectionBackgrounds[`item_${itemName}`] = url;
        const { error: fallbackError } = await supabase
          .from('proposal_visuals' as any)
          .update({ section_backgrounds: sectionBackgrounds, updated_at: new Date().toISOString() })
          .eq('id', existingData.id);
        if (fallbackError) {
          console.error('[Visuals] Fallback save also failed:', fallbackError);
          throw fallbackError;
        }
      }
    } else {
      const userId = await this.getUserId();
      const { error } = await supabase
        .from('proposal_visuals' as any)
        .insert({
          user_id: userId,
          quote_id: quoteId,
          ...updateData
        });

      if (error) {
        console.warn('[Visuals] Error inserting with item_images, retrying without it:', error.message);
        const sectionBackgrounds = { [`item_${itemName}`]: url };
        const { error: fallbackError } = await supabase
          .from('proposal_visuals' as any)
          .insert({
            user_id: userId,
            quote_id: quoteId,
            section_backgrounds: sectionBackgrounds
          });
        if (fallbackError) {
          console.error('[Visuals] Fallback insert also failed:', fallbackError);
          throw fallbackError;
        }
      }
    }
  }
};
