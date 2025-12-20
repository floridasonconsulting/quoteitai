
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getCustomers, getItems, addQuote, updateQuote, getSettings, getQuotes } from '@/lib/db-service';
import { generateQuoteNumber, calculateItemTotal, calculateQuoteTotal } from '@/lib/quote-utils';
import { Customer, Item, Quote, QuoteItem } from '@/types';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { useAI } from '@/hooks/useAI';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncManager } from '@/hooks/useSyncManager';
import { QuoteSummaryAI } from '@/components/QuoteSummaryAI';
import { SendQuoteDialog, EmailContent } from '@/components/SendQuoteDialog';
import { FullQuoteGenerationAI } from '@/components/FullQuoteGenerationAI';
import { formatCurrency } from '@/lib/utils';
import { QuoteBasicInfo } from '@/components/quote-form/QuoteBasicInfo';
import { QuoteItemsSection } from '@/components/quote-form/QuoteItemsSection';
import { ItemCatalogSidebar } from '@/components/quote-form/ItemCatalogSidebar';
import { QuoteSummarySidebar } from '@/components/quote-form/QuoteSummarySidebar';
import { CustomItemDialog } from '@/components/quote-form/CustomItemDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SOWGeneratorAI } from '@/components/SOWGeneratorAI';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FollowUpSettings } from '@/components/quote-form/FollowUpSettings';
import { FollowUpSchedule } from '@/types';
import { getFollowUpSchedule, saveFollowUpSchedule } from '@/lib/services/follow-up-service';

interface LocationState {
  editQuote?: Quote;
}

