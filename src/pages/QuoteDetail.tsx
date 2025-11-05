import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Mail, Trash2, FileText, Calendar, DollarSign, Edit, Clock, Link2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getQuotes, deleteQuote, getSettings, getCustomers, updateQuote } from '@/lib/db-service';
import { Quote, Customer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { FollowUpDialog } from '@/components/FollowUpDialog';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncManager } from '@/hooks/useSyncManager';
import { generateClassicPDF, generateModernPDF, generateDetailedPDF } from '@/lib/proposal-templates';
import { supabase } from '@/integrations/supabase/client';
import { QuoteSummaryAI } from '@/components/QuoteSummaryAI';
import { FollowUpMessageAI } from '@/components/FollowUpMessageAI';
import { SendQuoteDialog, EmailContent } from '@/components/SendQuoteDialog';

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { queueChange } = useSyncManager();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/quotes');
      return;
    }

    loadQuote();
  }, [id, navigate, user]);

  const loadQuote = async () => {
    const quotes = await getQuotes(user?.id);
    const foundQuote = quotes.find(q => q.id === id);
    
    if (!foundQuote) {
      navigate('/404');
      return;
    }

    const customers = await getCustomers(user?.id);
    const foundCustomer = customers.find(c => c.id === foundQuote.customerId);

    setQuote(foundQuote);
    setCustomer(foundCustomer || null);
    
    // Generate share link if token exists
    if (foundQuote.shareToken) {
      const url = `${window.location.origin}/quote/view/${foundQuote.shareToken}`;
      setShareLink(url);
    }
    
    setLoading(false);
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

  const generatePDF = async () => {
    if (!quote) return;

    // Force fresh settings fetch - bypass all caches
    localStorage.removeItem('quote-it-settings');
    
    // Fetch directly from Supabase to bypass service worker cache
    const { data } = await supabase
      .from('company_settings')
      .select('*')
      .eq('user_id', user?.id)
      .maybeSingle();
    
    // Map snake_case to camelCase
    const settings = data ? {
      name: data.name || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      zip: data.zip || '',
      phone: data.phone || '',
      email: data.email || '',
      website: data.website || '',
      license: data.license || '',
      insurance: data.insurance || '',
      logoDisplayOption: (data.logo_display_option || 'both') as 'both' | 'logo' | 'name',
      logo: data.logo,
      terms: data.terms || 'Payment due within 30 days. Thank you for your business!',
      proposalTemplate: (data.proposal_template || 'classic') as 'classic' | 'modern' | 'detailed',
      notifyEmailAccepted: data.notify_email_accepted ?? true,
      notifyEmailDeclined: data.notify_email_declined ?? true,
    } : {
      name: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
      email: '',
      website: '',
      license: '',
      insurance: '',
      logoDisplayOption: 'both' as const,
      logo: null,
      terms: 'Payment due within 30 days. Thank you for your business!',
      proposalTemplate: 'classic' as const,
      notifyEmailAccepted: true,
      notifyEmailDeclined: true,
    };
    
    const template = settings.proposalTemplate || 'classic';
    
    console.log('[QuoteDetail] Generating PDF with fresh settings:', {
      template,
      logoDisplayOption: settings.logoDisplayOption,
      proposalTemplate: settings.proposalTemplate
    });
    
    try {
      switch (template) {
        case 'modern':
          await generateModernPDF(quote, customer, settings);
          break;
        case 'detailed':
          await generateDetailedPDF(quote, customer, settings);
          break;
        case 'classic':
        default:
          await generateClassicPDF(quote, customer, settings);
          break;
      }
      
      toast({
        title: 'PDF generated',
        description: 'Quote PDF has been downloaded.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    }
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
        const url = `${window.location.origin}/quote/view/${token}`;
        setShareLink(url);
        setQuote({ ...quote, shareToken: token, sharedAt: new Date().toISOString() });
      }

      toast({
        title: 'Share link generated!',
        description: 'Copy the link to share with your customer.',
      });
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

  const handleConfirmSend = async (emailContent: EmailContent) => {
    if (!quote || !customer) return;

    try {
      // Generate share link if it doesn't exist and user wants to include it
      let currentShareLink = shareLink;
      if (!currentShareLink && emailContent.includeShareLink) {
        await handleGenerateShareLink();
        // Wait a moment for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        currentShareLink = shareLink;
      }

      // Update quote status and executive summary
      const updatedQuote = await updateQuote(user?.id, quote.id, {
        status: 'sent',
        sentDate: new Date().toISOString(),
        executiveSummary: emailContent.includeSummary ? emailContent.customSummary : quote.executiveSummary,
      }, queueChange);
      
      // Update local state
      setQuote(updatedQuote);

      // Fetch company settings for email
      const { data: settingsData } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      const companyName = settingsData?.name || undefined;
      const companyLogo = settingsData?.logo || undefined;

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
            companyName,
            companyLogo,
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
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
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
    <div className="space-y-6 max-w-4xl mx-auto overflow-x-hidden">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/quotes')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{quote.title}</h2>
          <p className="text-muted-foreground">Quote #{quote.quoteNumber}</p>
        </div>
        <Badge variant="outline" className={getStatusColor(quote.status)}>
          {quote.status}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => navigate(`/quotes/${quote.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button onClick={generatePDF}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
        {!shareLink ? (
          <Button variant="outline" onClick={handleGenerateShareLink}>
            <Link2 className="mr-2 h-4 w-4" />
            Generate Share Link
          </Button>
        ) : (
          <Button variant="outline" onClick={handleCopyShareLink}>
            {copied ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
        )}
        <Button variant="outline" onClick={handleEmail}>
          <Mail className="mr-2 h-4 w-4" />
          Email
        </Button>
        <Button variant="outline" onClick={() => setFollowUpDialogOpen(true)}>
          <Clock className="mr-2 h-4 w-4" />
          Follow Up
        </Button>
        <FollowUpMessageAI quote={quote} customer={customer} />
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      <FollowUpDialog
        open={followUpDialogOpen}
        onOpenChange={setFollowUpDialogOpen}
        quote={quote}
        customer={customer}
      />

      <Card>
        <CardHeader>
          <CardTitle>Quote Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
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
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(quote.createdAt).toLocaleDateString()}
                </p>
              </div>
              {quote.sentDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Sent</p>
                  <p className="font-medium">{new Date(quote.sentDate).toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-bold text-xl text-primary">
                  {formatCurrency(quote.total)}
                </p>
              </div>
            </div>
          </div>
          {quote.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Notes</p>
                <p className="text-sm">{quote.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <QuoteSummaryAI quote={quote} customer={customer} />

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {quote.items.map((item, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <p className="font-medium">{item.name}</p>
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between items-center">
            <p className="text-lg font-bold">Total</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(quote.total)}</p>
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
