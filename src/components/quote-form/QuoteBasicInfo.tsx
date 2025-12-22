import { User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AIButton } from '@/components/AIButton';
import { Customer, QuoteItem, CompanySettings } from '@/types';
import { sanitizeForAI, sanitizeNumber } from '@/lib/input-sanitization';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

interface QuoteBasicInfoProps {
  customers: Customer[];
  selectedCustomerId: string;
  onCustomerChange: (customerId: string) => void;
  quoteTitle: string;
  onTitleChange: (title: string) => void;
  quoteNotes: string;
  onNotesChange: (notes: string) => void;
  quoteItems: QuoteItem[];
  subtotal: number;
  total: number;
  settings: CompanySettings | null;
  showPricing: boolean;
  onShowPricingChange: (show: boolean) => void;
  onTitleGenerate: (prompt: string, context: Record<string, string>) => void;
  onNotesGenerate: (prompt: string) => Promise<void>;
  titleAILoading: boolean;
  notesAILoading: boolean;
  pricingMode: string;
  onPricingModeChange: (mode: 'itemized' | 'category_total' | 'grand_total') => void;
}

export function QuoteBasicInfo({
  customers,
  selectedCustomerId,
  onCustomerChange,
  quoteTitle,
  onTitleChange,
  quoteNotes,
  onNotesChange,
  quoteItems,
  subtotal,
  total,
  settings,
  showPricing,
  onShowPricingChange,
  onTitleGenerate,
  onNotesGenerate,
  titleAILoading,
  notesAILoading,
  pricingMode,
  onPricingModeChange
}: QuoteBasicInfoProps) {
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleGenerateTitle = () => {
    const customer = customers.find(c => c.id === selectedCustomerId);
    const sanitizedCustomerName = sanitizeForAI(customer?.name, 100);
    const sanitizedItems = quoteItems.map(item => sanitizeForAI(item.name, 100));
    const itemsList = sanitizedItems.join(', ');
    onTitleGenerate(
      `Generate 3 professional quote titles based on: Customer: ${sanitizedCustomerName}, Items: ${itemsList}`,
      { customerName: sanitizedCustomerName, items: itemsList }
    );
  };

  const handleGenerateNotes = async () => {
    if (!selectedCustomerId) {
      toast.error('Please select a customer first');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);

    // Sanitize all user inputs before passing to AI
    const sanitizedCompanyName = sanitizeForAI(settings?.name, 100) || 'Your Company';
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

    await onNotesGenerate(contextPrompt);
  };

  return (
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
          <Select value={selectedCustomerId} onValueChange={onCustomerChange} data-demo="customer-select">
            <SelectTrigger>
              <SelectValue placeholder="Choose a customer..." />
            </SelectTrigger>
            <SelectContent>
              {customers.map(customer => (
                <SelectItem key={customer.id} value={customer.id}>
                  <div>
                    <div>{customer.name}</div>
                    {(customer.contactFirstName || customer.contactLastName) && (
                      <div className="text-xs text-muted-foreground">
                        Contact: {customer.contactFirstName} {customer.contactLastName}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">{customer.email}</div>
                  </div>
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
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Website Development Project"
              className="flex-1"
              data-demo="title-input"
            />
            <AIButton
              onClick={handleGenerateTitle}
              isLoading={titleAILoading}
              disabled={!selectedCustomerId || quoteItems.length === 0}
              data-demo="title-ai-button"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="notes">Notes</Label>
            <AIButton
              onClick={handleGenerateNotes}
              isLoading={notesAILoading}
              disabled={!selectedCustomerId || quoteItems.length === 0}
              data-demo="notes-ai-button"
            >
              Generate Terms
            </AIButton>
          </div>
          <Textarea
            id="notes"
            value={quoteNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Additional information..."
            rows={3}
            data-demo="notes-textarea"
          />
        </div>

      </div>

      <div className="space-y-2 pt-2 border-t">
        <Label htmlFor="pricingMode">Pricing Breakdown Display</Label>
        <Select
          value={pricingMode}
          onValueChange={(val: any) => onPricingModeChange(val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select display mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="category_total">
              <div className="flex flex-col">
                <span className="font-bold">Category Totals (Default)</span>
                <span className="text-xs text-muted-foreground">Detailed items without individual prices</span>
              </div>
            </SelectItem>
            <SelectItem value="itemized">
              <div className="flex flex-col">
                <span className="font-bold">Fully Itemized</span>
                <span className="text-xs text-muted-foreground">Show price for every single item</span>
              </div>
            </SelectItem>
            <SelectItem value="grand_total">
              <div className="flex flex-col">
                <span className="font-bold">Grand Total Only</span>
                <span className="text-xs text-muted-foreground">Hide all items and category breakdowns</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
        )}
    </CardContent>
    </Card >
  );
}
