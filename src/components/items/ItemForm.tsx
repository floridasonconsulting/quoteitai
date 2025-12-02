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

const CATEGORIES = [
  'General',
  'Products',
  'Services',
  'Consulting',
  'Labor',
  'Materials',
  'Equipment',
  'Other',
];

interface ItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: Item | null;
  onSubmit: (formData: FormData) => Promise<void>;
}

export interface FormData {
  name: string;
  description: string;
  category: string;
  basePrice: string;
  markup: string;
  markupType: 'percentage' | 'fixed';
  units: string;
  minQuantity: string; // NEW: Minimum quantity field
}

export function ItemForm({ open, onOpenChange, editingItem, onSubmit }: ItemFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category: 'General',
    basePrice: '',
    markup: '',
    markupType: 'percentage',
    units: 'Each',
    minQuantity: '1', // NEW: Default to 1
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
        minQuantity: editingItem.minQuantity?.toString() || '1', // NEW: Load from editing item
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
        minQuantity: '1', // NEW: Default to 1
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
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="units">Units *</Label>
              <Select value={formData.units} onValueChange={(value) => setFormData({ ...formData, units: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Each">Each</SelectItem>
                  <SelectItem value="Per SF">Per SF</SelectItem>
                  <SelectItem value="Per LF">Per LF</SelectItem>
                  <SelectItem value="Hour">Hour</SelectItem>
                  <SelectItem value="Day">Day</SelectItem>
                  <SelectItem value="Set">Set</SelectItem>
                  <SelectItem value="Box">Box</SelectItem>
                </SelectContent>
              </Select>
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
