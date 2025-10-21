import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, X, FileText, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { getCustomers, getItems, addQuote, updateQuote, getSettings, getQuotes } from '@/lib/db-service';
import { generateQuoteNumber, calculateItemTotal, calculateQuoteTotal } from '@/lib/quote-utils';
import { Customer, Item, Quote, QuoteItem } from '@/types';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import jsPDF from 'jspdf';
import { AIButton } from '@/components/AIButton';
import { useAI } from '@/hooks/useAI';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncManager } from '@/hooks/useSyncManager';
import { sanitizeForAI, sanitizeNumber } from '@/lib/input-sanitization';

export default function NewQuote() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { queueChange } = useSyncManager();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [quoteTitle, setQuoteTitle] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [customItem, setCustomItem] = useState({
    name: '',
    description: '',
    quantity: 1,
    price: '',
  });

  // Helper to strip markdown code blocks from AI responses
  const stripMarkdownCodeBlocks = (text: string): string => {
    return text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  };

  // AI hooks
  const titleAI = useAI('quote_title', {
    onSuccess: (content) => {
      try {
        const cleaned = stripMarkdownCodeBlocks(content);
        const parsed = JSON.parse(cleaned);
        if (parsed.titles && parsed.titles[0]) {
          setQuoteTitle(parsed.titles[0]);
        }
      } catch (error) {
        console.error('Failed to parse AI response:', error);
        toast.error('AI response format error. Please try again.');
      }
    },
  });

  const notesAI = useAI('notes_generator', {
    onSuccess: (content) => {
      const cleaned = stripMarkdownCodeBlocks(content);
      setQuoteNotes(cleaned);
    },
  });

  useEffect(() => {
    loadData();
  }, [id, navigate, user]);

  const loadData = async () => {
    setLoading(true);
    const [customersData, itemsData] = await Promise.all([
      getCustomers(user?.id),
      getItems(user?.id),
    ]);
    
    setCustomers(customersData);
    setItems(itemsData);
    
    // Load quote for editing if id is provided
    if (id) {
      const quotes = await getQuotes(user?.id);
      const quoteToEdit = quotes.find(q => q.id === id);
      if (quoteToEdit) {
        setIsEditMode(true);
        setSelectedCustomerId(quoteToEdit.customerId);
        setQuoteTitle(quoteToEdit.title);
        setQuoteItems(quoteToEdit.items);
        setQuoteNotes(quoteToEdit.notes || '');
      } else {
        navigate('/quotes');
      }
    }
    setLoading(false);
  };

  const categories = ['all', ...new Set(items.map(item => item.category))];
  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || 
      item.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim();
    const matchesSearch = itemSearchTerm === '' ||
      item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(itemSearchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addItemToQuote = (item: Item) => {
    const existingItem = quoteItems.find(qi => qi.itemId === item.id);
    
    if (existingItem) {
      setQuoteItems(quoteItems.map(qi =>
        qi.itemId === item.id
          ? { ...qi, quantity: qi.quantity + 1, total: calculateItemTotal(qi.quantity + 1, qi.price) }
          : qi
      ));
    } else {
      const newQuoteItem: QuoteItem = {
        itemId: item.id,
        name: item.name,
        description: item.description,
        quantity: 1,
        price: item.finalPrice,
        total: item.finalPrice,
        units: item.units,
      };
      setQuoteItems([...quoteItems, newQuoteItem]);
    }
    toast.success(`${item.name} added to quote`);
  };

  const addCustomItemToQuote = () => {
    if (!customItem.name || !customItem.price) {
      toast.error('Name and price are required');
      return;
    }

    const price = parseFloat(customItem.price);
    const newQuoteItem: QuoteItem = {
      itemId: `custom-${Date.now()}`,
      name: customItem.name,
      description: customItem.description,
      quantity: customItem.quantity,
      price,
      total: calculateItemTotal(customItem.quantity, price),
    };

    setQuoteItems([...quoteItems, newQuoteItem]);
    setCustomItem({ name: '', description: '', quantity: 1, price: '' });
    setIsItemDialogOpen(false);
    toast.success('Custom item added to quote');
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity < 0.01) return;
    setQuoteItems(quoteItems.map(item =>
      item.itemId === itemId
        ? { ...item, quantity, total: calculateItemTotal(quantity, item.price) }
        : item
    ));
  };

  const removeItem = (itemId: string) => {
    setQuoteItems(quoteItems.filter(item => item.itemId !== itemId));
  };

  const subtotal = calculateQuoteTotal(quoteItems);
  const tax = 0; // Can be calculated based on business requirements
  const total = subtotal + tax;

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const saveDraft = async () => {
    if (!selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }
    if (!quoteTitle.trim()) {
      toast.error('Please add a quote title');
      return;
    }
    if (quoteItems.length === 0) {
      toast.error('Please add at least one item to the quote');
      return;
    }

    if (isEditMode && id) {
      const quotes = await getQuotes(user?.id);
      const existingQuote = quotes.find(q => q.id === id);
      const updatedQuote: Quote = {
        id,
        quoteNumber: existingQuote?.quoteNumber || generateQuoteNumber(),
        customerId: selectedCustomerId,
        customerName: selectedCustomer?.name || '',
        title: quoteTitle,
        items: quoteItems,
        subtotal,
        tax,
        total,
        status: 'draft',
        notes: quoteNotes,
        createdAt: existingQuote?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await updateQuote(user?.id, id, updatedQuote, queueChange);
      toast.success('Quote updated');
    } else {
      const quote: Quote = {
        id: crypto.randomUUID(),
        quoteNumber: generateQuoteNumber(),
        customerId: selectedCustomerId,
        customerName: selectedCustomer?.name || '',
        title: quoteTitle,
        items: quoteItems,
        subtotal,
        tax,
        total,
        status: 'draft',
        notes: quoteNotes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addQuote(user?.id, quote, queueChange);
      toast.success('Quote saved as draft');
    }
    navigate('/quotes');
  };

  const sendQuote = async () => {
    if (!selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }
    if (!quoteTitle.trim()) {
      toast.error('Please add a quote title');
      return;
    }
    if (quoteItems.length === 0) {
      toast.error('Please add at least one item to the quote');
      return;
    }

    if (isEditMode && id) {
      const quotes = await getQuotes(user?.id);
      const existingQuote = quotes.find(q => q.id === id);
      const updatedQuote: Quote = {
        id,
        quoteNumber: existingQuote?.quoteNumber || generateQuoteNumber(),
        customerId: selectedCustomerId,
        customerName: selectedCustomer?.name || '',
        title: quoteTitle,
        items: quoteItems,
        subtotal,
        tax,
        total,
        status: 'sent',
        notes: quoteNotes,
        sentDate: new Date().toISOString(),
        createdAt: existingQuote?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await updateQuote(user?.id, id, updatedQuote, queueChange);
      await generatePDF(updatedQuote);
      toast.success('Quote updated and sent');
    } else {
      const quote: Quote = {
        id: crypto.randomUUID(),
        quoteNumber: generateQuoteNumber(),
        customerId: selectedCustomerId,
        customerName: selectedCustomer?.name || '',
        title: quoteTitle,
        items: quoteItems,
        subtotal,
        tax,
        total,
        status: 'sent',
        notes: quoteNotes,
        sentDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addQuote(user?.id, quote, queueChange);
      await generatePDF(quote);
      toast.success('Quote sent successfully');
    }
    navigate('/quotes');
  };

  const generatePDF = async (quote: Quote) => {
    const settings = await getSettings(user?.id);
    const doc = new jsPDF();
    let yPos = 20;

    // Company Info
    doc.setFontSize(20);
    doc.text(settings.name || 'Your Company', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    if (settings.address) {
      doc.text(settings.address, 20, yPos);
      yPos += 5;
    }
    if (settings.phone) {
      doc.text(`Phone: ${settings.phone}`, 20, yPos);
      yPos += 5;
    }
    if (settings.email) {
      doc.text(`Email: ${settings.email}`, 20, yPos);
      yPos += 5;
    }

    yPos += 10;
    doc.setFontSize(16);
    doc.text('QUOTE', 20, yPos);
    yPos += 10;

    // Quote Details
    doc.setFontSize(10);
    doc.text(`Quote #: ${quote.quoteNumber}`, 20, yPos);
    doc.text(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`, 120, yPos);
    yPos += 10;

    // Customer Info
    doc.text('Bill To:', 20, yPos);
    yPos += 5;
    doc.text(quote.customerName, 20, yPos);
    yPos += 5;
    if (selectedCustomer?.address) {
      doc.text(selectedCustomer.address, 20, yPos);
      yPos += 5;
    }
    if (selectedCustomer?.email) {
      doc.text(selectedCustomer.email, 20, yPos);
      yPos += 5;
    }

    yPos += 10;
    doc.setFontSize(12);
    doc.text(quote.title, 20, yPos);
    yPos += 10;

    // Items Table
    doc.setFontSize(10);
    doc.text('Item', 20, yPos);
    doc.text('Qty', 100, yPos);
    doc.text('Price', 130, yPos);
    doc.text('Total', 170, yPos);
    yPos += 7;

    quote.items.forEach(item => {
      doc.text(item.name, 20, yPos);
      const qtyText = item.units ? `${item.quantity} ${item.units}` : item.quantity.toString();
      doc.text(qtyText, 100, yPos);
      doc.text(formatCurrency(item.price), 130, yPos);
      doc.text(formatCurrency(item.total), 170, yPos);
      yPos += 5;
    });

    yPos += 5;
    doc.text(`Total: ${formatCurrency(quote.total)}`, 170, yPos);

    if (quote.notes) {
      yPos += 15;
      doc.text('Notes:', 20, yPos);
      yPos += 5;
      doc.text(quote.notes, 20, yPos);
    }

    // Save PDF
    doc.save(`quote-${quote.quoteNumber}.pdf`);
  };

  return (
    <div className="max-w-[1800px] mx-auto space-y-4 pb-20 md:pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {isEditMode ? 'Edit Quote' : 'Create New Quote'}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">Build a professional quote for your customer</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => navigate('/quotes')} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button variant="secondary" onClick={saveDraft} className="w-full sm:w-auto">
            Save Draft
          </Button>
          <Button onClick={sendQuote} className="w-full sm:w-auto">
            Send Quote
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:gap-6 lg:grid-cols-[1fr_380px]">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Quote Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Select Customer *</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Quote Title *</Label>
                <div className="flex gap-2">
                  <Input
                    id="title"
                    value={quoteTitle}
                    onChange={(e) => setQuoteTitle(e.target.value)}
                    placeholder="Website Development Project"
                    className="flex-1"
                  />
                  <AIButton
                    onClick={() => {
                      const customer = customers.find(c => c.id === selectedCustomerId);
                      const sanitizedCustomerName = sanitizeForAI(customer?.name, 100);
                      const sanitizedItems = quoteItems.map(item => sanitizeForAI(item.name, 100));
                      const itemsList = sanitizedItems.join(', ');
                      titleAI.generate(
                        `Generate 3 professional quote titles based on: Customer: ${sanitizedCustomerName}, Items: ${itemsList}`,
                        { customerName: sanitizedCustomerName, items: itemsList }
                      );
                    }}
                    isLoading={titleAI.isLoading}
                    disabled={!selectedCustomerId || quoteItems.length === 0}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notes">Notes</Label>
                  <AIButton
                    onClick={async () => {
                      if (!selectedCustomerId) {
                        toast.error('Please select a customer first');
                        return;
                      }
                      
                      const customer = customers.find(c => c.id === selectedCustomerId);
                      const settings = await getSettings(user?.id);
                      
                      // Sanitize all user inputs before passing to AI
                      const sanitizedCompanyName = sanitizeForAI(settings.name, 100) || 'Your Company';
                      const sanitizedCustomerName = sanitizeForAI(customer?.name, 100);
                      const sanitizedEmail = sanitizeForAI(customer?.email, 100);
                      const sanitizedPhone = sanitizeForAI(customer?.phone, 50) || 'N/A';
                      
                      const contextPrompt = `Generate professional terms and conditions for the following quote:

Company: ${sanitizedCompanyName}
Customer: ${sanitizedCustomerName}
Email: ${sanitizedEmail}
Phone: ${sanitizedPhone}

Quote Details:
- Subtotal: $${sanitizeNumber(subtotal)}
- Tax: $${sanitizeNumber(total - subtotal)}
- Total: $${sanitizeNumber(total)}

Items:
${quoteItems.map((item, idx) => {
  const sanitizedItemName = sanitizeForAI(item.name, 100);
  return `${idx + 1}. ${sanitizedItemName} - Qty: ${item.quantity} @ $${sanitizeNumber(item.price)} each = $${sanitizeNumber(item.quantity * item.price)}`;
}).join('\n')}

Please include:
1. Payment terms (30 days net)
2. Warranty information
3. Liability limitations
4. Quote validity period
5. Any relevant legal disclaimers

Format as clear, professional terms and conditions.`;
                      
                      await notesAI.generate(contextPrompt);
                    }}
                    isLoading={notesAI.isLoading}
                    disabled={!selectedCustomerId || quoteItems.length === 0}
                  >
                    Generate Terms
                  </AIButton>
                </div>
                <Textarea
                  id="notes"
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="Additional information..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quote Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Quote Items</CardTitle>
                <Button onClick={() => setIsItemDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {quoteItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No items added yet. Select items from your catalog or add a custom item.
                </p>
              ) : (
                <div className="space-y-3">
                  {quoteItems.map(item => (
                    <div key={item.itemId} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1 w-full">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm sm:text-base">{item.name}</p>
                            {item.description && (
                              <p className="text-xs sm:text-sm text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="sm:hidden shrink-0 h-8 w-8"
                            onClick={() => removeItem(item.itemId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateItemQuantity(item.itemId, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.itemId, parseFloat(e.target.value) || 1)}
                            className="w-16 sm:w-20 text-center h-8"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateItemQuantity(item.itemId, item.quantity + 1)}
                          >
                            +
                          </Button>
                          {item.units && (
                            <span className="text-xs sm:text-sm text-muted-foreground">{item.units}</span>
                          )}
                        </div>
                        <div className="text-right min-w-[80px]">
                          <p className="font-semibold text-sm sm:text-base">{formatCurrency(item.total)}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} each</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hidden sm:flex shrink-0"
                          onClick={() => removeItem(item.itemId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Item Catalog */}
        <div className="space-y-6 order-1 lg:order-2">
          <Card className="sticky top-6">
            <CardHeader className="space-y-3">
              <CardTitle>Item Catalog</CardTitle>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search items..."
                  value={itemSearchTerm}
                  onChange={(e) => setItemSearchTerm(e.target.value)}
                  className="pr-8"
                />
                {itemSearchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setItemSearchTerm('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {filteredItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {itemSearchTerm ? 'No items match your search' : 'No items in this category'}
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] lg:max-h-[600px] overflow-y-auto">
                  {filteredItems.map(item => (
                    <div
                      key={item.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => addItemToQuote(item)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.units}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {formatCurrency(item.finalPrice)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:sticky lg:top-[calc(100vh-200px)]">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span className="font-medium">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-base sm:text-lg pt-2 border-t">
                <span>Total:</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Custom Item Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Item</DialogTitle>
            <DialogDescription>
              Create a one-time item for this quote
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customName">Item Name *</Label>
              <Input
                id="customName"
                value={customItem.name}
                onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                placeholder="Custom Service"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customDescription">Description</Label>
              <Textarea
                id="customDescription"
                value={customItem.description}
                onChange={(e) => setCustomItem({ ...customItem, description: e.target.value })}
                placeholder="Details about this item..."
                rows={3}
              />
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customQuantity">Quantity</Label>
                <Input
                  id="customQuantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={customItem.quantity}
                  onChange={(e) => setCustomItem({ ...customItem, quantity: parseFloat(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customPrice">Price *</Label>
                <Input
                  id="customPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={customItem.price}
                  onChange={(e) => setCustomItem({ ...customItem, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addCustomItemToQuote}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
