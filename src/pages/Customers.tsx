
import { useEffect, useState, useRef } from 'react';
import { Plus, Search, Download, Upload, RefreshCw, AlertCircle, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from '@/lib/db-service';
import { Customer } from '@/types';
import { toast } from 'sonner';
import { formatCSVLine } from '@/lib/csv-utils';
import { importCustomersFromCSV } from '@/lib/import-export-utils';
import { generateCustomerTemplate, downloadTemplate } from '@/lib/csv-template-utils';
import { ImportOptionsDialog, DuplicateStrategy } from '@/components/ImportOptionsDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncManager } from '@/hooks/useSyncManager';
import { useLoadingState } from '@/hooks/useLoadingState';
import { CustomersTable } from '@/components/customers/CustomersTable';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    contactFirstName: '',
    contactLastName: '',
  });
  const { user } = useAuth();
  const { queueChange, pauseSync, resumeSync } = useSyncManager();
  const { startLoading, stopLoading } = useLoadingState();
  const loadingRef = useRef(false);

  const loadCustomers = async (forceRefresh = false) => {
    if (loadingRef.current) {
      console.log('[Customers] Load already in progress, skipping');
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);
    setLoadStartTime(Date.now());
    startLoading('load-customers', 'Loading customers');

    try {
      const backoffDelay = retryCount > 0 ? Math.pow(2, retryCount - 1) * 5000 : 0;
      const timeoutMs = 15000 + backoffDelay;

      const timeoutPromise = new Promise<Customer[]>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      );

      const dataPromise = getCustomers(user?.id);
      const data = await Promise.race([dataPromise, timeoutPromise]);

      setCustomers(data);
      setSelectedCustomers([]);
      setError(null);
      setRetryCount(0);
      console.log(`[Customers] Loaded ${data.length} customers successfully`);
    } catch (err: unknown) {
      console.error('[Customers] Load failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      const errorMsg = errorMessage === 'Request timeout' 
        ? 'Loading is taking longer than expected. Try clearing cache or check your connection.'
        : 'Failed to load customers. Please try again.';
      setError(errorMsg);
      
      if (retryCount < 3) {
        toast.error(`${errorMsg} Retry ${retryCount + 1}/3`);
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
      stopLoading('load-customers');
      setLoadStartTime(null);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [user]);

  useEffect(() => {
    let lastFocusTime = Date.now();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        const timeSinceFocus = Date.now() - lastFocusTime;
        if (timeSinceFocus > 5000) {
          loadCustomers();
        }
        lastFocusTime = Date.now();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomers([...selectedCustomers, customerId]);
    } else {
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCustomers.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedCustomers.length} customer${selectedCustomers.length > 1 ? 's' : ''}?`)) {
      try {
        const deletedIds = [...selectedCustomers];
        setCustomers(prev => prev.filter(c => !deletedIds.includes(c.id)));
        setSelectedCustomers([]);
        
        for (const id of deletedIds) {
          await deleteCustomer(user?.id, id, queueChange);
        }
        
        toast.success(`Deleted ${deletedIds.length} customer${deletedIds.length > 1 ? 's' : ''}`);
      } catch (error) {
        console.error('Error deleting customers:', error);
        toast.error('Failed to delete customers. Please try again.');
        await loadCustomers();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    try {
      if (editingCustomer) {
        const updated = await updateCustomer(user?.id, editingCustomer.id, formData, queueChange);
        setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
        toast.success('Customer updated successfully');
      } else {
        const newCustomer: Customer = {
          id: crypto.randomUUID(),
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          contactFirstName: formData.contactFirstName,
          contactLastName: formData.contactLastName,
          createdAt: new Date().toISOString(),
        };
        const added = await addCustomer(user?.id, newCustomer, queueChange);
        setCustomers(prev => [...prev, added]);
        toast.success('Customer added successfully');
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Failed to save customer. Please try again.');
      await loadCustomers();
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      zip: customer.zip,
      contactFirstName: customer.contactFirstName || '',
      contactLastName: customer.contactLastName || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      await deleteCustomer(user?.id, id, queueChange);
      setCustomers(prev => prev.filter(c => c.id !== id));
      toast.success('Customer deleted successfully');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer. Please try again.');
      await loadCustomers();
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCustomer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      contactFirstName: '',
      contactLastName: '',
    });
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    loadCustomers(true);
  };

  const handleClearCacheAndRetry = () => {
    pauseSync();
    localStorage.removeItem('customers-cache');
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_ALL_CACHE' },
        [messageChannel.port2]
      );
    }
    setRetryCount(0);
    loadCustomers(true).finally(() => {
      resumeSync();
    });
    toast.success('Cache cleared');
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Address', 'City', 'State', 'ZIP', 'Contact First Name', 'Contact Last Name'];
    const rows = customers.map(customer => [
      customer.name,
      customer.email,
      customer.phone || '',
      customer.address || '',
      customer.city || '',
      customer.state || '',
      customer.zip || '',
      customer.contactFirstName || '',
      customer.contactLastName || ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => formatCSVLine(row)).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Customers exported successfully');
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
      const result = await importCustomersFromCSV(text, user.id, strategy);
      
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
      
      await loadCustomers(true);
    };
    reader.readAsText(importFile);
    setShowImportDialog(false);
    setImportFile(null);
  };

  const handleDownloadTemplate = () => {
    const template = generateCustomerTemplate();
    downloadTemplate(template, 'customers-template.csv');
    toast.success('Customer template downloaded');
  };

  return (
    <div className="space-y-6 overflow-x-hidden max-w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">
            Manage your customer database
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Add Customer</span>
                <span className="ml-2 sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </DialogTitle>
                <DialogDescription>
                  Fill in the customer information below
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Business/Company Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Acme Corporation"
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactFirstName">Contact First Name</Label>
                    <Input
                      id="contactFirstName"
                      value={formData.contactFirstName}
                      onChange={(e) => setFormData({ ...formData, contactFirstName: e.target.value })}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactLastName">Contact Last Name</Label>
                    <Input
                      id="contactLastName"
                      value={formData.contactLastName}
                      onChange={(e) => setFormData({ ...formData, contactLastName: e.target.value })}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main St"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="New York"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="NY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                      placeholder="10001"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCustomer ? 'Update' : 'Add'} Customer
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {selectedCustomers.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedCustomers.length} customer{selectedCustomers.length > 1 ? 's' : ''} selected
              </span>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
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
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {filteredCustomers.length > 0 && (
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                checked={selectedCustomers.length === filteredCustomers.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? (
                <p>No customers found matching "{searchTerm}"</p>
              ) : (
                <>
                  <p className="mb-4">No customers yet. Add your first customer to get started!</p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Customer
                  </Button>
                </>
              )}
            </div>
          ) : (
            <CustomersTable
              customers={filteredCustomers}
              selectedCustomers={selectedCustomers}
              onSelectCustomer={handleSelectCustomer}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      <ImportOptionsDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onConfirm={processImport}
        fileName={importFile?.name || ''}
        entityType="customers"
      />
    </div>
  );
}
