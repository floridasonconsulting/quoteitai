import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase, createFreshSupabaseClient } from '@/integrations/supabase/client';
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
import { executeWithPool, dedupedRequest, clearInFlightRequests } from '@/lib/services/request-pool-service';
import { getItems } from '@/lib/services/item-service';

// Helper to safely parse visual rules from JSON or object
const parseVisualRules = (rules: any): VisualRule[] => {
  if (!rules) return [];
  if (Array.isArray(rules)) return rules; // Already an object (Supabase JSONB auto-parsing)
  try {
    return typeof rules === 'string' ? JSON.parse(rules) : rules; // Safe handling
  } catch (e) {
    console.error("Failed to parse visual rules:", e);
    return [];
  }
};

export default function PublicQuoteView() {
  const { id: shareToken } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();

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
  const [visuals, setVisuals] = useState<ProposalVisuals | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Track unmount to prevent state updates on aborted requests
  const isUnmounted = useRef(false);

  // 🚀 LIBRARY ISOLATION:  // Create a dedicated, isolated Supabase client for this view.
  // We use decodedShareToken as a dependency to ensure each DIFFERENT quote gets a fresh client instance.
  // This prevents library-level state poisoning or deadlocks from previous attempts.
  const quoteClient = useMemo(() => {
    console.log('[PublicQuoteView] Creating fresh isolated client instance for token:', shareToken);
    return createFreshSupabaseClient();
  }, [decodedShareToken]);

  useEffect(() => {
    isUnmounted.current = false;
    return () => {
      isUnmounted.current = true;
      console.log('[PublicQuoteView] Unmounting, stopping state updates');
    };
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
      const { data: quoteData, error: quoteError } = await dedupedRequest(`check-ownership-${decodedShareToken}`, async (signal) => {
        return await (quoteClient
          .from('quotes')
          .select('user_id')
          .eq('share_token', decodedShareToken)
          .single() as any).abortSignal(signal);
      }, 10000);

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
      const { error } = await quoteClient.functions.invoke('update-quote-status', {
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
      name: 'Sellegance Pro Services',
      address: '123 Enterprise Way',
      city: 'Innovate City',
      state: 'CA',
      zip: '90210',
      phone: '(800) 555-0199',
      email: 'pro@sellegance.com',
      website: 'www.sellegance.com',
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
  /**
   * HIGH RESILIENCE FALLBACK: Fetches data using ONLY raw browser fetch.
   * This bypasses the Supabase-JS library entirely.
   */
  async function fetchDataNaked(table: string, queryParams: string, single: boolean = false): Promise<any> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) throw new Error("Missing Supabase configuration");

    const url = `${supabaseUrl}/rest/v1/${table}?${queryParams}`;
    console.log(`[PublicQuoteView] 🌪️ NAKED FETCH for ${table}: ${url}`);

    const response = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
        // RLS will depend on the anon key or public access policies
      }
    });

    if (!response.ok) {
      throw new Error(`Naked Fetch failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data || data.length === 0) return null;

    return single ? data[0] : data;
  }

  /**
   * WRAPPER: Executes a library request with a "soft timeout" and automatic fallback to naked fetch.
   */
  async function executeWithBypass<T>(
    label: string,
    libraryFn: (signal: AbortSignal) => Promise<T>,
    fallbackFn: () => Promise<T>, // Fixed signature
    timeoutOverride: number = 2500 // Allow explicit timeout override
  ): Promise<{ data: T | null; usedBypass: boolean }> {
    try {
      // 1. Try Library with Soft Timeout
      const softTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutOverride));

      // Create a real promise for the library function using dedupedRequest logic or direct call
      // We assume the caller passes a function that fits the pattern
      const libraryPromise = dedupedRequest(label, libraryFn, 30000);

      const raceResult = await Promise.race([libraryPromise, softTimeout]);

      if (raceResult === null) {
        console.warn(`[PublicQuoteView] ⚠️ Library fetch [${label}] timed out (>2.5s), triggering bypass...`);
        throw new Error('Soft timeout'); // Trigger catch block
      }

      const { data, error } = raceResult as any;
      if (error) throw error;

      return { data, usedBypass: false };

    } catch (err) {
      console.warn(`[PublicQuoteView] ⚠️ Library [${label}] failed/hung, trying NAKED FALLBACK...`, err);
      try {
        const data = await fallbackFn();
        console.log(`[PublicQuoteView] ✅ NAKED FALLBACK [${label}] succeeded`);
        return { data, usedBypass: true };
      } catch (nakedErr) {
        console.error(`[PublicQuoteView] ❌ ALL methods failed for [${label}]:`, nakedErr);
        throw nakedErr; // Re-throw to be handled by caller
      }
    }
  }

  const loadQuote = async () => {
    if (!decodedShareToken) {
      console.error('[PublicQuoteView] No shareToken provided in URL');
      setLoading(false);
      return;
    }

    console.log('[PublicQuoteView] 🚀 Loading quote data...', { shareToken: decodedShareToken });
    const queryStartTime = Date.now();
    setLoading(true);

    try {
      // Step -1: Naked Fetch Ping (Bypassing Supabase Library)
      console.log('[PublicQuoteView] 📡 Step -1: Sending NAKED FETCH ping (Bypassing Library)...');
      let nakedSuccess = false;
      const nakedFetchStart = Date.now();
      try {
        const sbUrl = (supabase as any).supabaseUrl;
        const sbKey = (supabase as any).supabaseKey;
        const pingUrl = `${sbUrl}/rest/v1/quotes?select=id&limit=1`;

        const response = await fetch(pingUrl, {
          method: 'GET',
          headers: {
            'apikey': sbKey,
            'Authorization': `Bearer ${sbKey}`,
            'Range-Unit': 'items',
            'Range': '0-0'
          }
        });

        if (response.ok) {
          nakedSuccess = true;
        }
        console.log(`[PublicQuoteView] ✓ NAKED FETCH ping result: ${response.status} (${Date.now() - nakedFetchStart}ms)`);
        if (!response.ok) {
          const body = await response.text();
          console.warn('[PublicQuoteView] Native fetch returned error status:', response.status, body);
        }
      } catch (fetchErr) {
        console.warn('[PublicQuoteView] ❌ NAKED FETCH failed:', fetchErr);
      }

      // Step 0: Diagnostic Ping (Verify library is responsive) -- ONLY IF NAKED FAILED
      if (!nakedSuccess) {
        console.log('[PublicQuoteView] 📡 Step 0: Sending LIBRARY ping (Naked fetch failed)...');
        try {
          const libPingStart = Date.now();
          await executeWithPool(async (signal) => {
            return await (quoteClient.from('quotes').select('*', { count: 'estimated', head: true }).limit(1).abortSignal(signal) as any);
          },
            3000, // Reduced from 10s to 3s
            'ping-supabase'
          );
          console.log(`[PublicQuoteView] ✓ LIBRARY ping successful (${Date.now() - libPingStart}ms)`);
        } catch (pingErr) {
          console.warn('[PublicQuoteView] ⚠️ LIBRARY ping failed:', pingErr);
        }
      } else {
        console.log('[PublicQuoteView] ⏭️ Skipping LIBRARY ping (Naked fetch succeeded).');
      }

      // Step 1: Lightweight Metadata Fetch (Excludes 'items' JSONB)
      // This isolates if the hang is caused by RLS / indexing OR by the payload size
      // --- STEP 1: FETCH QUOTE METADATA ---
      // --- STEP 1: FETCH QUOTE METADATA ---
      console.log('[PublicQuoteView] 📡 Step 1: Fetching Quote Metadata (Excluding Items)...');
      let quoteMetadata: any = null;
      let usedBypassForMeta = false;

      try {
        const result = await executeWithBypass(
          `quote-meta-${decodedShareToken}`,
          (signal) => (quoteClient
            .from('quotes')
            .select('*')
            .eq('share_token', decodedShareToken)
            .maybeSingle() as any).abortSignal(signal),
          () => fetchDataNaked('quotes', `share_token=eq.${encodeURIComponent(decodedShareToken)}&select=*`, true)
        );
        quoteMetadata = result.data;
        usedBypassForMeta = result.usedBypass;

      } catch (err) {
        console.error("Critical failure loading metadata:", err);
        setError("Unable to retrieve quote data. Please check your connection.");
        setLoading(false);
        return;
      }

      if (isUnmounted.current) return;

      if (!quoteMetadata) {
        console.error('[PublicQuoteView] ❌ Quote not found for token:', decodedShareToken);
        setError('Proposal not found. It may have been deleted or the link is incorrect.');
        setLoading(false);
        return;
      }

      console.log(`[PublicQuoteView] ✅ Metadata retrieved (${usedBypassForMeta ? 'NAKED' : 'LIBRARY'}) in`, Date.now() - queryStartTime, 'ms');

      // CRITICAL: Normalize items immediately (snake_case -> camelCase) in case we skip Step 3
      const rawInitialItems = (quoteMetadata as any).items || [];
      const normalizedInitialItems = Array.isArray(rawInitialItems) ? rawInitialItems.map((item: any) => ({
        ...item,
        imageUrl: item.image_url || item.imageUrl,
        enhancedDescription: item.enhanced_description || item.enhancedDescription
      })) : [];

      const quoteData = {
        ...(quoteMetadata as any),
        items: normalizedInitialItems
      };

      if (!isUnmounted.current) {
        console.log('[PublicQuoteView] ✅ Committing Metadata to state (Items: ' + normalizedInitialItems.length + ')');
        console.log('[PublicQuoteView] 🔍 Quote user_id:', quoteData.user_id, '| Current authenticated user:', user?.id || 'NONE');
        setQuote(quoteData);
      } else {
        console.warn('[PublicQuoteView] Unmounted before metadata commit');
        return;
      }

      // Step 2: Fetch customer data separately if needed

      // 🚀 PARALLEL DATA LOADING: Fire secondary requests concurrently!
      // This ensures that a single slow request (e.g. Customer) doesn't block critical visuals
      console.log('[PublicQuoteView] 🚀 Firing parallel secondary data fetches...');

      const fetchCustomer = async () => {
        if (!quoteData.customer_id) return;
        try {
          console.log('[PublicQuoteView] 📡 Step 2: Fetching customer data for:', quoteData.customer_id);

          const { data: customerData } = await executeWithBypass(
            `customer-${quoteData.customer_id}`,
            (signal) => (quoteClient
              .from('customers')
              .select('contact_first_name, contact_last_name')
              .eq('id', quoteData.customer_id)
              .maybeSingle() as any).abortSignal(signal),
            () => fetchDataNaked('customers', `id=eq.${quoteData.customer_id}&select=contact_first_name,contact_last_name`, true)
          );

          if (customerData && !isUnmounted.current) {
            console.log('[PublicQuoteView] ✅ Customer data received');
            setQuote(prev => {
              if (!prev) return null;
              // Extract contact name
              const c = customerData as any;
              const contactName = `${c.contact_first_name || ''} ${c.contact_last_name || ''}`.trim();
              return { ...prev, customers: customerData, contactName: contactName || prev.contactName };
            });
          }
        } catch (err) {
          console.warn('[PublicQuoteView] ⚠️ Step 2 (Customer) failed, continuing...', err);
        }
      };

      const fetchHeavyItems = async () => {
        // Optimization: If Step 1 already loaded items, skip!
        if (quoteData.items && Array.isArray(quoteData.items) && quoteData.items.length > 0) {
          console.log('[PublicQuoteView] ✅ Items already loaded in Step 1, skipping Step 3.');
          return;
        }

        try {
          console.log('[PublicQuoteView] 📡 Step 3: Fetching Heavy Line Items (JSONB)...');
          const itemsFetchStart = Date.now();

          const { data: heavyItemsData } = await executeWithBypass(
            `quote-items-${decodedShareToken}`,
            (signal) => (quoteClient
              .from('quotes')
              .select('items')
              .eq('id', quoteData.id)
              .single() as any).abortSignal(signal),
            () => fetchDataNaked('quotes', `id=eq.${quoteData.id}&select=items`, true)
          );

          if (heavyItemsData && (heavyItemsData as any).items && !isUnmounted.current) {
            console.log('[PublicQuoteView] ✅ Items payload received in', Date.now() - itemsFetchStart, 'ms');
            const rawItems = (heavyItemsData as any).items as any[];
            const normalizedItems = rawItems.map(item => ({
              ...item,
              imageUrl: item.image_url || item.imageUrl,
              enhancedDescription: item.enhanced_description || item.enhancedDescription
            }));

            setQuote(prev => prev ? { ...prev, items: normalizedItems } : null);
          }
        } catch (err) {
          console.error('[PublicQuoteView] ❌ Step 3 (Items) failed:', err);
        }
      };

      const fetchVisuals = async () => {
        console.log('[PublicQuoteView] 🖼️ Fetching visuals for quote:', quoteData.id);
        try {
          const { data: visualsData } = await executeWithBypass(
            `visuals-${quoteData.id}`,
            (signal) => (quoteClient.from('proposal_visuals').select('*').eq('quote_id', quoteData.id).maybeSingle() as any).abortSignal(signal),
            () => fetchDataNaked('proposal_visuals', `quote_id=eq.${quoteData.id}&select=*`, true)
          );

          if (visualsData && !isUnmounted.current) {
            console.log('[PublicQuoteView] ✅ Visuals loaded:', visualsData);
            setVisuals(visualsData);
          }
        } catch (visualsError) {
          console.warn('[PublicQuoteView] ⚠️ Could not fetch visuals, continuing...', visualsError);
        }
      };

      const fetchEnrichment = async () => {
        console.log('[PublicQuoteView] 🔄 Fetching fresh items table data for enrichment...');
        console.log('[PublicQuoteView] 🔍 USER ID DIAGNOSTIC:');
        console.log('  - Quote user_id:', quoteData.user_id);
        console.log('  - Authenticated user:', user?.id || 'ANONYMOUS');
        console.log('  - User ID match:', user?.id === quoteData.user_id ? 'YES ✓' : 'NO ✗ (MISMATCH!)');
        console.log('  - Query URL will be:', `items?user_id=eq.${quoteData.user_id}`);

        try {
          const { data: itemsData } = await executeWithBypass(
            `items-${quoteData.user_id}`,
            (signal) => (quoteClient
              .from('items')
              .select('name, image_url, enhanced_description, category')
              .eq('user_id', quoteData.user_id) as any).abortSignal(signal),
            () => fetchDataNaked('items', `user_id=eq.${quoteData.user_id}&select=name,image_url,enhanced_description,category`, false)
          );

          console.log('[PublicQuoteView] 🔍 Enrichment result - itemsData type:', typeof itemsData, 'isArray:', Array.isArray(itemsData), 'value:', itemsData);

          if (!itemsData || !Array.isArray(itemsData)) {
            console.warn('[PublicQuoteView] ⚠️ No items found in database for enrichment. Items table may be empty for user:', quoteData.user_id);
            console.warn('[PublicQuoteView] ℹ️ Item images will use fallback gradients. To fix: Import items via Items page or CSV upload.');
            return; // Skip enrichment gracefully
          }

          const itemsLookup = new Map();
          if (itemsData.length > 0) {
            console.log('[PublicQuoteView] 📦 Enrichment Data Dump:', itemsData.length, 'items found from DB');
            itemsData.forEach((item: any) => {
              console.log('[PublicQuoteView] 🔍 Enrichment Item:', item.name, '-> image_url:', item.image_url);
              if (item.name) {
                itemsLookup.set(item.name.trim().toLowerCase(), {
                  imageUrl: item.image_url,
                  enhancedDescription: item.enhanced_description,
                  originalName: item.name
                });
              }
            });
            console.log('[PublicQuoteView] ✅ Items lookup created:', itemsLookup.size, 'keys');

            // DEBUG: Check match rate
            const currentItemNames = quoteData.items?.map((i: any) => i.name) || [];
            console.log('[PublicQuoteView] 🧐 Matching against Quote Items:', currentItemNames);

            // Re-enrich items in state
            setQuote(prev => {
              if (!prev || !prev.items) return prev;
              const enrichedItems = (prev.items as any[]).map(quoteItem => {
                const lookupKey = (quoteItem.name || '').trim().toLowerCase();
                const freshData = itemsLookup.get(lookupKey);
                // Type-safe snake_case check
                const jsonbImageUrl = (quoteItem as any).image_url || quoteItem.imageUrl;
                const jsonbEnhancedDesc = (quoteItem as any).enhanced_description || quoteItem.enhancedDescription;

                if (freshData) {
                  // console.log(`[PublicQuoteView] MATCH: ${quoteItem.name}`);
                  return {
                    ...quoteItem,
                    imageUrl: freshData.imageUrl || jsonbImageUrl || quoteItem.imageUrl,
                    enhancedDescription: freshData.enhancedDescription || jsonbEnhancedDesc || quoteItem.enhancedDescription
                  };
                } else {
                  console.warn(`[PublicQuoteView] ❌ NO MATCH for item: "${quoteItem.name}" (Key: "${lookupKey}")`);
                }
                return {
                  ...quoteItem,
                  imageUrl: jsonbImageUrl || quoteItem.imageUrl,
                  enhancedDescription: jsonbEnhancedDesc || quoteItem.enhancedDescription
                };
              });
              return { ...prev, items: enrichedItems };
            });

          }
        } catch (itemsError) {
          console.warn('[PublicQuoteView] ⚠️ Could not fetch items table (Bypass failed):', itemsError);
        }
      };

      // Execute all secondary fetches in parallel
      await Promise.allSettled([
        fetchCustomer(),
        fetchHeavyItems(),
        fetchVisuals(),
        fetchEnrichment()
      ]);

      const totalDuration = Date.now() - queryStartTime;
      console.log(`[PublicQuoteView] 🏁 FULL LOAD COMPLETE in ${totalDuration}ms`);



      // Fetch company settings - CRITICAL for proposal display
      try {
        console.log('[PublicQuoteView] 🔍 Fetching company settings for user:', quoteData.user_id);

        const { data: settingsData } = await executeWithBypass(
          `settings-${quoteData.user_id}`,
          (signal) => (quoteClient
            .from('company_settings')
            .select('*')
            .eq('user_id', quoteData.user_id)
            .maybeSingle() as any).abortSignal(signal),
          () => fetchDataNaked('company_settings', `user_id=eq.${quoteData.user_id}&select=*`, true)
        );

        // Normalize potential error from bypass wrapper (wrapped in data structure or null)
        const settingsError = !settingsData ? "No settings data returned" : null;

        if (settingsError) {
          console.error('[PublicQuoteView] ⚠️ Settings fetch error:', settingsError);
          console.log('[PublicQuoteView] Creating fallback settings');
        } else if (settingsData && !isUnmounted.current) {
          // Cast to any to access new columns until types are regenerated
          const s = settingsData as any;
          console.log('[PublicQuoteView] ✅ Settings loaded:', {
            name: s.name,
            hasLogo: !!s.logo
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
            legalTerms: s.legal_terms || '',
            proposalTemplate: (s.proposal_template as 'classic' | 'modern' | 'detailed') || 'classic',
            proposalTheme: (s.proposal_theme as any) || 'modern-corporate',
            showProposalImages: s.show_proposal_images ?? true,
            defaultCoverImage: s.default_cover_image || undefined,
            defaultHeaderImage: s.default_header_image || undefined,
            visualRules: s.visual_rules ? parseVisualRules(s.visual_rules) : [],
          });
        } else if (!isUnmounted.current) {
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
      } catch (err) {
        console.error('[PublicQuoteView] ❌ Step 5 (Settings) failed:', err);
      }

      console.log('[PublicQuoteView] ✅ Data loading complete!');

    } catch (error) {
      const isAbort = error instanceof Error && (error.message === 'Request timeout' || error.name === 'AbortError');
      if (isAbort) {
        console.log('[PublicQuoteView] Request cancelled or timed out (expected on unmount/reset)');
      } else {
        console.error('[PublicQuoteView] ❌ Fatal error:', error);
        toast.error('Failed to load quote');
      }
    } finally {
      if (!isUnmounted.current) {
        setLoading(false);
      }
    }
  };

  const handleAccept = async (signatureData?: string, signerName?: string) => {
    if (!quote || !decodedShareToken) return;

    try {
      const { error } = await quoteClient.functions.invoke('update-quote-status', {
        body: {
          shareToken: decodedShareToken,
          status: 'accepted',
          signatureData,
          signerName
        }
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
      const { error } = await quoteClient.functions.invoke('update-quote-status', {
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


  // Transform to proposal data for the viewer
  const proposal = useMemo(() => {
    if (!quote) return null;
    console.log('[PublicQuoteView] 🔄 Transforming quote to proposal...', {
      id: quote.id,
      itemsCount: quote.items?.length || 0,
      hasVisuals: !!visuals
    });
    return transformQuoteToProposal(quote, settings || undefined, visuals || undefined);
  }, [quote, settings, visuals]);

  // Show loading state
  if ((loading || authLoading) && !quote) {
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
        client={quoteClient}
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

  /* console.log('[PublicQuoteView] 🎨 Rendering ProposalViewer');
  console.log('[PublicQuoteView] Settings:', settings);
  console.log('[PublicQuoteView] Quote:', { id: quote.id, itemCount: quote.items.length }); */

  return (
    <div className="min-h-screen bg-slate-50">
      <ProposalViewer
        quote={quote}
        settings={settings || undefined}
        onAccept={handleAccept}
        onDecline={handleReject}
        onComment={handleComment}
        isReadOnly={isOwner}
        visuals={visuals || undefined}
        proposal={proposal || undefined}
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