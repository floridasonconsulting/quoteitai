import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { QuoteItem } from "@/types";
import { calculateItemTotal } from "@/lib/quote-utils";

interface CustomItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddItem: (item: QuoteItem) => void;
}

export function CustomItemDialog({ isOpen, onOpenChange, onAddItem }: CustomItemDialogProps) {
  const [customItem, setCustomItem] = useState({
    name: '',
    description: '',
    quantity: 1,
    price: '',
  });

  const handleAddItem = () => {
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

    onAddItem(newQuoteItem);
    setCustomItem({ name: '', description: '', quantity: 1, price: '' });
    onOpenChange(false);
    toast.success('Custom item added to quote');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent data-demo="custom-item-dialog">
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
                onFocus={(e) => e.target.select()}
                onClick={(e) => e.currentTarget.select()}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddItem}>
            Add Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
