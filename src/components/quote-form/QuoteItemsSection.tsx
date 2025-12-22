import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ItemRecommendationsAI } from "@/components/ItemRecommendationsAI";
import { QuoteItem, Item } from "@/types";
import { Plus, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { sortCategoriesByOrder, normalizeCategory } from "@/lib/proposal-categories";

interface QuoteItemsSectionProps {
  quoteItems: QuoteItem[];
  availableItems: Item[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onAddItem: (item: Item) => void;
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
          <div className="space-y-6">
            {sortCategoriesByOrder(Array.from(new Set(quoteItems.map(i => normalizeCategory(i.category, i.name))))).map(category => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border/60" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-0.5 bg-muted rounded">
                    {category}
                  </span>
                  <div className="h-px flex-1 bg-border/60" />
                </div>

                {quoteItems
                  .filter(item => normalizeCategory(item.category, item.name) === category)
                  .map(item => (
                    <div
                      key={item.itemId}
                      className="flex flex-col gap-3 p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                    >
                      {/* Item Info Row - Always full width */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-base break-words">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1 break-words">{item.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8 -mt-1 -mr-1"
                          onClick={() => onRemoveItem(item.itemId)}
                          aria-label="Remove item"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Controls Row - Quantity and Price */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={() => onUpdateQuantity(item.itemId, item.quantity - 1)}
                            aria-label="Decrease quantity"
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
                            className="w-20 text-center h-9"
                            aria-label="Item quantity"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={() => onUpdateQuantity(item.itemId, item.quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            +
                          </Button>
                          {item.units && (
                            <span className="text-sm text-muted-foreground whitespace-nowrap">{item.units}</span>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-base">{formatCurrency(item.total)}</p>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">{formatCurrency(item.price)} each</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
