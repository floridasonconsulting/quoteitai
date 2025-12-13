import { supabase } from "@/integrations/supabase/client";

/**
 * Quote link expiration and security utilities
 */

export interface QuoteLinkConfig {
  quoteId: string;
  expiresAt: Date;
  maxViews?: number;
  requirePassword?: boolean;
  password?: string;
}

export interface QuoteLinkValidation {
  isValid: boolean;
  reason?: string;
  remainingViews?: number;
}

/**
 * Generate a secure public link for a quote with expiration
 */
export async function generateSecureQuoteLink(config: QuoteLinkConfig): Promise<string> {
  const { quoteId, expiresAt, maxViews, requirePassword, password } = config;

  try {
    // Store link metadata in database
    const { data, error } = await supabase
      .from("quote_links")
      .insert({
        quote_id: quoteId,
        expires_at: expiresAt.toISOString(),
        max_views: maxViews || null,
        current_views: 0,
        requires_password: requirePassword || false,
        password_hash: requirePassword && password ? await hashPassword(password) : null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Generate secure token
    const token = generateSecureToken();
    
    // Store token mapping
    await supabase
      .from("quote_link_tokens")
      .insert({
        link_id: data.id,
        token,
        created_at: new Date().toISOString(),
      });

    return `${window.location.origin}/quote/${quoteId}?token=${token}`;
  } catch (error) {
    console.error("Failed to generate secure quote link:", error);
    throw new Error("Failed to generate secure link");
  }
}

/**
 * Validate a quote link token
 */
export async function validateQuoteLink(
  quoteId: string,
  token: string,
  password?: string
): Promise<QuoteLinkValidation> {
  try {
    // Get token data
    const { data: tokenData, error: tokenError } = await supabase
      .from("quote_link_tokens")
      .select("link_id")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      return { isValid: false, reason: "Invalid or expired link" };
    }

    // Get link metadata
    const { data: linkData, error: linkError } = await supabase
      .from("quote_links")
      .select("*")
      .eq("id", tokenData.link_id)
      .eq("quote_id", quoteId)
      .single();

    if (linkError || !linkData) {
      return { isValid: false, reason: "Link not found" };
    }

    // Check if link is active
    if (!linkData.is_active) {
      return { isValid: false, reason: "Link has been deactivated" };
    }

    // Check expiration
    const now = new Date();
    const expiresAt = new Date(linkData.expires_at);
    if (now > expiresAt) {
      // Deactivate expired link
      await supabase
        .from("quote_links")
        .update({ is_active: false })
        .eq("id", linkData.id);

      return { isValid: false, reason: "Link has expired" };
    }

    // Check max views
    if (linkData.max_views && linkData.current_views >= linkData.max_views) {
      return { 
        isValid: false, 
        reason: "Maximum views reached",
        remainingViews: 0,
      };
    }

    // Check password if required
    if (linkData.requires_password) {
      if (!password) {
        return { isValid: false, reason: "Password required" };
      }

      const isPasswordValid = await verifyPassword(password, linkData.password_hash);
      if (!isPasswordValid) {
        return { isValid: false, reason: "Incorrect password" };
      }
    }

    // Increment view count
    await supabase
      .from("quote_links")
      .update({ 
        current_views: linkData.current_views + 1,
        last_viewed_at: new Date().toISOString(),
      })
      .eq("id", linkData.id);

    const remainingViews = linkData.max_views 
      ? linkData.max_views - (linkData.current_views + 1)
      : undefined;

    return { 
      isValid: true, 
      remainingViews,
    };
  } catch (error) {
    console.error("Failed to validate quote link:", error);
    return { isValid: false, reason: "Validation error" };
  }
}

/**
 * Revoke/deactivate a quote link
 */
export async function revokeQuoteLink(quoteId: string): Promise<void> {
  try {
    await supabase
      .from("quote_links")
      .update({ is_active: false })
      .eq("quote_id", quoteId);
  } catch (error) {
    console.error("Failed to revoke quote link:", error);
    throw new Error("Failed to revoke link");
  }
}

/**
 * Get quote link analytics
 */
export async function getQuoteLinkAnalytics(quoteId: string) {
  try {
    const { data, error } = await supabase
      .from("quote_links")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Failed to get quote link analytics:", error);
    return [];
  }
}

/**
 * Generate a cryptographically secure token
 */
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Hash a password using SubtleCrypto
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify a password against a hash
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Clean up expired links (should be run periodically)
 */
export async function cleanupExpiredLinks(): Promise<number> {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from("quote_links")
      .update({ is_active: false })
      .lt("expires_at", now)
      .eq("is_active", true)
      .select();

    if (error) throw error;

    return data?.length || 0;
  } catch (error) {
    console.error("Failed to cleanup expired links:", error);
    return 0;
  }
}
