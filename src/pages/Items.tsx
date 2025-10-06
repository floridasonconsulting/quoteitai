import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getItems, addItem, updateItem, deleteItem } from '@/lib/db-service';
import { Item } from '@/types';
import { toast } from 'sonner';
import { parseCSVLine, formatCSVLine } from '@/lib/csv-utils';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncManager } from '@/hooks/useSyncManager';
import { supabase } from '@/integrations/supabase/client';

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

export default function Items() {
  const { user } = useAuth();
  const { queueChange } = useSyncManager();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'General',
    basePrice: '',
    markup: '',
    markupType: 'percentage' as 'percentage' | 'fixed',
    units: 'Each',
  });

  const loadItems = async () => {
    setLoading(true);
    const data = await getItems(user?.id);
    setItems(data);
    setSelectedItems([]);
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, [user]);

  // Refresh data when navigating back to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        loadItems();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredItems.map(i => i.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (confirm(`Delete ${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''}?`)) {
      for (const itemId of selectedItems) {
        await deleteItem(user?.id, itemId, queueChange);
      }
      await loadItems();
      toast.success(`Deleted ${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''}`);
    }
  };

  const handleBulkMarkup = async (markup: number, markupType: 'percentage' | 'fixed') => {
    if (selectedItems.length === 0 || !markup) return;
    
    for (const itemId of selectedItems) {
      const item = items.find(i => i.id === itemId);
      if (item) {
        const basePrice = item.basePrice;
        const finalPrice = markupType === 'percentage' 
          ? basePrice + (basePrice * markup / 100)
          : basePrice + markup;
        
        await updateItem(user?.id, itemId, {
          markup,
          markupType,
          finalPrice
        }, queueChange);
      }
    }
    
    await loadItems();
    toast.success(`Applied ${markup}${markupType === 'percentage' ? '%' : '$'} markup to ${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''}`);
    
    // Clear the markup input
    const input = document.getElementById('bulk-markup') as HTMLInputElement;
    if (input) input.value = '';
  };

  const calculateFinalPrice = () => {
    const base = parseFloat(formData.basePrice) || 0;
    const markup = parseFloat(formData.markup) || 0;
    
    if (formData.markupType === 'percentage') {
      return base + (base * markup / 100);
    }
    return base + markup;
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || 
      item.category.toLowerCase().trim() === categoryFilter.toLowerCase().trim();
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.basePrice) {
      toast.error('Name and base price are required');
      return;
    }

    const basePrice = parseFloat(formData.basePrice);
    const markup = parseFloat(formData.markup) || 0;

    if (editingItem) {
      await updateItem(user?.id, editingItem.id, {
        ...formData,
        category: formData.category.trim(),
        basePrice,
        markup,
        finalPrice: calculateFinalPrice(),
      }, queueChange);
      toast.success('Item updated successfully');
    } else {
      const newItem: Item = {
        id: crypto.randomUUID(),
        ...formData,
        category: formData.category.trim(),
        basePrice,
        markup,
        finalPrice: calculateFinalPrice(),
        createdAt: new Date().toISOString(),
      };
      await addItem(user?.id, newItem, queueChange);
      toast.success('Item added successfully');
    }

    await loadItems();
    handleCloseDialog();
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      basePrice: item.basePrice.toString(),
      markup: item.markup.toString(),
      markupType: item.markupType,
      units: item.units || 'Each',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteItem(user?.id, id, queueChange);
      await loadItems();
      toast.success('Item deleted successfully');
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      category: 'General',
      basePrice: '',
      markup: '',
      markupType: 'percentage',
      units: 'Each',
    });
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Description', 'Category', 'Base Price', 'Markup Type', 'Markup', 'Final Price', 'Units'];
    const rows = items.map(item => [
      item.name,
      item.description,
      item.category,
      item.basePrice,
      item.markupType,
      item.markup,
      item.finalPrice,
      item.units
    ]);
    
    const csvContent = [headers, ...rows].map(row => formatCSVLine(row)).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `items-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Items exported successfully');
  };

  const importFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const importedItems: Item[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [name, description, category, basePrice, markupType, markup, finalPrice, units] = parseCSVLine(line);
        
        if (name && category && basePrice) {
          // Normalize category (trim whitespace)
          const normalizedCategory = category.trim();
          
          importedItems.push({
            id: crypto.randomUUID(),
            name: name.trim(),
            description: description?.trim() || '',
            category: normalizedCategory,
            basePrice: parseFloat(basePrice),
            markupType: (markupType?.trim() as 'percentage' | 'fixed') || 'percentage',
            markup: parseFloat(markup) || 0,
            finalPrice: parseFloat(finalPrice) || parseFloat(basePrice),
            units: units?.trim() || 'Each',
            createdAt: new Date().toISOString(),
          });
        }
      }

      if (importedItems.length > 0) {
        for (const item of importedItems) {
          await addItem(user?.id, item, queueChange);
        }
        await loadItems();
        toast.success(`Imported ${importedItems.length} items`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="space-y-6 overflow-x-hidden max-w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Items Catalog</h2>
          <p className="text-muted-foreground">
            Manage your products and services
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Export</span>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <label className="cursor-pointer">
              <Upload className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Import</span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={importFromCSV}
              />
            </label>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Add Item</span>
                <span className="ml-2 sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
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
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingItem ? 'Update' : 'Add'} Item
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {selectedItems.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-sm font-medium">
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Markup"
                    className="w-24 h-9"
                    id="bulk-markup"
                  />
                  <Select
                    onValueChange={(value) => {
                      const input = document.getElementById('bulk-markup') as HTMLInputElement;
                      if (input && input.value) {
                        handleBulkMarkup(parseFloat(input.value), value as 'percentage' | 'fixed');
                      }
                    }}
                  >
                    <SelectTrigger className="w-20 h-9">
                      <SelectValue placeholder="%" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">%</SelectItem>
                      <SelectItem value="fixed">$</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-3 flex-1">
              {filteredItems.length > 0 && (
                <Checkbox
                  checked={selectedItems.length === filteredItems.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all items"
                />
              )}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm || categoryFilter !== 'all' ? (
                <p>No items found matching your filters</p>
              ) : (
                <>
                  <p className="mb-4">No items yet. Add your first item to get started!</p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                          aria-label={`Select ${item.name}`}
                          className="mt-1"
                        />
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                      </div>
                      <Badge variant="secondary">{item.category}</Badge>
                    </div>
                    {item.description && (
                      <CardDescription className="line-clamp-2">
                        {item.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Units:</span>
                        <span>{item.units}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base Price:</span>
                        <span>{formatCurrency(item.basePrice || 0)}</span>
                      </div>
                      {(item.markup || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Markup:</span>
                          <span>
                            {item.markupType === 'percentage'
                              ? `${item.markup || 0}%`
                              : formatCurrency(item.markup || 0)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold pt-1 border-t">
                        <span>Final Price:</span>
                        <span className="text-primary">{formatCurrency(item.finalPrice || 0)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
