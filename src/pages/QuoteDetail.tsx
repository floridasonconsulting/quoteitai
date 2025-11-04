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

    // Force fresh settings fetch from database, clear cache first
    localStorage.removeItem('quote-it-settings');
    const settings = await getSettings(user?.id);
    const template = settings.proposalTemplate || 'classic';
    
    console.log('[QuoteDetail] Generating PDF with settings:', {
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
    
    try {
      // Generate share link if it doesn't exist
      if (!shareLink) {
        await handleGenerateShareLink();
      }

      // Update quote status to 'sent' and set sentDate
      const updatedQuote = await updateQuote(user?.id, quote.id, {
        status: 'sent',
        sentDate: new Date().toISOString(),
      }, queueChange);
      
      // Update local state
      setQuote(updatedQuote);
      
      toast({
        title: 'Quote marked as sent',
        description: 'The quote status has been updated to sent.',
      });
      
      // Generate email content with personalized greeting
      const greeting = customer.contactFirstName 
        ? `Hello ${customer.contactFirstName},`
        : customer.contactLastName
        ? `Hello Mr./Ms. ${customer.contactLastName},`
        : `Hello,`;
      
      const subject = encodeURIComponent(`Quote #${quote.quoteNumber}: ${quote.title}`);
      const body = encodeURIComponent(
        `${greeting}\n\n` +
        `Please find your quote #${quote.quoteNumber} for ${quote.title}.\n\n` +
        (shareLink ? `View online: ${shareLink}\n\n` : '') +
        `Total: $${quote.total.toFixed(2)}\n\n` +
        `Please review and let me know if you have any questions.\n\n` +
        `Best regards`
      );
      
      // Open email client
      window.location.href = `mailto:${customer.email}?subject=${subject}&body=${body}`;
    } catch (error) {
      console.error('Failed to update quote status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update quote status',
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
    </div>
  );
}