export default function NewQuote() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user, isAdmin, isMaxAITier, organizationId } = useAuth();
  const { queueChange } = useSyncManager();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editQuoteId, setEditQuoteId] = useState<string | undefined>(id); // CRITICAL: Track the quote ID being edited
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [quoteTitle, setQuoteTitle] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [scopeOfWork, setScopeOfWork] = useState(''); // NEW: SOW State
  const [followUpSchedule, setFollowUpSchedule] = useState<Partial<FollowUpSchedule>>({
    status: 'paused',
    scheduleType: 'one_time',
    maxFollowUps: 3
  });
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [showPricing, setShowPricing] = useState(true);
  const [pricingMode, setPricingMode] = useState<'itemized' | 'category_total' | 'grand_total'>('category_total');
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);

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

  const handleQuoteGenerated = (data: {
    title: string;
    notes: string;
    summary: string;
    suggestedItems: QuoteItem[];
    customerId?: string;
  }) => {
    setQuoteTitle(data.title);
    setQuoteNotes(data.notes);
    setExecutiveSummary(data.summary);
    setQuoteItems(data.suggestedItems);
    if (data.customerId) {
      setSelectedCustomerId(data.customerId);
      toast.info('Customer matched automatically!');
    }
    toast.success('Quote generated! Review and adjust as needed.');
  };

  useEffect(() => {
    loadData();
  }, [id, location.state, navigate, user]);

  const loadData = async () => {
    setLoading(true);
    const [customersData, itemsData, settingsData] = await Promise.all([
      getCustomers(user?.id, organizationId, isAdmin || isMaxAITier),
      getItems(user?.id, organizationId),
      getSettings(user?.id, organizationId),
    ]);

    setCustomers(customersData);
    setItems(itemsData);
    setSettings(settingsData);

    // Check if we're editing via navigation state (from QuoteDetail)
    const state = location.state as LocationState | null;
    const editQuote = state?.editQuote;

    if (editQuote) {
      console.log('[NewQuote] Loading quote from navigation state:', editQuote);
      setIsEditMode(true);
      setEditQuoteId(editQuote.id); // CRITICAL: Store the quote ID
      setSelectedCustomerId(editQuote.customerId);
      setQuoteTitle(editQuote.title);
      setQuoteItems(editQuote.items);
      setQuoteNotes(editQuote.notes || '');
      setExecutiveSummary(editQuote.executiveSummary || '');
      setScopeOfWork(editQuote.scopeOfWork || ''); // Load SOW
      setShowPricing(editQuote.showPricing !== false);
      setPricingMode(editQuote.pricingMode || 'category_total');
    }
    // Fallback: Load quote for editing if id is provided (old method)
    else if (id) {
      const quotes = await getQuotes(user?.id, organizationId, isAdmin || isMaxAITier);
      const quoteToEdit = quotes.find(q => q.id === id);
      if (quoteToEdit) {
        console.log('[NewQuote] Loading quote from URL params:', quoteToEdit);
        setIsEditMode(true);
        setEditQuoteId(quoteToEdit.id); // CRITICAL: Store the quote ID
        setSelectedCustomerId(quoteToEdit.customerId);
        setQuoteTitle(quoteToEdit.title);
        setQuoteItems(quoteToEdit.items);
        setQuoteNotes(quoteToEdit.notes || '');
        setExecutiveSummary(quoteToEdit.executiveSummary || '');
        setScopeOfWork(quoteToEdit.scopeOfWork || ''); // Load SOW
        setShowPricing(quoteToEdit.showPricing !== false);
        setPricingMode(quoteToEdit.pricingMode || 'category_total');

        // Load Follow-up Schedule
        try {
          const schedule = await getFollowUpSchedule(quoteToEdit.id);
          if (schedule) {
            setFollowUpSchedule(schedule);
          } else {
            setFollowUpSchedule({
              status: 'paused',
              scheduleType: 'one_time',
              maxFollowUps: 3
            });
          }
        } catch (err) {
          console.error('Failed to load follow-up schedule', err);
        }
      } else {
        toast.error('Quote not found');
        navigate('/quotes');
      }
    }
    setLoading(false);
  };

  const addItemToQuote = (item: Item) => {
    const existingItem = quoteItems.find(qi => qi.itemId === item.id);

    if (existingItem) {
      // If item already exists, add the minimum quantity to current quantity
      const newQuantity = existingItem.quantity + (item.minQuantity || 1);
      setQuoteItems(quoteItems.map(qi =>
        qi.itemId === item.id
          ? { ...qi, quantity: newQuantity, total: calculateItemTotal(newQuantity, qi.price) }
          : qi
      ));
    } else {
      // NEW: Use item.minQuantity as the default quantity
      const defaultQuantity = item.minQuantity || 1;
      const newQuoteItem: QuoteItem = {
        itemId: item.id,
        name: item.name,
        description: item.description,
        enhancedDescription: item.enhancedDescription, // NEW: Preserve enhanced description
        category: item.category, // NEW: Copy category from item
        quantity: defaultQuantity,
        price: item.finalPrice,
        total: calculateItemTotal(defaultQuantity, item.finalPrice),
        units: item.units,
        imageUrl: item.imageUrl, // NEW: Copy imageUrl from item
      };
      setQuoteItems([...quoteItems, newQuoteItem]);
    }
    toast.success(`${item.name} added to quote`);
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

    if (isEditMode && editQuoteId) { // CRITICAL: Use editQuoteId instead of id
      const quotes = await getQuotes(user?.id, organizationId, isAdmin || isMaxAITier);
      const existingQuote = quotes.find(q => q.id === editQuoteId);
      const updatedQuote: Quote = {
        id: editQuoteId, // CRITICAL: Use stored editQuoteId
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
        executiveSummary,
        showPricing,
        pricingMode, // Save pricing mode
        scopeOfWork: scopeOfWork, // Save current SOW
        createdAt: existingQuote?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user?.id || '',
      };

      await updateQuote(user?.id, organizationId, editQuoteId, updatedQuote, queueChange);

      // Save Follow-up Schedule
      if (followUpSchedule.status === 'active' || followUpSchedule.id) {
        await saveFollowUpSchedule({
          ...followUpSchedule,
          quoteId: editQuoteId,
          userId: user?.id || ''
        });
      }

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
        executiveSummary,
        showPricing,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user?.id || '',
        pricingMode, // Save pricing mode
        scopeOfWork, // Save current SOW
      };

      await addQuote(user?.id, organizationId, quote, queueChange);

      // Save Follow-up Schedule
      if (followUpSchedule.status === 'active') {
        await saveFollowUpSchedule({
          ...followUpSchedule,
          quoteId: quote.id,
          userId: user?.id || ''
        });
      }

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

    // Open send dialog for confirmation
    setSendDialogOpen(true);
  };

  const handleConfirmSend = async (emailContent: EmailContent) => {
    const finalSummary = emailContent.includeSummary ? emailContent.customSummary : undefined;

    if (isEditMode && editQuoteId) { // CRITICAL: Use editQuoteId instead of id
      const quotes = await getQuotes(user?.id, organizationId, isAdmin || isMaxAITier);
      const existingQuote = quotes.find(q => q.id === editQuoteId);
      const updatedQuote: Quote = {
        id: editQuoteId, // CRITICAL: Use stored editQuoteId
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
        executiveSummary: finalSummary,
        showPricing,
        sentDate: new Date().toISOString(),
        createdAt: existingQuote?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user?.id || '',
        pricingMode, // Save pricing mode
        scopeOfWork: scopeOfWork, // Save current SOW
      };

      await updateQuote(user?.id, organizationId, editQuoteId, updatedQuote, queueChange);

      // Save Follow-up Schedule
      if (followUpSchedule.status === 'active' || followUpSchedule.id) {
        await saveFollowUpSchedule({
          ...followUpSchedule,
          quoteId: editQuoteId,
          userId: user?.id || ''
        });
      }

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
        executiveSummary: finalSummary,
        showPricing,
        sentDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user?.id || '',
        pricingMode, // Save pricing mode
        scopeOfWork, // Save current SOW
      };

      await addQuote(user?.id, organizationId, quote, queueChange);

      // Save Follow-up Schedule
      if (followUpSchedule.status === 'active') {
        await saveFollowUpSchedule({
          ...followUpSchedule,
          quoteId: quote.id,
          userId: user?.id || ''
        });
      }

      await generatePDF(quote);
      toast.success('Quote sent successfully');
    }
    navigate('/quotes');
  };

  const generatePDF = async (quote: Quote) => {
    const doc = new jsPDF();
    let yPos = 20;

    // Company Info
    doc.setFontSize(20);
    doc.text(settings?.name || 'Your Company', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    if (settings?.address) {
      doc.text(settings.address, 20, yPos);
      yPos += 5;
    }
    if (settings?.phone) {
      doc.text(`Phone: ${settings.phone}`, 20, yPos);
      yPos += 5;
    }
    if (settings?.email) {
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

  if (loading) {
    return (
      <div className="w-full max-w-[1800px] mx-auto space-y-4 pb-20 md:pb-6 px-4 md:px-6">
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1800px] mx-auto space-y-4 pb-20 md:pb-6 px-4 md:px-6">
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
        <div className="space-y-6 min-w-0">
          {/* AI Full Quote Generation */}
          {!isEditMode && items.length > 0 && (
            <FullQuoteGenerationAI
              items={items}
              customers={customers}
              onQuoteGenerated={handleQuoteGenerated}
            />
          )}

          {/* Main Form Content with Tabs */}
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="details">Quote Details</TabsTrigger>
              <TabsTrigger value="sow">Scope of Work</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <QuoteBasicInfo
                customers={customers}
                selectedCustomerId={selectedCustomerId}
                onCustomerChange={setSelectedCustomerId}
                quoteTitle={quoteTitle}
                onTitleChange={setQuoteTitle}
                quoteNotes={quoteNotes}
                onNotesChange={setQuoteNotes}
                quoteItems={quoteItems}
                subtotal={subtotal}
                total={total}
                settings={settings}
                showPricing={showPricing}
                onShowPricingChange={setShowPricing}
                pricingMode={pricingMode}
                onPricingModeChange={setPricingMode}
                onTitleGenerate={async (p) => { await titleAI.generate(p); }}
                onNotesGenerate={async (p) => { await notesAI.generate(p); }}
                titleAILoading={titleAI.isLoading}
                notesAILoading={notesAI.isLoading}
              />

              {/* Executive Summary Section */}
              {quoteItems.length > 0 && selectedCustomerId && (
                <QuoteSummaryAI
                  quote={{
                    id: editQuoteId || '',
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
                    executiveSummary,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    userId: user?.id || '',
                  }}
                  customer={selectedCustomer}
                  onSummaryGenerated={setExecutiveSummary}
                  currentSummary={executiveSummary}
                  onSummaryChange={setExecutiveSummary}
                />
              )}

              <QuoteItemsSection
                quoteItems={quoteItems}
                availableItems={items}
                onUpdateQuantity={updateItemQuantity}
                onRemoveItem={removeItem}
                onAddItem={addItemToQuote}
                onOpenCustomItemDialog={() => setIsItemDialogOpen(true)}
              />
            </TabsContent>

            <TabsContent value="sow">
              <Card>
                <CardHeader>
                  <CardTitle>Scope of Work</CardTitle>
                  <CardDescription>
                    Generate a professional Scope of Work document using AI, or write it manually.
                    This content will be displayed as a dedicated slide in the proposal.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <SOWGeneratorAI
                      quote={{
                        id: editQuoteId || '',
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
                        executiveSummary,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        userId: user?.id || '',
                      }}
                      companyName={settings?.name}
                      onSaveToQuote={(content) => {
                        setScopeOfWork(content);
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sow-content">Content Editor</Label>
                    <Textarea
                      id="sow-content"
                      value={scopeOfWork}
                      onChange={(e) => setScopeOfWork(e.target.value)}
                      placeholder="Scope of work content will appear here..."
                      className="min-h-[500px] font-mono text-sm leading-relaxed"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tip: Use Markdown formatting (## for headers, • for lists) to style your document.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="automation">
              <FollowUpSettings
                schedule={followUpSchedule}
                onChange={setFollowUpSchedule}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Item Catalog & Summary */}
        <div className="space-y-6 min-w-0">
          <ItemCatalogSidebar items={items} onAddItem={addItemToQuote} />
          <QuoteSummarySidebar
            subtotal={subtotal}
            tax={tax}
            total={total}
            quoteItems={quoteItems}
            customer={selectedCustomer}
          />
        </div>
      </div>

      {/* Custom Item Dialog */}
      <CustomItemDialog
        isOpen={isItemDialogOpen}
        onOpenChange={setIsItemDialogOpen}
        onAddItem={(item) => setQuoteItems([...quoteItems, item])}
      />

      {/* Send Quote Dialog */}
      <SendQuoteDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        quote={{
          id: editQuoteId || crypto.randomUUID(), // CRITICAL: Use editQuoteId if available
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
          executiveSummary,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: user?.id || '',
        }}
        customer={selectedCustomer}
        onConfirm={handleConfirmSend}
        data-demo="send-dialog"
      />
    </div>
  );
}
