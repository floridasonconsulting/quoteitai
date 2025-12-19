import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { QuoteItem } from "@/types";
import { calculateItemTotal } from "@/lib/quote-utils";
import { ImageSelectorInput } from "@/components/shared/ImageSelectorInput";

interface CustomItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddItem: (item: QuoteItem) => void;
}

export function CustomItemDialog({ isOpen, onOpenChange, onAddItem }: CustomItemDialogProps) {
  const [customItem, setCustomItem] = useState({
    name: '',
    description: '',
    category: 'Accessories',
    quantity: 1,
    price: '',
    imageUrl: '',
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
      category: customItem.category,
      quantity: customItem.quantity,
      price,
      total: calculateItemTotal(customItem.quantity, price),
      imageUrl: customItem.imageUrl || undefined,
    };

    onAddItem(newQuoteItem);
    setCustomItem({ name: '', description: '', category: 'Accessories', quantity: 1, price: '', imageUrl: '' });
    onOpenChange(false);
    toast.success('Custom item added to quote');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent data-demo="custom-item-dialog" className="max-w-2xl">
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
          <div className="space-y-2">
            <Label htmlFor="customCategory">Category *</Label>
            <Select
              value={customItem.category}
              onValueChange={(value) => setCustomItem({ ...customItem, category: value })}
            >
              <SelectTrigger id="customCategory">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pool Structure">Pool Structure</SelectItem>
                <SelectItem value="Coping & Tile">Coping & Tile</SelectItem>
                <SelectItem value="Decking">Decking</SelectItem>
                <SelectItem value="Equipment">Equipment</SelectItem>
                <SelectItem value="Accessories">Accessories</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ImageSelectorInput
            value={customItem.imageUrl || ''}
            onChange={(url) => setCustomItem({ ...customItem, imageUrl: url })}
            label="Image"
            subLabel="(Optional)"
          />
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