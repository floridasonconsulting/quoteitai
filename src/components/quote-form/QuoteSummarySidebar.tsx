import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Customer, QuoteItem } from "@/types";
import { PricingOptimizationAI } from "@/components/PricingOptimizationAI";

interface QuoteSummarySidebarProps {
  subtotal: number;
  tax: number;
  total: number;
  quoteItems: QuoteItem[];
  customer?: Customer;
}

export function QuoteSummarySidebar({ 
  subtotal, 
  tax, 
  total,
  quoteItems,
  customer,
}: QuoteSummarySidebarProps) {
  return (
    <div className="space-y-6">
      <Card className="lg:sticky lg:top-[calc(100vh-200px)]">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2" data-demo="quote-summary">
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
      
      {quoteItems.length > 0 && (
        <PricingOptimizationAI
          quote={{
            items: quoteItems,
            total
          }}
          customer={customer}
        />
      )}
    </div>
  );
}
