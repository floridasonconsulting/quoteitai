import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Trash2, Calendar, Edit, Clock, Link2, Copy, Check, Palette, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getQuotes, deleteQuote, getSettings, getCustomers, updateQuote } from '@/lib/db-service';
import { Quote, Customer, CompanySettings } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { FollowUpDialog } from '@/components/FollowUpDialog';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncManager } from '@/hooks/useSyncManager';
import { supabase } from '@/integrations/supabase/client';
import { QuoteSummaryAI } from '@/components/QuoteSummaryAI';
import { FollowUpMessageAI } from '@/components/FollowUpMessageAI';
import { SendQuoteDialog, EmailContent } from '@/components/SendQuoteDialog';
import { rateLimiter } from '@/lib/rate-limiter';
import { transformQuoteToProposal } from '@/lib/proposal-transformation';

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { queueChange } = useSyncManager();
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) {
      navigate('/quotes');
      return;
    }

    loadData();
  }, [id, navigate, user]);

  // Focus management for accessibility
  useEffect(() => {
    if (!loading && mainContentRef.current) {
      mainContentRef.current.focus();
    }
  }, [loading]);

  const loadData = async () => {
    try {
      const [quotes, customers, loadedSettings] = await Promise.all([
        getQuotes(user?.id),
        getCustomers(user?.id),
        getSettings(user?.id)
      ]);

      const foundQuote = quotes.find(q => q.id === id);
      
      if (!foundQuote) {
        navigate('/404');
        return;
      }

      const foundCustomer = customers.find(c => c.id === foundQuote.customerId);

      setQuote(foundQuote);
      setCustomer(foundCustomer || null);
      setSettings(loadedSettings);
      
      // Generate share link if token exists
      if (foundQuote.shareToken) {
        const url = `${window.location.origin}/quotes/public/${foundQuote.shareToken}`;
        setShareLink(url);
      }
    } catch (error) {
      console.error("Failed to load quote data:", error);
      toast({
        title: "Error",
        description: "Failed to load quote details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!quote || !confirm('Are you sure you want to delete this quote?')) return;
    
    await deleteQuote(user?.id, quote.id, queueChange);
    toast({
      title: 'Quote deleted',
      description: 'The quote has been successfully deleted.',
    });
    navigate('/quotes');
  };

  const handleGenerateShareLink = async () => {
    if (!quote || !user?.id) return;

    try {
      // If no share token exists, generate one
      if (!quote.shareToken) {
        const { data, error } = await supabase
          .from('quotes')
          .update({ 
            shared_at: new Date().toISOString(),
          })
          .eq('id', quote.id)
          .select('share_token')
          .single();

        if (error) throw error;

        const token = data.share_token;
        const url = `${window.location.origin}/quotes/public/${token}`;
        setShareLink(url);
        setQuote({ ...quote, shareToken: token, sharedAt: new Date().toISOString() });
      }

      toast({
        title: 'Share link generated!',
        description: 'Copy the link to share with your customer.',
      });
      return shareLink; // Return for chaining
    } catch (error) {
      console.error('Failed to generate share link:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate share link',
        variant: 'destructive',
      });
    }
  };

  const handleCopyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Share link copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEmail = async () => {
    if (!quote) return;
    
    if (!customer?.email) {
      toast({
        title: 'Customer email missing',
        description: 'Please add an email address to this customer first.',
        variant: 'destructive',
      });
      return;
    }
    
    // Open send dialog
    setSendDialogOpen(true);
  };

  const handleEditContent = () => {
    if (!quote) return;
    navigate('/quotes/new', { 
      state: { 
        editQuote: quote,
        editMode: true 
      },
      replace: false 
    });
  };

  const handleCustomizeDesign = () => {
    if (!quote) return;
    const proposalData = transformQuoteToProposal(quote, customer || undefined, settings || undefined);
    navigate('/proposal-editor', { 
      state: { proposalData } 
    });
  };

  const handlePreview = async () => {
    if (!quote) return;
    
    // Check if share token exists
    let token = quote.shareToken;
    
    // If no share token, generate one
    if (!token) {
      try {
        const { data, error } = await supabase
          .from('quotes')
          .update({ 
            shared_at: new Date().toISOString(),
          })
          .eq('id', quote.id)
          .select('share_token')
          .single();

        if (error) throw error;
        token = data.share_token;
        
        // Update local state
        const url = `${window.location.origin}/quotes/public/${token}`;
        setShareLink(url);
        setQuote({ ...quote, shareToken: token, sharedAt: new Date().toISOString() });
      } catch (error) {
        console.error('Failed to generate preview link:', error);
        toast({
          title: 'Error',
          description: 'Failed to generate preview link',
          variant: 'destructive',
        });
        return;
      }
    }
    
    // Store owner bypass flag in sessionStorage
    sessionStorage.setItem('storeOwnerBypass', 'true');
    
    // Open preview in new tab
    const previewUrl = `${window.location.origin}/quotes/public/${token}`;
    window.open(previewUrl, '_blank');
  };

  const handleConfirmSend = async (emailContent: EmailContent) => {
    if (!quote || !customer || !user) return;

    // Rate limiting check - use the pre-configured 'ai-follow-up' limit
    const { allowed, retryAfter } = rateLimiter.isAllowed('ai-follow-up');
    if (!allowed) {
      toast({
        title: 'Rate Limit Reached',
        description: `Please wait ${retryAfter} seconds before sending another email.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      // Generate share link if it doesn't exist and user wants to include it
      let currentShareLink = shareLink;
      if (!currentShareLink && emailContent.includeShareLink) {
        await handleGenerateShareLink();
        // Wait a moment for state to update (local) or use the token we just got?
        // Since we re-fetch/update state in handleGenerate, shareLink state might lag slightly in this closure
        // Ideally handleGenerateShareLink returns the URL.
        if (quote.shareToken) {
             currentShareLink = `${window.location.origin}/quotes/public/${quote.shareToken}`;
        }
      }

      // Update quote status and executive summary
      const updatedQuote = await updateQuote(user?.id, quote.id, {
        status: 'sent',
        sentDate: new Date().toISOString(),
        executiveSummary: emailContent.includeSummary ? emailContent.customSummary : quote.executiveSummary,
      }, queueChange);
      
      // Update local state
      setQuote(updatedQuote);

      // Try to send via edge function
      try {
        const { data, error } = await supabase.functions.invoke('send-quote-email', {
          body: {
            customerEmail: customer.email,
            customerName: customer.name,
            subject: emailContent.subject,
            greeting: emailContent.greeting,
            bodyText: emailContent.bodyText,
            closingText: emailContent.closingText,
            includeSummary: emailContent.includeSummary,
            executiveSummary: emailContent.customSummary,
            includeShareLink: emailContent.includeShareLink,
            shareLink: currentShareLink,
            quoteNumber: updatedQuote.quoteNumber,
            quoteTitle: updatedQuote.title,
            quoteTotal: updatedQuote.total,
            companyName: settings?.name,
            companyLogo: settings?.logo,
          },
        });

        if (error) throw error;

        if (data?.testMode) {
          toast({
            title: 'Email sent (Test Mode)',
            description: `Email redirected to ${data.actualRecipient} because domain is not verified. Verify at resend.com/domains`,
            duration: 8000,
          });
        } else {
          toast({
            title: 'Email sent successfully',
            description: `Quote sent to ${customer.email}`,
          });
        }
      } catch (emailError) {
        console.error('Failed to send email via edge function:', emailError);
        
        // Fallback to mailto
        const summarySection = emailContent.includeSummary && emailContent.customSummary 
          ? `\n\nExecutive Summary:\n${emailContent.customSummary}\n`
          : '';
        
        const subject = encodeURIComponent(emailContent.subject);
        const body = encodeURIComponent(
          `${emailContent.greeting}\n\n` +
          emailContent.bodyText +
          summarySection +
          `\n\n` +
          (emailContent.includeShareLink && currentShareLink ? `View online: ${currentShareLink}\n\n` : '') +
          emailContent.closingText
        );
        
        window.location.href = `mailto:${customer.email}?subject=${subject}&body=${body}`;
        
        toast({
          title: 'Opening email client',
          description: 'Email service unavailable. Opening your default email client instead.',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Failed to process email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send email. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center min-h-[60vh]" 
        role="status" 
        aria-live="polite"
      >
        <p className="text-muted-foreground">Loading quote details...</p>
      </div>
    );
  }

  if (!quote) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-success/10 text-success border-success/20';
      case 'sent': return 'bg-primary/10 text-primary border-primary/20';
      case 'draft': return 'bg-muted text-muted-foreground border-border';
      case 'declined': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div 
      className="space-y-6 max-w-4xl mx-auto overflow-x-hidden" 
      ref={mainContentRef}
      tabIndex={-1}
      aria-label="Quote details page"
    >
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/quotes')}
          aria-label="Go back to quotes list"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{quote.title}</h1>
          <p className="text-muted-foreground" aria-label="Quote number">
            Quote #{quote.quoteNumber}
          </p>
        </div>
        <Badge 
          variant="outline" 
          className={getStatusColor(quote.status)}
          aria-label={`Quote status: ${quote.status}`}
        >
          {quote.status}
        </Badge>
      </div>

      {/* Primary Actions Toolbar */}
      <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Quote actions">
        <Button 
          onClick={handleEditContent}
          aria-label="Edit quote content"
        >
          <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
          Edit Content
        </Button>

        <Button 
          variant="outline"
          onClick={handlePreview}
          aria-label="Preview and Print"
        >
          <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
          Preview / Print
        </Button>

        {!shareLink ? (
          <Button 
            variant="outline" 
            onClick={handleGenerateShareLink}
            aria-label="Generate shareable link for this quote"
          >
            <Link2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Generate Share Link
          </Button>
        ) : (
          <Button 
            variant="outline" 
            onClick={handleCopyShareLink}
            aria-label={copied ? "Share link copied to clipboard" : "Copy share link to clipboard"}
            aria-live="polite"
          >
            {copied ? (
              <Check className="mr-2 h-4 w-4" aria-hidden="true" />
            ) : (
              <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
        )}
        <Button 
          variant="outline" 
          onClick={handleEmail}
          aria-label="Send quote via email"
        >
          <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
          Email
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setFollowUpDialogOpen(true)}
          aria-label="Schedule follow-up reminder"
        >
          <Clock className="mr-2 h-4 w-4" aria-hidden="true" />
          Follow Up
        </Button>
        <FollowUpMessageAI quote={quote} customer={customer} />
        <Button 
          variant="destructive" 
          onClick={handleDelete}
          aria-label="Delete this quote permanently"
        >
          <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
          Delete
        </Button>
      </div>

      <FollowUpDialog
        open={followUpDialogOpen}
        onOpenChange={setFollowUpDialogOpen}
        quote={quote}
        customer={customer}
      />

      <Card aria-labelledby="quote-info-title">
        <CardHeader>
          <CardTitle id="quote-info-title">Quote Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div role="region" aria-label="Customer information">
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{quote.customerName}</p>
              {customer && (customer.contactFirstName || customer.contactLastName) && (
                <p className="text-sm text-muted-foreground">
                  Contact: {customer.contactFirstName} {customer.contactLastName}
                </p>
              )}
              {customer?.address && <p className="text-sm">{customer.address}</p>}
              {(customer?.city || customer?.state || customer?.zip) && (
                <p className="text-sm">{`${customer.city || ''}, ${customer.state || ''} ${customer.zip || ''}`.trim()}</p>
              )}
              {customer?.phone && <p className="text-sm">{customer.phone}</p>}
            </div>
            <div className="space-y-4" role="region" aria-label="Quote details">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <time dateTime={quote.createdAt}>
                    {new Date(quote.createdAt).toLocaleDateString()}
                  </time>
                </p>
              </div>
              {quote.sentDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Sent</p>
                  <p className="font-medium">
                    <time dateTime={quote.sentDate}>
                      {new Date(quote.sentDate).toLocaleDateString()}
                    </time>
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p 
                  className="font-bold text-xl text-primary"
                  aria-label={`Quote total: ${formatCurrency(quote.total)}`}
                >
                  {formatCurrency(quote.total)}
                </p>
              </div>
            </div>
          </div>
          {quote.notes && (
            <>
              <Separator />
              <div role="region" aria-label="Quote notes">
                <p className="text-sm text-muted-foreground mb-2">Notes</p>
                <p className="text-sm">{quote.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <QuoteSummaryAI quote={quote} customer={customer} />

      <Card aria-labelledby="items-title">
        <CardHeader>
          <CardTitle id="items-title">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3" role="list" aria-label="Quote line items">
            {quote.items.map((item, index) => (
              <div 
                key={index} 
                className="p-3 border rounded-lg"
                role="listitem"
                aria-label={`Item ${index + 1}: ${item.name}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">
                      {item.quantity} x {formatCurrency(item.price)}
                    </p>
                    <p className="font-bold text-sm">
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between items-center" role="region" aria-label="Quote total">
            <p className="text-lg font-bold">Total</p>
            <p 
              className="text-2xl font-bold text-primary"
              aria-label={`Total amount: ${formatCurrency(quote.total)}`}
            >
              {formatCurrency(quote.total)}
            </p>
          </div>
        </CardContent>
      </Card>

      <SendQuoteDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        quote={quote}
        customer={customer}
        onConfirm={handleConfirmSend}
      />
    </div>
  );
}
