import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ItemRecommendationsAI } from "@/components/ItemRecommendationsAI";
import { QuoteItem, Item } from "@/types";
import { Plus, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface QuoteItemsSectionProps {
  quoteItems: QuoteItem[];
  availableItems: Item[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onAddItem: (item: QuoteItem) => void;
  onOpenCustomItemDialog: () => void;
}

export function QuoteItemsSection({
  quoteItems,
  availableItems,
  onUpdateQuantity,
  onRemoveItem,
  onAddItem,
  onOpenCustomItemDialog,
}: QuoteItemsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3">
          <CardTitle>Quote Items</CardTitle>
          <div className="flex flex-col gap-2">
            <ItemRecommendationsAI
              currentItems={quoteItems}
              availableItems={availableItems}
              onAddItem={onAddItem}
            />
            <Button onClick={onOpenCustomItemDialog} className="w-full" data-demo="custom-item-button">
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Item
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent data-demo="quote-items-list">
        {quoteItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No items added yet. Select items from your catalog or add a custom item.
          </p>
        ) : (
          <div className="space-y-3">
            {quoteItems.map(item => (
              <div key={item.itemId} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1 w-full min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{item.name}</p>
                      {item.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="sm:hidden shrink-0 h-8 w-8"
                      onClick={() => onRemoveItem(item.itemId)}
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
                      onClick={() => onUpdateQuantity(item.itemId, item.quantity - 1)}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.itemId, parseFloat(e.target.value) || 1)}
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => e.currentTarget.select()}
                      className="w-16 sm:w-20 text-center h-8"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onUpdateQuantity(item.itemId, item.quantity + 1)}
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
                    onClick={() => onRemoveItem(item.itemId)}
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
  );
}
