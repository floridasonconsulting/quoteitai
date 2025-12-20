import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Quote, Customer, CompanySettings, QuoteItem } from '@/types';
import { ProposalViewer } from '@/components/proposal/viewer/ProposalViewer';
import { OTPSecurityWall } from '@/components/proposal/viewer/OTPSecurityWall';
import { transformQuoteToProposal } from '@/lib/proposal-transformation';
import { PaymentDialog } from '@/components/PaymentDialog';
import { createPaymentIntent } from '@/lib/stripe-service';
import { useAuth } from '@/contexts/AuthContext';
import { visualsService } from '@/lib/services/visuals-service';
import { ProposalVisuals, ProposalSection } from '@/types/proposal';
import { VisualRule } from "@/types";
import { isDemoModeActive } from '@/contexts/DemoContext';
import { MOCK_QUOTES, MOCK_CUSTOMERS } from '@/lib/mockData';

// Helper to safely parse visual rules from JSON or object
const parseVisualRules = (rules: any): VisualRule[] => {
  if (!rules) return [];
  if (Array.isArray(rules)) return rules; // Already an object (Supabase JSONB auto-parsing)
  try {
    return JSON.parse(rules); // Stringified JSON
  } catch (e) {
    console.error("Failed to parse visual rules:", e);
    return [];
  }
};

