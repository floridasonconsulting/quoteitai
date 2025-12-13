import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Item } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface ItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: Item | null;
  onSubmit: (formData: FormData) => Promise<void>;
  existingCategories?: string[];
  existingUnits?: string[];
}

export interface FormData {
  name: string;
  description: string;
  category: string;
  basePrice: string;
  markup: string;
  markupType: 'percentage' | 'fixed';
  units: string;
  minQuantity: string;
  imageUrl: string; // NEW: Image URL field
}

export function ItemForm({ open, onOpenChange, editingItem, onSubmit, existingCategories = [], existingUnits = [] }: ItemFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category: 'General',
    basePrice: '',
    markup: '',
    markupType: 'percentage',
    units: 'Each',
    minQuantity: '1',
    imageUrl: '',
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        description: editingItem.description,
        category: editingItem.category,
        basePrice: editingItem.basePrice.toString(),
        markup: editingItem.markup.toString(),
        markupType: editingItem.markupType,
        units: editingItem.units || 'Each',
        minQuantity: editingItem.minQuantity?.toString() || '1',
        imageUrl: editingItem.imageUrl || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'General',
        basePrice: '',
        markup: '',
        markupType: 'percentage',
        units: 'Each',
        minQuantity: '1',
        imageUrl: '',
      });
    }
  }, [editingItem, open]);

  const calculateFinalPrice = () => {
    const base = parseFloat(formData.basePrice) || 0;
    const markup = parseFloat(formData.markup) || 0;
    
    if (formData.markupType === 'percentage') {
      return base + (base * markup / 100);
    }
    return base + markup;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.basePrice) {
      toast.error('Name and base price are required');
      return;
    }

    await onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </DialogTitle>
          <DialogDescription>
            Fill in the item information below
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Professional Service"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the item..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                list="categories"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Enter or select category"
              />
              <datalist id="categories">
                {existingCategories.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="units">Units *</Label>
              <Input
                id="units"
                list="units"
                value={formData.units}
                onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                placeholder="Enter or select unit"
                required
              />
              <datalist id="units">
                {existingUnits.map(unit => (
                  <option key={unit} value={unit} />
                ))}
              </datalist>
            </div>
          </div>

          {/* NEW: Minimum Quantity Field */}
          <div className="space-y-2">
            <Label htmlFor="minQuantity" className="flex items-center gap-2">
              Minimum Quantity
              <span className="text-xs text-muted-foreground font-normal">
                (Default quantity used for AI and manual addition)
              </span>
            </Label>
            <Input
              id="minQuantity"
              type="number"
              step="1"
              min="1"
              value={formData.minQuantity}
              onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
              placeholder="1"
            />
          </div>

          {/* NEW: Image URL Field */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="flex items-center gap-2">
              Image URL
              <span className="text-xs text-muted-foreground font-normal">
                (Optional - URL to product/service image for proposals)
              </span>
            </Label>
            <Input
              id="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="basePrice">Base Price *</Label>
              <Input
                id="basePrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="markup">Markup</Label>
              <div className="flex gap-2">
                <Input
                  id="markup"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.markup}
                  onChange={(e) => setFormData({ ...formData, markup: e.target.value })}
                  placeholder="0"
                />
                <Select
                  value={formData.markupType}
                  onValueChange={(value: 'percentage' | 'fixed') =>
                    setFormData({ ...formData, markupType: value })
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">%</SelectItem>
                    <SelectItem value="fixed">$</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Final Price:</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(calculateFinalPrice())}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingItem ? 'Update' : 'Add'} Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
