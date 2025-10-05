import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Mail, Trash2, FileText, Calendar, DollarSign, Edit, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getQuotes, deleteQuote, getSettings, getCustomers } from '@/lib/storage';
import { Quote, Customer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { FollowUpDialog } from '@/components/FollowUpDialog';
import { formatCurrency } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/quotes');
      return;
    }

    const quotes = getQuotes();
    const foundQuote = quotes.find(q => q.id === id);
    
    if (!foundQuote) {
      navigate('/404');
      return;
    }

    const customers = getCustomers();
    const foundCustomer = customers.find(c => c.id === foundQuote.customerId);

    setQuote(foundQuote);
    setCustomer(foundCustomer || null);
    setLoading(false);
  }, [id, navigate]);

  const handleDelete = () => {
    if (!quote || !confirm('Are you sure you want to delete this quote?')) return;
    
    deleteQuote(quote.id);
    toast({
      title: 'Quote deleted',
      description: 'The quote has been successfully deleted.',
    });
    navigate('/quotes');
  };

  const generatePDF = async () => {
    if (!quote) return;

    const settings = getSettings();
    const pdf = new jsPDF();
    const displayOption = settings.logoDisplayOption || 'both';
    
    const MARGIN = 20;
    const LINE_HEIGHT = 5;
    const SECTION_GAP = 8;
    let yPos = MARGIN;
    
    // Header Section - Logo and/or Company Name
    const showLogo = (displayOption === 'logo' || displayOption === 'both') && settings.logo;
    const showName = displayOption === 'name' || displayOption === 'both';
    
    if (showLogo) {
      try {
        pdf.addImage(settings.logo, 'PNG', MARGIN, yPos, 40, 20);
        if (showName) {
          // Logo with name - put name next to logo
          pdf.setFontSize(20);
          pdf.setFont(undefined, 'bold');
          pdf.text(settings.name || 'Your Company', 65, yPos + 10);
          yPos += 25;
        } else {
          // Logo only
          yPos += 25;
        }
      } catch (e) {
        console.error('Error adding logo:', e);
        // Fallback to name if logo fails and name should be shown
        if (showName) {
          pdf.setFontSize(20);
          pdf.setFont(undefined, 'bold');
          pdf.text(settings.name || 'Your Company', MARGIN, yPos);
          yPos += SECTION_GAP;
        }
      }
    } else if (showName) {
      // Name only (no logo or logo not available)
      pdf.setFontSize(20);
      pdf.setFont(undefined, 'bold');
      pdf.text(settings.name || 'Your Company', MARGIN, yPos);
      yPos += SECTION_GAP;
    }
    
    // Company Contact Info
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    if (settings.address) {
      pdf.text(settings.address, MARGIN, yPos);
      yPos += LINE_HEIGHT;
    }
    if (settings.city || settings.state || settings.zip) {
      const cityStateZip = `${settings.city || ''}${settings.city && settings.state ? ', ' : ''}${settings.state || ''} ${settings.zip || ''}`.trim();
      if (cityStateZip) {
        pdf.text(cityStateZip, MARGIN, yPos);
        yPos += LINE_HEIGHT;
      }
    }
    if (settings.phone || settings.email) {
      const contact = [settings.phone, settings.email].filter(Boolean).join(' | ');
      pdf.text(contact, MARGIN, yPos);
      yPos += LINE_HEIGHT;
    }
    if (settings.license) {
      pdf.text(`License: ${settings.license}`, MARGIN, yPos);
      yPos += LINE_HEIGHT;
    }
    if (settings.insurance) {
      pdf.text(`Insurance: ${settings.insurance}`, MARGIN, yPos);
      yPos += LINE_HEIGHT;
    }
    
    // Quote Info (top right) - Reset yPos for right side
    let rightYPos = MARGIN;
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text('PROPOSAL', 150, rightYPos);
    rightYPos += 8;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Quote #: ${quote.quoteNumber}`, 150, rightYPos);
    rightYPos += LINE_HEIGHT + 1;
    pdf.text(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`, 150, rightYPos);
    
    // Move yPos to after header section
    yPos = Math.max(yPos, rightYPos) + SECTION_GAP;
    
    // Separator line
    pdf.line(MARGIN, yPos, 190, yPos);
    yPos += SECTION_GAP + 2;
    
    // Customer Info Section
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Prepared For:', MARGIN, yPos);
    yPos += 7;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text(quote.customerName, MARGIN, yPos);
    yPos += LINE_HEIGHT;
    
    if (customer?.address) {
      pdf.text(customer.address, MARGIN, yPos);
      yPos += LINE_HEIGHT;
    }
    if (customer?.city || customer?.state || customer?.zip) {
      const custCityStateZip = `${customer.city || ''}${customer.city && customer.state ? ', ' : ''}${customer.state || ''} ${customer.zip || ''}`.trim();
      if (custCityStateZip) {
        pdf.text(custCityStateZip, MARGIN, yPos);
        yPos += LINE_HEIGHT;
      }
    }
    if (customer?.phone) {
      pdf.text(customer.phone, MARGIN, yPos);
      yPos += LINE_HEIGHT;
    }
    
    yPos += SECTION_GAP;
    
    // Quote Title
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    const titleLines = pdf.splitTextToSize(quote.title, 170);
    pdf.text(titleLines, MARGIN, yPos);
    yPos += titleLines.length * 6 + SECTION_GAP;
    
    // Items Header
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.setFillColor(240, 240, 240);
    pdf.rect(MARGIN, yPos - 2, 170, 8, 'F');
    pdf.text('Description', MARGIN + 2, yPos + 3);
    yPos += 10;
    
    // Items List
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(9);
    
    quote.items.forEach((item, index) => {
      // Check if we need a new page (leave room for total and terms)
      if (yPos > 240) {
        pdf.addPage();
        yPos = MARGIN;
      }
      
      const itemDescription = item.name + (item.description ? ` - ${item.description}` : '');
      const itemLines = pdf.splitTextToSize(itemDescription, 165);
      
      pdf.text(itemLines, MARGIN + 2, yPos);
      const itemHeight = itemLines.length * LINE_HEIGHT;
      yPos += itemHeight + 4;
    });
    
    // Ensure space for total section
    if (yPos > 250) {
      pdf.addPage();
      yPos = MARGIN;
    }
    
    yPos += 5;
    
    // Total Section
    pdf.line(MARGIN, yPos, 190, yPos);
    yPos += 8;
    
    pdf.setFont(undefined, 'bold');
    pdf.setFontSize(12);
    pdf.text('TOTAL:', 120, yPos);
    pdf.text(formatCurrency(quote.total), 185, yPos, { align: 'right' });
    
    yPos += 12;
    
    // Terms & Conditions
    if (settings.terms) {
      // Check if we need a new page for terms
      if (yPos > 240) {
        pdf.addPage();
        yPos = MARGIN;
      }
      
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(9);
      pdf.text('Terms & Conditions:', MARGIN, yPos);
      yPos += 6;
      
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(8);
      const termsLines = pdf.splitTextToSize(settings.terms, 170);
      pdf.text(termsLines, MARGIN, yPos);
    }
    
    pdf.save(`quote-${quote.quoteNumber}.pdf`);
    
    toast({
      title: 'PDF generated',
      description: 'Quote PDF has been downloaded.',
    });
  };

  const handleEmail = () => {
    if (!quote) return;
    
    if (!customer?.email) {
      toast({
        title: 'Customer email missing',
        description: 'Please add an email address to this customer first.',
        variant: 'destructive',
      });
      return;
    }
    
    const settings = getSettings();
    const subject = encodeURIComponent(`Quote ${quote.quoteNumber}: ${quote.title}`);
    const body = encodeURIComponent(`Please find attached quote ${quote.quoteNumber} for ${quote.title}.\n\nTotal: ${formatCurrency(quote.total)}`);
    const to = encodeURIComponent(customer.email);
    const cc = settings.email ? `&cc=${encodeURIComponent(settings.email)}` : '';
    window.open(`mailto:${to}?subject=${subject}&body=${body}${cc}`, '_blank');
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
    <div className="space-y-6 max-w-4xl mx-auto">
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
        <Button variant="outline" onClick={handleEmail}>
          <Mail className="mr-2 h-4 w-4" />
          Email
        </Button>
        <Button variant="outline" onClick={() => setFollowUpDialogOpen(true)}>
          <Clock className="mr-2 h-4 w-4" />
          Follow Up
        </Button>
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
