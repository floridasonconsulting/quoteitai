import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin, Calendar, FileText, Check, X, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Quote, Customer, CompanySettings, QuoteItem } from '@/types';
import { generateClassicPDF, generateModernPDF, generateDetailedPDF } from '@/lib/proposal-templates';

export default function PublicQuoteView() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isMaxAITier, setIsMaxAITier] = useState(false);

  useEffect(() => {
    loadQuote();
  }, [shareToken]);

  // Update browser title and favicon with company branding
  useEffect(() => {
    const originalTitle = document.title;
    const originalFavicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    const originalFaviconHref = originalFavicon?.href;
    
    if (settings?.name) {
      document.title = `${settings.name} - Proposal`;
      
      // Apply custom favicon for Max AI tier users
      if (isMaxAITier && settings.logo) {
        let faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (!faviconLink) {
          faviconLink = document.createElement('link');
          faviconLink.rel = 'icon';
          document.head.appendChild(faviconLink);
        }
        faviconLink.href = settings.logo;
      }
    }

    return () => {
      document.title = originalTitle;
      if (originalFaviconHref && originalFavicon) {
        originalFavicon.href = originalFaviconHref;
      }
    };
  }, [settings, isMaxAITier]);

  const loadQuote = async () => {
    if (!shareToken) return;
    
    setLoading(true);
    try {
      // Fetch quote by share token (public access via RLS policy)
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('share_token', shareToken)
        .single();

      if (quoteError) throw quoteError;

      if (!quoteData) {
        toast.error('Quote not found or link has expired');
        return;
      }

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

      // Check if quote owner is Max AI tier (for white-label branding)
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', quoteData.user_id)
        .single();

      if (roleData && (roleData.role === 'max' || roleData.role === 'admin')) {
        setIsMaxAITier(true);
      }

      // Update viewed_at timestamp
      await supabase
        .from('quotes')
        .update({ viewed_at: new Date().toISOString() })
        .eq('share_token', shareToken);

    } catch (error) {
      console.error('Failed to load quote:', error);
      toast.error('Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: 'accepted' | 'declined') => {
    if (!quote || !shareToken) return;

    setUpdating(true);
    try {
      // Call edge function instead of direct update
      const { data, error } = await supabase.functions.invoke('update-quote-status', {
        body: { shareToken, status: newStatus }
      });

      if (error) throw error;

      setQuote({ ...quote, status: newStatus });
      toast.success(`Quote ${newStatus === 'accepted' ? 'accepted' : 'declined'} successfully!`);
    } catch (error) {
      console.error('Error updating quote status:', error);
      toast.error('Failed to update quote status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!quote || !settings) {
      toast.error('Unable to generate PDF. Missing quote or company data.');
      console.error('PDF generation failed: Missing data', { quote: !!quote, settings: !!settings });
      return;
    }

    const template = settings.proposalTemplate || 'classic';
    
    try {
      console.log('Generating PDF with template:', template);
      
      if (template === 'modern') {
        generateModernPDF(quote, customer, settings);
      } else if (template === 'detailed') {
        generateDetailedPDF(quote, customer, settings);
      } else {
        generateClassicPDF(quote, customer, settings);
      }
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to generate PDF: ${errorMessage}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500';
      case 'declined':
        return 'bg-red-500';
      case 'sent':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Quote Not Found</CardTitle>
            <CardDescription>
              This quote link is invalid or has expired.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {settings?.logo && (
                  <img src={settings.logo} alt="Company Logo" className="h-16 mb-4" />
                )}
                <CardTitle className="text-2xl">Proposal from {settings?.name || 'Quote-it AI'}</CardTitle>
                {settings && (
                  <CardDescription className="mt-2">
                    {settings.address && <div>{settings.address}</div>}
                    {settings.city && settings.state && (
                      <div>{settings.city}, {settings.state} {settings.zip}</div>
                    )}
                    {settings.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{settings.phone}</div>}
                    {settings.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{settings.email}</div>}
                  </CardDescription>
                )}
              </div>
              {(quote.status === 'accepted' || quote.status === 'declined') && (
                <Badge className={getStatusColor(quote.status)}>
                  {quote.status.toUpperCase()}
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Action Buttons */}
        {quote.status === 'sent' && (
          <Card className="mb-6 border-primary">
            <CardHeader>
              <CardTitle className="text-lg">Review Proposal</CardTitle>
              <CardDescription>
                Please review this proposal and let us know your decision.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => handleStatusUpdate('accepted')}
                  disabled={updating}
                  className="flex-1"
                  size="lg"
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Accept Proposal
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('declined')}
                  disabled={updating}
                  variant="destructive"
                  className="flex-1"
                  size="lg"
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Decline Proposal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quote Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{quote.title}</CardTitle>
            <CardDescription>Quote #{quote.quoteNumber}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Customer Information
                </h3>
                <div className="text-sm space-y-1">
                  <div className="font-medium">{quote.customerName}</div>
                  {customer && (
                    <>
                      {customer.email && <div className="text-muted-foreground">{customer.email}</div>}
                      {customer.phone && <div className="text-muted-foreground">{customer.phone}</div>}
                      {customer.address && (
                        <div className="text-muted-foreground">
                          {customer.address}
                          {customer.city && `, ${customer.city}`}
                          {customer.state && `, ${customer.state}`}
                          {customer.zip && ` ${customer.zip}`}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Quote Information
                </h3>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-muted-foreground">Created: </span>
                    {new Date(quote.createdAt).toLocaleDateString()}
                  </div>
                  {quote.sentDate && (
                    <div>
                      <span className="text-muted-foreground">Sent: </span>
                      {new Date(quote.sentDate).toLocaleDateString()}
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-bold text-lg">${quote.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quote.items.map((item, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-semibold">${item.total.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.quantity} {item.units || 'unit'}{item.quantity !== 1 ? 's' : ''} × ${item.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${quote.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>${quote.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${quote.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms & Notes */}
        {(settings?.terms || quote.notes) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings?.terms && (
                <div className="text-sm whitespace-pre-wrap">{settings.terms}</div>
              )}
              {quote.notes && (
                <>
                  {settings?.terms && <Separator />}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Additional Terms & Notes:</h4>
                    <div className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {quote.notes}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Download PDF */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Button onClick={handleDownloadPDF} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download as PDF
            </Button>
          </CardContent>
        </Card>

        {/* Footer Branding - Only show for non-Max AI tier */}
        {!isMaxAITier && (
          <Card className="border-muted">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Powered by <span className="font-semibold">Quote-it AI</span>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