export default function PublicQuoteView() {
  const { id: shareToken } = useParams<{ id: string }>();
  const { user } = useAuth();

  // CRITICAL: Decode the share token from URL (it was encoded with encodeURIComponent)
  const decodedShareToken = shareToken ? decodeURIComponent(shareToken) : undefined;
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [expired, setExpired] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isMaxAITier, setIsMaxAITier] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [visuals, setVisuals] = useState<ProposalVisuals | null>(null);

  // Wait for auth to initialize before checking session
  useEffect(() => {
    console.log('[PublicQuoteView] Auth state:', { user: user?.id, loading: authLoading });

    // Give auth context a moment to initialize
    const authTimeout = setTimeout(() => {
      setAuthLoading(false);
    }, 1000);

    return () => clearTimeout(authTimeout);
  }, []);

  // Check for existing session token or ownership once auth is ready
  useEffect(() => {
    if (isDemoModeActive()) {
      console.log('[PublicQuoteView] (Demo Mode) Bypassing auth and loading mock data');
      setAuthenticated(true);
      loadDemoData();
      return;
    }

    if (authLoading) {
      console.log('[PublicQuoteView] Waiting for auth to initialize...');
      return;
    }

    console.log('[PublicQuoteView] Auth ready, checking session - shareToken:', decodedShareToken, 'user:', user?.id);
    checkSession();
  }, [decodedShareToken, user?.id, authLoading]);

  const checkSession = async () => {
    console.log('[PublicQuoteView] checkSession - user:', user?.id);

    try {
      // PRIORITY 1: Check for owner bypass flag from URL parameter
      const urlParams = new URLSearchParams(window.location.search);
      const ownerParam = urlParams.get('owner');
      console.log('[PublicQuoteView] Owner parameter check:', ownerParam);

      if (ownerParam === 'true') {
        console.log('[PublicQuoteView] Owner bypass flag found in URL');
        setIsOwner(true);
        setAuthenticated(true);
        setUserEmail(user?.email || 'Owner');
        await loadQuote();
        return;
      }

      // PRIORITY 2: If user is logged in, check if they own the quote
      if (user?.id) {
        console.log('[PublicQuoteView] User logged in, checking ownership...');
        const ownershipResult = await checkOwnership();
        if (ownershipResult) {
          console.log('[PublicQuoteView] User is owner, bypassing OTP');
          return; // Exit early - owner authentication handled
        }
      }

      // PRIORITY 3: Check for existing session token (for external customers)
      console.log('[PublicQuoteView] Not owner, checking session token...');
      const sessionData = sessionStorage.getItem('proposal_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);

        // Check if session is valid and matches current share token
        if (session.shareToken === decodedShareToken &&
          new Date(session.expiresAt) > new Date()) {
          console.log('[PublicQuoteView] Valid session token found');
          setSessionToken(session.token);
          setUserEmail(session.email);
          setAuthenticated(true);
          loadQuote();
        } else {
          // Clear expired/invalid session
          console.log('[PublicQuoteView] Session expired or invalid');
          sessionStorage.removeItem('proposal_session');
          setLoading(false);
        }
      } else {
        console.log('[PublicQuoteView] No session token, showing OTP wall');
        setLoading(false);
      }
    } catch (error) {
      console.error('[PublicQuoteView] Error checking session:', error);
      setLoading(false);
    }
  };

  const checkOwnership = async (): Promise<boolean> => {
    if (!decodedShareToken || !user?.id) {
      console.log('[PublicQuoteView] Missing shareToken or user.id');
      setLoading(false);
      return false;
    }

    try {
      console.log('[PublicQuoteView] Fetching quote with shareToken:', decodedShareToken);

      // Fetch quote to check ownership
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('user_id, id')
        .eq('share_token', decodedShareToken)
        .maybeSingle();

      if (quoteError) {
        console.error('[PublicQuoteView] Error checking ownership:', quoteError);
        setLoading(false);
        return false;
      }

      if (!quoteData) {
        console.error('[PublicQuoteView] Quote not found for shareToken:', decodedShareToken);
        setLoading(false);
        return false;
      }

      console.log('[PublicQuoteView] Quote found - user_id:', quoteData.user_id, 'current user:', user.id);

      // If logged-in user owns the quote, bypass OTP
      if (quoteData.user_id === user.id) {
        console.log('[PublicQuoteView] ✅ User owns quote, bypassing OTP');
        setIsOwner(true);
        setAuthenticated(true);
        setUserEmail(user.email || '');
        await loadQuote();
        return true;
      } else {
        console.log('[PublicQuoteView] User does not own quote');
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('[PublicQuoteView] Error checking ownership:', error);
      setLoading(false);
      return false;
    }
  };

  const handleVerified = (token: string) => {
    console.log('[PublicQuoteView] OTP verified');
    setSessionToken(token);
    setAuthenticated(true);

    // Get email from session
    const sessionData = sessionStorage.getItem('proposal_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      setUserEmail(session.email);
    }

    loadQuote();
  };

  const handleExpired = () => {
    console.log('[PublicQuoteView] Link expired');
    setExpired(true);
    setLoading(false);
  };

  const handleComment = async (comment: string) => {
    if (!quote || !decodedShareToken) return;

    try {
      const { error } = await supabase.functions.invoke('update-quote-status', {
        body: {
          shareToken: decodedShareToken,
          status: 'commented',
          comment: comment
        }
      });

      if (error) throw error;

      toast.success('Comment sent successfully!');
    } catch (error) {
      console.error('[PublicQuoteView] Error sending comment:', error);
      throw error;
    }
  };

  const loadDemoData = () => {
    const demoQuote = { ...MOCK_QUOTES[0] };
    setQuote(demoQuote);
    setCustomer(MOCK_CUSTOMERS[0]);
    setSettings({
      name: 'Quote-it Pro Services',
      address: '123 Enterprise Way',
      city: 'Innovate City',
      state: 'CA',
      zip: '90210',
      phone: '(800) 555-0199',
      email: 'pro@quoteit.ai',
      website: 'www.quoteit.ai',
      logo: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop', // Professional blue abstract logo
      logoDisplayOption: 'both',
      terms: 'Standard professional service terms apply. All work is guaranteed for 12 months.',
      proposalTemplate: 'modern',
      proposalTheme: 'modern-corporate',
      showProposalImages: true,
      currency: 'USD',
    });
    setLoading(false);
  };

  // Load quote data after authentication
  const loadQuote = async () => {
    if (!decodedShareToken) {
      console.error('[PublicQuoteView] No shareToken provided in URL');
      setLoading(false);
      return;
    }

    console.log('[PublicQuoteView] 🚀 Loading quote with shareToken:', decodedShareToken);
    setLoading(true);
    try {
      // Fetch quote by share token
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('share_token', decodedShareToken)
        .maybeSingle();

      if (quoteError) {
        console.error('[PublicQuoteView] ❌ Supabase error:', quoteError);
        throw quoteError;
      }

      if (!quoteData) {
        console.error('[PublicQuoteView] ❌ No quote found with shareToken:', decodedShareToken);
        toast.error('Quote not found or link has expired');
        setLoading(false);
        return;
      }

      // Check if quote has expired
      if (quoteData.expires_at && new Date(quoteData.expires_at) < new Date()) {
        setExpired(true);
        setLoading(false);
        return;
      }

      console.log('[PublicQuoteView] ✅ Quote loaded successfully:', quoteData.id);
      console.log('[PublicQuoteView] Quote user_id:', quoteData.user_id);

      // 🚀 NEW: Fetch visuals from proposal_visuals table
      console.log('[PublicQuoteView] 🖼️ Fetching visuals for quote:', quoteData.id);
      try {
        const visualsData = await visualsService.getVisuals(quoteData.id);
        if (visualsData) {
          console.log('[PublicQuoteView] ✅ Visuals loaded:', visualsData);
          setVisuals(visualsData);
        }
      } catch (visualsError) {
        console.warn('[PublicQuoteView] ⚠️ Could not fetch visuals:', visualsError);
      }

      // 🚀 NEW: Fetch current items table data to enrich quote JSONB
      console.log('[PublicQuoteView] 🔄 Fetching fresh items table data for enrichment...');
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('name, image_url, enhanced_description, category')
        .eq('user_id', quoteData.user_id);

      if (itemsError) {
        console.warn('[PublicQuoteView] ⚠️ Could not fetch items table:', itemsError);
      }

      // Create lookup map for fast item enrichment
      const itemsLookup = new Map();
      if (itemsData) {
        itemsData.forEach(item => {
          itemsLookup.set(item.name, {
            imageUrl: item.image_url,
            enhancedDescription: item.enhanced_description
          });
        });
        console.log('[PublicQuoteView] ✅ Items lookup created:', itemsLookup.size, 'items');
      }

      // Enrich quote items with fresh data from items table
      const enrichedItems = (quoteData.items as unknown as QuoteItem[]).map(quoteItem => {
        const freshData = itemsLookup.get(quoteItem.name);

        // CRITICAL FIX: The quote JSONB uses snake_case (image_url, enhanced_description)
        // but our TypeScript types expect camelCase (imageUrl, enhancedDescription)
        // We need to transform BOTH the JSONB fields AND the fresh data

        // Type-safe access to snake_case fields from JSONB
        type QuoteItemWithSnakeCase = QuoteItem & {
          image_url?: string;
          enhanced_description?: string;
        };
        const itemWithSnakeCase = quoteItem as QuoteItemWithSnakeCase;

        const jsonbImageUrl = itemWithSnakeCase.image_url || quoteItem.imageUrl;
        const jsonbEnhancedDesc = itemWithSnakeCase.enhanced_description || quoteItem.enhancedDescription;

        if (freshData) {
          console.log(`[PublicQuoteView] ✅ Enriching "${quoteItem.name}" with:`, {
            imageUrl: freshData.imageUrl ? '✅ YES' : '❌ NO',
            enhancedDescription: freshData.enhancedDescription ? '✅ YES' : '❌ NO'
          });

          return {
            ...quoteItem,
            imageUrl: freshData.imageUrl || jsonbImageUrl || quoteItem.imageUrl,
            enhancedDescription: freshData.enhancedDescription || jsonbEnhancedDesc || quoteItem.enhancedDescription
          };
        }

        // If no fresh data, still transform snake_case to camelCase
        console.log(`[PublicQuoteView] ⚠️ No fresh data for "${quoteItem.name}", using JSONB:`, {
          hasJsonbImageUrl: !!jsonbImageUrl,
          hasJsonbEnhancedDesc: !!jsonbEnhancedDesc
        });

        return {
          ...quoteItem,
          imageUrl: jsonbImageUrl || quoteItem.imageUrl,
          enhancedDescription: jsonbEnhancedDesc || quoteItem.enhancedDescription
        };
      });

      // Convert database format to app format with ENRICHED items
      const formattedQuote: Quote = {
        id: quoteData.id,
        quoteNumber: quoteData.quote_number,
        customerId: quoteData.customer_id,
        customerName: quoteData.customer_name,
        title: quoteData.title,
        items: enrichedItems, // 🚀 USE ENRICHED ITEMS
        subtotal: Number(quoteData.subtotal),
        tax: Number(quoteData.tax),
        total: Number(quoteData.total),
        status: quoteData.status as 'draft' | 'sent' | 'accepted' | 'declined',
        notes: quoteData.notes,
        sentDate: quoteData.sent_date,
        followUpDate: quoteData.follow_up_date,
        createdAt: quoteData.created_at,
        updatedAt: quoteData.updated_at,
        shareToken: quoteData.share_token,
        sharedAt: quoteData.shared_at,
        viewedAt: quoteData.viewed_at,
        executiveSummary: quoteData.executive_summary,
        userId: quoteData.user_id,
        showPricing: quoteData.show_pricing ?? true,
        pricingMode: (quoteData as any).pricing_mode || 'category_total', // Load pricing mode
        scopeOfWork: (quoteData as any).scope_of_work, // NEW: AI SOW for proposals
      };

      console.log('[PublicQuoteView] ✅ Quote formatted. Item count:', formattedQuote.items.length);

      // ENHANCED DEBUGGING: Check each item's image URL AFTER ENRICHMENT
      console.log('[PublicQuoteView] 📸 ENRICHED Item image status:', formattedQuote.items.map((item, idx) => ({
        index: idx,
        name: item.name,
        hasImageUrl: !!item.imageUrl,
        imageUrl: item.imageUrl,
        imageUrlType: typeof item.imageUrl,
        isValidUrl: item.imageUrl && (item.imageUrl.startsWith('http://') || item.imageUrl.startsWith('https://')),
        hasEnhancedDescription: !!item.enhancedDescription
      })));

      setQuote(formattedQuote);

      // Fetch company settings - CRITICAL for proposal display
      console.log('[PublicQuoteView] 🔍 Fetching company settings for user:', quoteData.user_id);

      const { data: settingsData, error: settingsError } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', quoteData.user_id)
        .maybeSingle();

      if (settingsError) {
        console.error('[PublicQuoteView] ⚠️ Settings fetch error:', settingsError);
        console.log('[PublicQuoteView] Creating fallback settings');
      } else if (settingsData) {
        // Cast to any to access new columns until types are regenerated
        const s = settingsData as any;
        console.log('[PublicQuoteView] ✅ Settings loaded:', {
          name: s.name,
          hasLogo: !!s.logo,
          email: s.email,
          phone: s.phone
        });

        setSettings({
          name: s.name || '',
          address: s.address || '',
          city: s.city || '',
          state: s.state || '',
          zip: s.zip || '',
          phone: s.phone || '',
          email: s.email || '',
          website: s.website || '',
          logo: s.logo || undefined,
          logoDisplayOption: (s.logo_display_option as 'logo' | 'name' | 'both') || 'both',
          license: s.license || '',
          insurance: s.insurance || '',
          terms: s.terms || '',
          proposalTemplate: (s.proposal_template as 'classic' | 'modern' | 'detailed') || 'classic',
          proposalTheme: (s.proposal_theme as any) || 'modern-corporate',
          showProposalImages: s.show_proposal_images ?? true,
          defaultCoverImage: s.default_cover_image || undefined,
          defaultHeaderImage: s.default_header_image || undefined,
          visualRules: s.visual_rules ? parseVisualRules(s.visual_rules) : [],
        });
      } else {
        console.warn('[PublicQuoteView] ⚠️ No settings found, using fallback');
        setSettings({
          name: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          phone: '',
          email: '',
          website: '',
          terms: '',
          proposalTemplate: 'classic',
          proposalTheme: 'modern-corporate',
        });
      }

      console.log('[PublicQuoteView] ✅ Data loading complete!');

    } catch (error) {
      console.error('[PublicQuoteView] ❌ Fatal error:', error);
      toast.error('Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!quote || !decodedShareToken) return;

    try {
      const { error } = await supabase.functions.invoke('update-quote-status', {
        body: { shareToken: decodedShareToken, status: 'accepted' }
      });

      if (error) throw error;

      setQuote({ ...quote, status: 'accepted' });
    } catch (error) {
      console.error('[PublicQuoteView] Error accepting quote:', error);
      throw error;
    }
  };

  const handleReject = async (reason?: string) => {
    if (!quote || !decodedShareToken) return;

    try {
      const { error } = await supabase.functions.invoke('update-quote-status', {
        body: {
          shareToken: decodedShareToken,
          status: 'declined',
          rejectionReason: reason
        }
      });

      if (error) throw error;

      setQuote({ ...quote, status: 'declined' });
    } catch (error) {
      console.error('[PublicQuoteView] Error rejecting quote:', error);
      throw error;
    }
  };

  // Show loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading proposal...</p>
        </div>
      </div>
    );
  }

  // Show expired state
  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Link Expired</h1>
          <p className="text-muted-foreground">
            This proposal link has expired. Please contact the sender for a new link.
          </p>
        </div>
      </div>
    );
  }

  // Show OTP wall only if not authenticated and not the owner
  if (!authenticated && decodedShareToken && !isOwner) {
    console.log('[PublicQuoteView] Rendering OTP wall');
    return (
      <OTPSecurityWall
        shareToken={decodedShareToken}
        onVerified={handleVerified}
        onExpired={handleExpired}
      />
    );
  }

  // Show not found if no quote
  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Quote Not Found</h1>
          <p className="text-muted-foreground">This link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  // Render the new ProposalViewer
  console.log('[PublicQuoteView] 🎨 Rendering ProposalViewer');
  console.log('[PublicQuoteView] Settings:', settings);
  console.log('[PublicQuoteView] Quote:', { id: quote.id, itemCount: quote.items.length });

  return (
    <div className="min-h-screen bg-slate-50">
      <ProposalViewer
        quote={quote}
        settings={settings || {
          name: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          phone: '',
          email: '',
          website: '',
          terms: '',
          proposalTemplate: 'classic',
          proposalTheme: 'modern-corporate',
        }}
        onAccept={handleAccept}
        onDecline={handleReject}
        onComment={handleComment}
        isReadOnly={isOwner}
        visuals={visuals || undefined}
      />

      {/* Hidden Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        quoteTotal={quote.total}
        onConfirmPayment={async () => { }}
      />
    </div>
  );
}