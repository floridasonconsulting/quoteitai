import { useEffect, useState } from 'react';
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

export default function PublicQuoteView() {
  const { id: shareToken } = useParams<{ id: string }>();
  const { user } = useAuth();
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
    if (authLoading) {
      console.log('[PublicQuoteView] Waiting for auth to initialize...');
      return;
    }
    
    console.log('[PublicQuoteView] Auth ready, checking session - shareToken:', shareToken, 'user:', user?.id);
    checkSession();
  }, [shareToken, user?.id, authLoading]);

  const checkSession = async () => {
    console.log('[PublicQuoteView] checkSession - user:', user?.id);
    
    try {
      // PRIORITY 1: If user is logged in, check if they own the quote
      if (user?.id) {
        console.log('[PublicQuoteView] User logged in, checking ownership...');
        const ownershipResult = await checkOwnership();
        if (ownershipResult) {
          console.log('[PublicQuoteView] User is owner, bypassing OTP');
          return; // Exit early - owner authentication handled
        }
      }

      // PRIORITY 2: Check for existing session token (for external customers)
      console.log('[PublicQuoteView] Not owner, checking session token...');
      const sessionData = sessionStorage.getItem('proposal_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        
        // Check if session is valid and matches current share token
        if (session.shareToken === shareToken && 
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
    if (!shareToken || !user?.id) {
      console.log('[PublicQuoteView] Missing shareToken or user.id');
      setLoading(false);
      return false;
    }

    try {
      console.log('[PublicQuoteView] Fetching quote with shareToken:', shareToken);
      
      // Fetch quote to check ownership
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('user_id, id')
        .eq('share_token', shareToken)
        .maybeSingle();

      if (quoteError) {
        console.error('[PublicQuoteView] Error checking ownership:', quoteError);
        setLoading(false);
        return false;
      }

      if (!quoteData) {
        console.error('[PublicQuoteView] Quote not found for shareToken:', shareToken);
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

  // Load quote data after authentication
  const loadQuote = async () => {
    if (!shareToken) {
      console.error('[PublicQuoteView] No shareToken provided in URL');
      setLoading(false);
      return;
    }
    
    console.log('[PublicQuoteView] Loading quote with shareToken:', shareToken);
    setLoading(true);
    try {
      // Fetch quote by share token
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('share_token', shareToken)
        .maybeSingle();

      if (quoteError) {
        console.error('[PublicQuoteView] Supabase error:', quoteError);
        throw quoteError;
      }

      if (!quoteData) {
        console.error('[PublicQuoteView] No quote found with shareToken:', shareToken);
        toast.error('Quote not found or link has expired');
        return;
      }

      // Check if quote has expired
      if (quoteData.expires_at && new Date(quoteData.expires_at) < new Date()) {
        setExpired(true);
        return;
      }
      
      console.log('[PublicQuoteView] Quote loaded successfully:', quoteData.id);

      // Convert database format to app format
      const formattedQuote: Quote = {
        id: quoteData.id,
        quoteNumber: quoteData.quote_number,
        customerId: quoteData.customer_id,
        customerName: quoteData.customer_name,
        title: quoteData.title,
        items: (quoteData.items as unknown as QuoteItem[]) || [],
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
      };

      setQuote(formattedQuote);

      // Fetch customer data
      if (quoteData.customer_id) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('*')
          .eq('id', quoteData.customer_id)
          .single();

        if (customerData) {
          setCustomer({
            id: customerData.id,
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone,
            address: customerData.address,
            city: customerData.city,
            state: customerData.state,
            zip: customerData.zip,
            createdAt: customerData.created_at,
          });
        }
      }

      // Fetch company settings
      const { data: settingsData } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', quoteData.user_id)
        .single();

      if (settingsData) {
        setSettings({
          name: settingsData.name,
          address: settingsData.address,
          city: settingsData.city,
          state: settingsData.state,
          zip: settingsData.zip,
          phone: settingsData.phone,
          email: settingsData.email,
          website: settingsData.website,
          logo: settingsData.logo,
          logoDisplayOption: (settingsData.logo_display_option as 'logo' | 'name' | 'both') || 'both',
          license: settingsData.license,
          insurance: settingsData.insurance,
          terms: settingsData.terms,
          proposalTemplate: (settingsData.proposal_template as 'classic' | 'modern' | 'detailed') || 'classic',
        });
      }

      // Check if quote owner is Max AI tier
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', quoteData.user_id)
        .single();

      if (roleData && (roleData.role === 'max' || roleData.role === 'admin')) {
        setIsMaxAITier(true);
      }

      // Only update viewed_at if not the owner
      if (!isOwner) {
        await supabase
          .from('quotes')
          .update({ viewed_at: new Date().toISOString() })
          .eq('share_token', shareToken);
      }

    } catch (error) {
      console.error('[PublicQuoteView] Failed to load quote:', error);
      toast.error('Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (signature: string) => {
    if (!quote || !shareToken) return;

    try {
      const { error } = await supabase.functions.invoke('update-quote-status', {
        body: { shareToken, status: 'accepted' }
      });

      if (error) throw error;

      setQuote({ ...quote, status: 'accepted' });
      toast.success('Quote accepted successfully!');
    } catch (error) {
      console.error('[PublicQuoteView] Error accepting quote:', error);
      toast.error('Failed to accept quote');
    }
  };

  const handleAccept = async () => {
    if (!quote || !shareToken) return;

    try {
      const { error } = await supabase.functions.invoke('update-quote-status', {
        body: { shareToken, status: 'accepted' }
      });

      if (error) throw error;

      setQuote({ ...quote, status: 'accepted' });
    } catch (error) {
      console.error('[PublicQuoteView] Error accepting quote:', error);
      throw error;
    }
  };

  const handleReject = async (reason?: string) => {
    if (!quote || !shareToken) return;

    try {
      const { error } = await supabase.functions.invoke('update-quote-status', {
        body: { 
          shareToken, 
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

  const handleConfirmPayment = async (
    paymentType: 'full' | 'deposit',
    depositPercentage?: number
  ) => {
    if (!quote) return;

    try {
      const amount = paymentType === 'full' 
        ? quote.total 
        : Math.round(quote.total * ((depositPercentage || 30) / 100));

      const { url } = await createPaymentIntent({
        quoteId: quote.id,
        amount,
        currency: 'usd',
        paymentType,
        depositPercentage,
      });

      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('[PublicQuoteView] Payment error:', error);
      toast.error('Payment initialization failed. Please try again.');
    }
  };

  // Show loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
  if (!authenticated && shareToken && !isOwner) {
    console.log('[PublicQuoteView] Rendering OTP wall');
    return (
      <OTPSecurityWall
        shareToken={shareToken}
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

  // Transform legacy data to new Proposal format
  const proposalData = transformQuoteToProposal(quote, customer || undefined, settings || undefined);

  console.log('[PublicQuoteView] Rendering viewer - isOwner:', isOwner, 'status:', quote.status);

  return (
    <div className="min-h-screen bg-slate-50">
      <ProposalViewer 
        proposal={proposalData} 
        onSign={handleSign}
        readOnly={isOwner || quote.status === 'accepted' || quote.status === 'declined'}
        actionBar={isOwner ? undefined : {
          quoteId: quote.id,
          total: quote.total,
          status: quote.status,
          userEmail,
          userName: customer?.contactFirstName 
            ? `${customer.contactFirstName}${customer.contactLastName ? ' ' + customer.contactLastName : ''}`
            : undefined,
          onAccept: handleAccept,
          onReject: handleReject
        }}
      />

      {/* Hidden Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        quoteTotal={quote.total}
        onConfirmPayment={handleConfirmPayment}
      />
    </div>
  );
}