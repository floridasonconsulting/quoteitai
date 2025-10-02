import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Mail, Trash2, FileText, Calendar, DollarSign, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getQuotes, deleteQuote, getSettings } from '@/lib/storage';
import { Quote } from '@/types';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

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

    setQuote(foundQuote);
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
    
    let yPos = 20;
    
    // Logo
    if (settings.logo) {
      try {
        pdf.addImage(settings.logo, 'PNG', 20, yPos, 40, 20);
        yPos += 25;
      } catch (e) {
        console.error('Error adding logo:', e);
      }
    }
    
    // Company Header
    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.text(settings.name || 'Your Company', 20, yPos);
    yPos += 6;
    
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    if (settings.address) {
      pdf.text(settings.address, 20, yPos);
      yPos += 4;
    }
    if (settings.city || settings.state || settings.zip) {
      pdf.text(`${settings.city || ''}, ${settings.state || ''} ${settings.zip || ''}`.trim(), 20, yPos);
      yPos += 4;
    }
    if (settings.phone || settings.email) {
      pdf.text(`${settings.phone || ''} | ${settings.email || ''}`, 20, yPos);
      yPos += 4;
    }
    if (settings.license) {
      pdf.text(`License: ${settings.license}`, 20, yPos);
      yPos += 4;
    }
    if (settings.insurance) {
      pdf.text(`Insurance: ${settings.insurance}`, 20, yPos);
    }
    
    // Quote Info (top right)
    yPos = 20;
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text('PROPOSAL', 150, yPos);
    yPos += 8;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Quote #: ${quote.quoteNumber}`, 150, yPos);
    yPos += 5;
    pdf.text(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`, 150, yPos);
    
    yPos = 60;
    pdf.line(20, yPos, 190, yPos);
    yPos += 10;
    
    // Customer Info
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Prepared For:', 20, yPos);
    yPos += 7;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text(quote.customerName, 20, yPos);
    yPos += 15;
    
    // Quote Title
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text(quote.title, 20, yPos);
    yPos += 10;
    
    // Items Table Header
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.setFillColor(240, 240, 240);
    pdf.rect(20, yPos, 170, 7, 'F');
    pdf.text('Description', 22, yPos + 5);
    pdf.text('Quantity', 120, yPos + 5);
    pdf.text('Total', 170, yPos + 5);
    yPos += 10;
    
    // Items
    pdf.setFont(undefined, 'normal');
    quote.items.forEach(item => {
      if (yPos > 270) {
        pdf.addPage();
        yPos = 20;
      }
      
      const itemText = pdf.splitTextToSize(item.name + (item.description ? ` - ${item.description}` : ''), 95);
      pdf.text(itemText, 22, yPos);
      
      const textHeight = itemText.length * 5;
      pdf.text(`${item.quantity} ${item.units || 'Each'}`, 120, yPos);
      pdf.text(`$${(item.quantity * item.price).toFixed(2)}`, 170, yPos);
      
      yPos += Math.max(textHeight, 6) + 2;
    });
    
    // Total
    pdf.line(20, yPos + 2, 190, yPos + 2);
    yPos += 10;
    pdf.setFont(undefined, 'bold');
    pdf.setFontSize(12);
    pdf.text('TOTAL:', 145, yPos);
    pdf.text(`$${quote.total.toFixed(2)}`, 170, yPos);
    
    // Terms
    if (settings.terms) {
      yPos += 15;
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(9);
      pdf.text('Terms & Conditions:', 20, yPos);
      const terms = pdf.splitTextToSize(settings.terms, 170);
      pdf.text(terms, 20, yPos + 5);
    }
    
    pdf.save(`quote-${quote.quoteNumber}.pdf`);
    
    toast({
      title: 'PDF generated',
      description: 'Quote PDF has been downloaded.',
    });
  };

  const handleEmail = () => {
    if (!quote) return;
    const settings = getSettings();
    const subject = encodeURIComponent(`Quote ${quote.quoteNumber}: ${quote.title}`);
    const body = encodeURIComponent(`Please find attached quote ${quote.quoteNumber} for ${quote.title}.\n\nTotal: $${quote.total.toFixed(2)}`);
    const cc = settings.email ? `&cc=${encodeURIComponent(settings.email)}` : '';
    window.open(`mailto:?subject=${subject}&body=${body}${cc}`, '_blank');
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
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quote Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{quote.customerName}</p>
            </div>
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
              <p className="font-bold text-xl text-primary flex items-center gap-1">
                <DollarSign className="h-5 w-5" />
                {quote.total.toFixed(2)}
              </p>
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
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.quantity} {item.units || 'Each'} × ${item.price.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">
                    ${(item.quantity * item.price).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between items-center">
            <p className="text-lg font-bold">Total</p>
            <p className="text-2xl font-bold text-primary">${quote.total.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
