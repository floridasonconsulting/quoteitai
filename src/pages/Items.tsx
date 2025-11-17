
import { useEffect, useState, useRef } from 'react';
import { Plus, Search, Download, Upload, RefreshCw, AlertCircle, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getItems, addItem, updateItem, deleteItem } from '@/lib/db-service';
import { Item } from '@/types';
import { toast } from 'sonner';
import { formatCSVLine } from '@/lib/csv-utils';
import { importItemsFromCSV } from '@/lib/import-export-utils';
import { generateItemTemplate, downloadTemplate } from '@/lib/csv-template-utils';
import { ImportOptionsDialog, DuplicateStrategy } from '@/components/ImportOptionsDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncManager } from '@/hooks/useSyncManager';
import { useLoadingState } from '@/hooks/useLoadingState';
import { ItemsTable } from '@/components/items/ItemsTable';
import { ItemForm, type FormData } from '@/components/items/ItemForm';

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
  const { queueChange, pauseSync, resumeSync } = useSyncManager();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const { startLoading, stopLoading } = useLoadingState();
  const loadingRef = useRef(false);

  const loadItems = async (forceRefresh = false) => {
    if (loadingRef.current) {
      console.log('[Items] Load already in progress, skipping');
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);
    setLoadStartTime(Date.now());
    startLoading('load-items', 'Loading items');

    try {
      const backoffDelay = retryCount > 0 ? Math.pow(2, retryCount - 1) * 5000 : 0;
      const timeoutMs = 15000 + backoffDelay;

      const timeoutPromise = new Promise<Item[]>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      );

      const dataPromise = getItems(user?.id);
      const data = await Promise.race([dataPromise, timeoutPromise]);

      setItems(data);
      setSelectedItems([]);
      setError(null);
      setRetryCount(0);
      console.log(`[Items] Loaded ${data.length} items successfully`);
    } catch (err: unknown) {
      console.error('[Items] Load failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      const errorMsg = errorMessage === 'Request timeout'
        ? 'Loading is taking longer than expected. Try clearing cache or check your connection.'
        : 'Failed to load items. Please try again.';
      setError(errorMsg);

      if (retryCount < 3) {
        toast.error(`${errorMsg} Retry ${retryCount + 1}/3`);
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
      stopLoading('load-items');
      setLoadStartTime(null);
    }
  };

  useEffect(() => {
    loadItems();
  }, [user]);

  // Refresh data when navigating back to the page
  useEffect(() => {
    let lastFocusTime = Date.now();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        const timeSinceFocus = Date.now() - lastFocusTime;
        if (timeSinceFocus > 5000) {
          loadItems();
        }
        lastFocusTime = Date.now();
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
      try {
        const deletedIds = [...selectedItems];
        setItems(prev => prev.filter(i => !deletedIds.includes(i.id)));
        setSelectedItems([]);
        
        for (const itemId of deletedIds) {
          await deleteItem(user?.id, itemId, queueChange);
        }
        
        toast.success(`Deleted ${deletedIds.length} item${deletedIds.length > 1 ? 's' : ''}`);
      } catch (error) {
        console.error('Error deleting items:', error);
        toast.error('Failed to delete items. Please try again.');
        await loadItems();
      }
    }
  };

  const handleBulkMarkup = async (markup: number, markupType: 'percentage' | 'fixed') => {
    if (selectedItems.length === 0 || !markup) return;
    
    try {
      const updatedItems = items.map(item => {
        if (!selectedItems.includes(item.id)) return item;
        
        const basePrice = item.basePrice;
        const finalPrice = markupType === 'percentage' 
          ? basePrice + (basePrice * markup / 100)
          : basePrice + markup;
        
        return { ...item, markup, markupType, finalPrice };
      });
      setItems(updatedItems);
      
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
      
      toast.success(`Applied ${markup}${markupType === 'percentage' ? '%' : '$'} markup to ${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''}`);
      
      const input = document.getElementById('bulk-markup') as HTMLInputElement;
      if (input) input.value = '';
    } catch (error) {
      console.error('Error applying bulk markup:', error);
      toast.error('Failed to apply markup. Please try again.');
      await loadItems();
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || 
      item.category.toLowerCase().trim() === categoryFilter.toLowerCase().trim();
    return matchesSearch && matchesCategory;
  });

  const handleFormSubmit = async (formData: FormData) => {
    try {
      const basePrice = parseFloat(formData.basePrice);
      const markup = parseFloat(formData.markup) || 0;
      const finalPrice = formData.markupType === 'percentage'
        ? basePrice + (basePrice * markup / 100)
        : basePrice + markup;

      if (editingItem) {
        const updated = await updateItem(user?.id, editingItem.id, {
          ...formData,
          category: formData.category.trim(),
          basePrice,
          markup,
          finalPrice,
        }, queueChange);
        setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
        toast.success('Item updated successfully');
      } else {
        const newItem: Item = {
          id: crypto.randomUUID(),
          ...formData,
          category: formData.category.trim(),
          basePrice,
          markup,
          finalPrice,
          createdAt: new Date().toISOString(),
        };
        const added = await addItem(user?.id, newItem, queueChange);
        setItems(prev => [...prev, added]);
        toast.success('Item added successfully');
      }

      setIsDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item. Please try again.');
      await loadItems();
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await deleteItem(user?.id, id, queueChange);
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item. Please try again.');
      await loadItems();
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    loadItems(true);
  };

  const handleClearCacheAndRetry = () => {
    pauseSync();
    localStorage.removeItem('items-cache');
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_ALL_CACHE' },
        [messageChannel.port2]
      );
    }
    setRetryCount(0);
    loadItems(true).finally(() => {
      resumeSync();
    });
    toast.success('Cache cleared');
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

  const [importFile, setImportFile] = useState<File | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setShowImportDialog(true);
    event.target.value = '';
  };

  const processImport = async (strategy: DuplicateStrategy) => {
    if (!importFile || !user?.id) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const result = await importItemsFromCSV(text, user.id, strategy);
      
      const messages = [];
      if (result.success > 0) messages.push(`✅ Imported: ${result.success}`);
      if (result.skipped > 0) messages.push(`⏭️ Skipped: ${result.skipped}`);
      if (result.overwritten > 0) messages.push(`🔄 Overwritten: ${result.overwritten}`);
      if (result.failed > 0) messages.push(`❌ Failed: ${result.failed}`);
      
      if (result.errors.length > 0) {
        toast.error(`Import completed with errors:\n${result.errors.slice(0, 3).join('\n')}`);
      } else {
        toast.success(messages.join(' | '));
      }
      
      await loadItems(true);
    };
    reader.readAsText(importFile);
    setShowImportDialog(false);
    setImportFile(null);
  };

  const handleDownloadTemplate = () => {
    const template = generateItemTemplate();
    downloadTemplate(template, 'items-template.csv');
    toast.success('Item template downloaded');
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
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <FileText className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Template</span>
          </Button>
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
                onChange={handleFileSelect}
              />
            </label>
          </Button>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Add Item</span>
            <span className="ml-2 sm:hidden">Add</span>
          </Button>
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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleRetry}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry {retryCount > 0 && `(${retryCount}/3)`}
              </Button>
              <Button size="sm" variant="outline" onClick={handleClearCacheAndRetry}>
                Clear Cache & Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {loadStartTime && Date.now() - loadStartTime > 10000 && loading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Loading is taking longer than expected. If this continues, try clearing the cache.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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

          {filteredItems.length === 0 && !loading ? (
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
            <ItemsTable
              items={filteredItems}
              selectedItems={selectedItems}
              onSelectItem={handleSelectItem}
              onSelectAll={handleSelectAll}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      <ItemForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingItem={editingItem}
        onSubmit={handleFormSubmit}
      />

      <ImportOptionsDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onConfirm={processImport}
        fileName={importFile?.name || ''}
        entityType="items"
      />
    </div>
  );
}
