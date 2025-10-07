import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Save, Trash2, Bell, Sun, Moon, Sunset, AlertTriangle, ChevronDown, RefreshCw, Shield, Sparkles, AlertCircle, Upload, Download, FileDown, Check, Loader2, Zap, Database, CheckCircle, XCircle, Clock, CreditCard, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getSettings, saveSettings, clearDatabaseData } from '@/lib/db-service';
import { clearAllData } from '@/lib/storage';
import { 
  importCustomersFromCSV, 
  importItemsFromCSV, 
  importQuotesFromCSV,
  importCompanySettingsFromCSV, 
  loadSampleDataFile,
  validateItemsCSV,
  validateQuotesCSV,
  ImportResult 
} from '@/lib/import-export-utils';
import { CompanySettings } from '@/types';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncManager } from '@/hooks/useSyncManager';
import { useLoadingState } from '@/hooks/useLoadingState';
import { supabase } from '@/integrations/supabase/client';
import { checkAndMigrateData } from '@/lib/migration-helper';
import { generateSampleData } from '@/lib/sample-data';
import { Separator } from '@/components/ui/separator';
import { dispatchDataRefresh } from '@/hooks/useDataRefresh';

export default function Settings() {
  const navigate = useNavigate();
  const { permission, requestPermission, isSupported } = useNotifications();
  const { themeMode, setThemeMode } = useTheme();
  const { user, userRole, isAdmin, updateUserRole, checkUserRole, subscription, refreshSubscription } = useAuth();
  const { queueChange, pauseSync, resumeSync, isOnline, isSyncing, pendingCount, failedCount } = useSyncManager();
  const { getActiveOperations } = useLoadingState();
  
  console.log('[Settings] Current userRole:', userRole, 'isAdmin:', isAdmin);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const saveInProgress = useRef(false);
  const [clearCompanyInfo, setClearCompanyInfo] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [dangerZoneOpen, setDangerZoneOpen] = useState(false);
  const [generatingSample, setGeneratingSample] = useState(false);
  const [includeCompanySettings, setIncludeCompanySettings] = useState(true);
  const [sampleDataResult, setSampleDataResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState<string | null>(null);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [cacheInfo, setCacheInfo] = useState({
    customers: localStorage.getItem('customers-cache')?.length || 0,
    items: localStorage.getItem('items-cache')?.length || 0,
    quotes: localStorage.getItem('quotes-cache')?.length || 0,
    syncQueue: localStorage.getItem('sync-queue')?.length || 0,
    failedQueue: localStorage.getItem('failed-sync-queue')?.length || 0,
  });
  const [formData, setFormData] = useState<CompanySettings>({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: '',
    website: '',
    license: '',
    insurance: '',
    logoDisplayOption: 'both',
    terms: '',
  });

  const loadSettings = useCallback(async () => {
    if (!user?.id) return;
    console.log('[Settings] Loading settings for user:', user.id);
    setLoading(true);
    try {
      const settings = await getSettings(user.id);
      console.log('[Settings] Settings loaded successfully');
      setFormData(settings);
    } catch (error) {
      console.error('[Settings] Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (saveInProgress.current) {
      console.log('[Settings] Save already in progress, ignoring');
      toast.warning('Please wait, saving in progress...');
      return;
    }
    
    if (!user?.id) {
      toast.error('You must be signed in to save settings');
      return;
    }
    
    console.log('[Settings] Starting save operation');
    saveInProgress.current = true;
    setSaving(true);
    
    try {
      await saveSettings(user.id, formData, queueChange);
      console.log('[Settings] Save completed successfully');
      toast.success('Company settings saved successfully');
    } catch (error) {
      console.error('[Settings] Save failed:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
      saveInProgress.current = false;
      console.log('[Settings] Save operation finished');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearAllData = async () => {
    try {
      // Clear database data
      await clearDatabaseData(user?.id);
      
      // Clear local storage
      await clearAllData();
      
      if (clearCompanyInfo) {
        await saveSettings(user?.id, {
          name: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          phone: '',
          email: '',
          website: '',
          license: '',
          insurance: '',
          logoDisplayOption: 'both',
          terms: 'Payment due within 30 days. Thank you for your business!',
        }, queueChange);
        toast.success('All data and company information cleared from database and local cache.');
      } else {
        toast.success('All data cleared from database and local cache. Company settings preserved.');
      }
      
      // Dispatch data refresh events
      dispatchDataRefresh('customers-changed');
      dispatchDataRefresh('items-changed');
      dispatchDataRefresh('quotes-changed');
      
      // Reload the page to refresh state
      window.location.reload();
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Failed to clear data. Please try again.');
    }
  };

  const handleImportSampleData = async () => {
    if (!user?.id) {
      toast.error('You must be signed in to import data');
      return;
    }

    pauseSync(); // Pause sync during import
    setImporting(true);
    setImportResult(null);

    const timeoutId = setTimeout(() => {
      toast.error('Import is taking too long. Please refresh the page.');
      setImporting(false);
    }, 30000);

    try {
      // Load CSV files
      toast.loading('Loading CSV files...');
      const customersCSV = await loadSampleDataFile('customers.csv');
      const itemsCSV = await loadSampleDataFile('items.csv');
      const quotesCSV = await loadSampleDataFile('quotes.csv');
      const settingsCSV = await loadSampleDataFile('company-settings.csv');

      // Validate CSVs first
      const itemsValidation = validateItemsCSV(itemsCSV);
      const quotesValidation = validateQuotesCSV(quotesCSV);
      
      if (!itemsValidation.valid || !quotesValidation.valid) {
        const allErrors = [...itemsValidation.errors, ...quotesValidation.errors];
        toast.error(`Validation failed: ${allErrors[0]}`);
        setImportResult({
          success: 0,
          failed: allErrors.length,
          skipped: 0,
          errors: allErrors
        });
        return;
      }

      // Import data with progress feedback
      toast.loading('Importing customers...');
      const customersResult = await importCustomersFromCSV(customersCSV, user.id);
      
      toast.loading('Importing items...');
      const itemsResult = await importItemsFromCSV(itemsCSV, user.id);
      
      toast.loading('Importing quotes...');
      const quotesResult = await importQuotesFromCSV(quotesCSV, user.id);
      
      toast.loading('Importing company settings...');
      await importCompanySettingsFromCSV(settingsCSV, user.id);

      // Reload settings
      await loadSettings();

      // Clear localStorage cache after successful import
      localStorage.removeItem('customers-cache');
      localStorage.removeItem('items-cache');
      localStorage.removeItem('quotes-cache');

      // Dispatch refresh events
      dispatchDataRefresh('customers-changed');
      dispatchDataRefresh('items-changed');
      dispatchDataRefresh('quotes-changed');

      const totalSuccess = customersResult.success + itemsResult.success + quotesResult.success;
      const totalFailed = customersResult.failed + itemsResult.failed + quotesResult.failed;
      const totalSkipped = customersResult.skipped + itemsResult.skipped + quotesResult.skipped;

      setImportResult({
        success: totalSuccess,
        failed: totalFailed,
        skipped: totalSkipped,
        errors: [...customersResult.errors, ...itemsResult.errors, ...quotesResult.errors]
      });

      if (totalFailed > 0) {
        toast.warning(`Import completed with errors. ${totalSuccess} imported, ${totalSkipped} skipped, ${totalFailed} failed. Check details below.`);
      } else if (totalSkipped > 0) {
        toast.success(`Imported ${totalSuccess} records (${customersResult.success} customers, ${itemsResult.success} items, ${quotesResult.success} quotes), skipped ${totalSkipped} duplicates.`);
      } else {
        toast.success(`Successfully imported ${totalSuccess} records (${customersResult.success} customers, ${itemsResult.success} items, ${quotesResult.success} quotes)!`);
      }
    } catch (error) {
      console.error('Import error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to import sample data: ${errorMsg}`);
    } finally {
      clearTimeout(timeoutId);
      setImporting(false);
      resumeSync(); // Resume sync after import completes
      window.location.reload();
    }
  };

  const handleClearAndImport = async () => {
    if (!user?.id) {
      toast.error('You must be signed in');
      return;
    }

    pauseSync(); // Pause sync during clear and import
    setImporting(true);

    const timeoutId = setTimeout(() => {
      toast.error('Import is taking too long. The page will reload in 3 seconds.');
      setTimeout(() => window.location.reload(), 3000);
    }, 30000);

    try {
      // Clear existing data
      toast.loading('Clearing database...');
      await clearDatabaseData(user.id);
      await clearAllData();

      toast.success('Database cleared. Importing sample data...');

      // Load CSV files
      const customersCSV = await loadSampleDataFile('customers.csv');
      const itemsCSV = await loadSampleDataFile('items.csv');
      const quotesCSV = await loadSampleDataFile('quotes.csv');
      const settingsCSV = await loadSampleDataFile('company-settings.csv');

      // Validate before importing
      const itemsValidation = validateItemsCSV(itemsCSV);
      const quotesValidation = validateQuotesCSV(quotesCSV);
      
      if (!itemsValidation.valid || !quotesValidation.valid) {
        const allErrors = [...itemsValidation.errors, ...quotesValidation.errors];
        toast.error(`Validation failed: ${allErrors[0]}`);
        return;
      }

      // Import with progress feedback
      toast.loading('Importing customers...');
      const customersResult = await importCustomersFromCSV(customersCSV, user.id);
      
      toast.loading('Importing items...');
      const itemsResult = await importItemsFromCSV(itemsCSV, user.id);
      
      toast.loading('Importing quotes...');
      const quotesResult = await importQuotesFromCSV(quotesCSV, user.id);
      
      toast.loading('Importing company settings...');
      await importCompanySettingsFromCSV(settingsCSV, user.id);

      // Clear localStorage cache
      localStorage.removeItem('customers-cache');
      localStorage.removeItem('items-cache');
      localStorage.removeItem('quotes-cache');
      localStorage.removeItem('sync-queue');

      // Dispatch refresh events
      dispatchDataRefresh('customers-changed');
      dispatchDataRefresh('items-changed');
      dispatchDataRefresh('quotes-changed');

      const totalSuccess = customersResult.success + itemsResult.success + quotesResult.success;
      const totalFailed = customersResult.failed + itemsResult.failed + quotesResult.failed;

      if (totalFailed > 0) {
        toast.warning(`Import completed with errors. ${totalSuccess} records imported, ${totalFailed} failed.`);
      } else {
        toast.success(`Successfully imported ${totalSuccess} records (${customersResult.success} customers, ${itemsResult.success} items, ${quotesResult.success} quotes)!`);
      }

      // Reload page to ensure fresh state
      toast.loading('Reloading page...');
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('Clear and import error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to clear and import data: ${errorMsg}`);
    } finally {
      clearTimeout(timeoutId);
      setImporting(false);
      resumeSync(); // Resume sync after operation completes
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const result = await requestPermission();
      if (result !== 'granted') {
        toast.error('Notification permission denied');
      } else {
        toast.success('Notifications enabled');
      }
    }
  };

  const handleManualSync = async () => {
    if (!user?.id) {
      toast.error('You must be signed in to sync data');
      return;
    }

    setSyncing(true);
    try {
      await checkAndMigrateData(user.id);
      toast.success('Data synced successfully to database');
    } catch (error) {
      console.error('Manual sync error:', error);
      toast.error('Failed to sync data. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!user?.id) return;
    
    try {
      await updateUserRole(user.id, newRole);
      await checkUserRole();
      toast.success(`Account tier updated to ${newRole}`);
    } catch (error) {
      console.error('Role change error:', error);
      toast.error('Failed to update account tier');
    }
  };

  const handleSubscribe = async (priceId: string) => {
    setSubscriptionLoading(priceId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        setTimeout(() => {
          refreshSubscription();
        }, 5000);
      }
    } catch (error) {
      toast.error('Failed to create checkout session');
      console.error(error);
    } finally {
      setSubscriptionLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast.error('Failed to open customer portal');
      console.error(error);
    }
  };

  const isCurrentPlan = (productId: string) => {
    return subscription?.product_id === productId;
  };

  const handleClearCache = () => {
    localStorage.removeItem('customers-cache');
    localStorage.removeItem('items-cache');
    localStorage.removeItem('quotes-cache');
    setCacheInfo({
      customers: 0,
      items: 0,
      quotes: 0,
      syncQueue: cacheInfo.syncQueue,
      failedQueue: cacheInfo.failedQueue,
    });
    toast.success('Data cache cleared successfully');
  };

  const handleClearSyncQueues = () => {
    localStorage.removeItem('sync-queue');
    localStorage.removeItem('failed-sync-queue');
    setCacheInfo({
      ...cacheInfo,
      syncQueue: 0,
      failedQueue: 0,
    });
    toast.success('Sync queues cleared successfully');
  };

  const activeOps = getActiveOperations();
  const lastSync = localStorage.getItem('last-sync-time');

  const SUBSCRIPTION_TIERS = {
    pro_monthly: {
      name: 'Pro Monthly',
      price: '$9.99/month',
      priceId: 'price_pro_monthly_placeholder',
      productId: 'prod_pro_monthly_placeholder',
      features: [
        '50 quotes per month',
        'Unlimited customers',
        'Unlimited items',
        'Basic AI features',
        'Email support',
      ],
    },
    pro_annual: {
      name: 'Pro Annual',
      price: '$99/year',
      priceId: 'price_pro_annual_placeholder',
      productId: 'prod_pro_annual_placeholder',
      features: [
        '600 quotes per year',
        'Unlimited customers',
        'Unlimited items',
        'Basic AI features',
        'Priority email support',
        'Save $20 vs monthly',
      ],
    },
    max_monthly: {
      name: 'Max AI Monthly',
      price: '$19.99/month',
      priceId: 'price_max_monthly_placeholder',
      productId: 'prod_max_monthly_placeholder',
      features: [
        'Unlimited quotes',
        'Unlimited customers',
        'Unlimited items',
        'Advanced AI features',
        'AI-powered quote generation',
        'Priority support',
      ],
    },
    max_annual: {
      name: 'Max AI Annual',
      price: '$199/year',
      priceId: 'price_max_annual_placeholder',
      productId: 'prod_max_annual_placeholder',
      features: [
        'Unlimited quotes',
        'Unlimited customers',
        'Unlimited items',
        'Advanced AI features',
        'AI-powered quote generation',
        '24/7 priority support',
        'Save $40 vs monthly',
      ],
    },
  };

  return (
    <div className="space-y-6 max-w-4xl overflow-x-hidden">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure your company information and preferences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information - Moved to Top */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
            <CardDescription>
              This information will appear on your quotes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo">Company Logo</Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
              />
              {formData.logo && (
                <div className="mt-2">
                  <img
                    src={formData.logo}
                    alt="Company Logo"
                    className="h-20 object-contain"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Logo Display on Quotes</Label>
              <RadioGroup 
                value={formData.logoDisplayOption || 'both'}
                onValueChange={(value: 'logo' | 'name' | 'both') => 
                  setFormData({ ...formData, logoDisplayOption: value })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="logo" id="logo-only" />
                  <Label htmlFor="logo-only" className="font-normal cursor-pointer">Logo only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="name" id="name-only" />
                  <Label htmlFor="name-only" className="font-normal cursor-pointer">Company name only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both" className="font-normal cursor-pointer">Both logo and name</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Proposal Template</Label>
              <RadioGroup 
                value={formData.proposalTemplate || 'classic'}
                onValueChange={(value: 'classic' | 'modern' | 'detailed') => 
                  setFormData({ ...formData, proposalTemplate: value })
                }
              >
                <div className="flex items-start space-x-3 p-3 border rounded hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="classic" id="classic" />
                  <div className="flex-1">
                    <Label htmlFor="classic" className="font-semibold cursor-pointer">Classic</Label>
                    <p className="text-xs text-muted-foreground mt-1">Simple, professional layout. Best for straightforward quotes.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 border rounded hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="modern" id="modern" />
                  <div className="flex-1">
                    <Label htmlFor="modern" className="font-semibold cursor-pointer">Modern</Label>
                    <p className="text-xs text-muted-foreground mt-1">Clean, minimal design with pricing details. Great for transparency.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 border rounded hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="detailed" id="detailed" />
                  <div className="flex-1">
                    <Label htmlFor="detailed" className="font-semibold cursor-pointer">Detailed</Label>
                    <p className="text-xs text-muted-foreground mt-1">Comprehensive layout with itemized pricing and categories. Best for complex projects.</p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your Company Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Business St"
              />
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">Zip Code</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  placeholder="ZIP"
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.yourcompany.com"
              />
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="license">License Number</Label>
                <Input
                  id="license"
                  value={formData.license}
                  onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                  placeholder="License #"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance">Insurance Policy</Label>
                <Input
                  id="insurance"
                  value={formData.insurance}
                  onChange={(e) => setFormData({ ...formData, insurance: e.target.value })}
                  placeholder="Insurance Policy #"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms">Default Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                placeholder="Payment terms, conditions, etc."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how the app looks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Theme Mode</Label>
              <Select value={themeMode} onValueChange={setThemeMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      <span>Light</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      <span>Dark</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="auto">
                    <div className="flex items-center gap-2">
                      <Sunset className="h-4 w-4" />
                      <span>Auto (Based on time of day)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Auto mode switches to dark from 6 PM to 6 AM
              </p>
            </div>
          </CardContent>
        </Card>

        {isSupported && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Get notified when follow-ups are due
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications for quote follow-ups
                  </p>
                </div>
                <Switch
                  checked={permission === 'granted'}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>
              {permission === 'denied' && (
                <p className="text-xs text-warning">
                  Notifications are blocked. Please enable them in your browser settings.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Data Sync
            </CardTitle>
            <CardDescription>
              Manually sync your local data to the database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Use this to force sync all local data (customers, items, quotes, and settings) to the database. This ensures your data is accessible across all your devices.
              </p>
              <Button 
                onClick={handleManualSync} 
                disabled={syncing || !user}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Data Now'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Management
            </CardTitle>
            <CardDescription>
              Manage your subscription and billing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {subscription?.subscribed && (
              <div className="rounded-lg border-2 border-primary p-4 space-y-3">
                <h4 className="font-semibold text-sm">Current Subscription</h4>
                <p className="text-sm text-muted-foreground">
                  Your subscription is active
                  {subscription.subscription_end && 
                    ` until ${new Date(subscription.subscription_end).toLocaleDateString()}`
                  }
                </p>
                <Button onClick={handleManageSubscription} variant="outline" size="sm">
                  Manage Subscription
                </Button>
              </div>
            )}

            <Collapsible open={subscriptionOpen} onOpenChange={setSubscriptionOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>View Subscription Tiers</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${subscriptionOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => {
                    const isActive = isCurrentPlan(tier.productId);
                    const isLoading = subscriptionLoading === tier.priceId;

                    return (
                      <div key={key} className={`rounded-lg border-2 p-4 space-y-3 ${isActive ? 'border-primary bg-primary/5' : 'border-border'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {key.includes('max') ? (
                              <Sparkles className="h-4 w-4 text-primary" />
                            ) : (
                              <Zap className="h-4 w-4 text-primary" />
                            )}
                            <h4 className="font-semibold text-sm">{tier.name}</h4>
                          </div>
                          {isActive && (
                            <Badge variant="default" className="text-xs">Your Plan</Badge>
                          )}
                        </div>
                        <p className="text-lg font-bold">{tier.price}</p>
                        <ul className="space-y-1.5">
                          {tier.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2 text-xs">
                              <Check className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleSubscribe(tier.priceId)}
                          disabled={isActive || isLoading}
                          variant={isActive ? 'secondary' : 'default'}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Loading...
                            </>
                          ) : isActive ? (
                            'Current Plan'
                          ) : (
                            'Subscribe'
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Button variant="outline" onClick={refreshSubscription} size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Subscription Status
            </Button>
          </CardContent>
        </Card>

        {/* System Diagnostics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Diagnostics
            </CardTitle>
            <CardDescription>
              Monitor system health and performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Overview */}
            <div className="grid gap-3 grid-cols-3">
              <div className="rounded-lg border p-3 space-y-1">
                <p className="text-xs text-muted-foreground">Connection</p>
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm font-bold">Online</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-bold">Offline</span>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-lg border p-3 space-y-1">
                <p className="text-xs text-muted-foreground">Sync</p>
                <div className="flex items-center gap-2">
                  {isSyncing ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm font-bold">Syncing</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm font-bold">Idle</span>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-lg border p-3 space-y-1">
                <p className="text-xs text-muted-foreground">Auth</p>
                <div className="flex items-center gap-2">
                  {user ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm font-bold">Active</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-warning" />
                      <span className="text-sm font-bold">Guest</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Sync Queue */}
            <Collapsible>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-3 hover:bg-accent">
                <span className="text-sm font-medium">Sync Queue Details</span>
                <ChevronDown className="h-4 w-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-3">
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pending Changes</span>
                    <Badge variant={pendingCount > 0 ? 'default' : 'secondary'}>{pendingCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Failed Changes</span>
                    <Badge variant={failedCount > 0 ? 'destructive' : 'secondary'}>{failedCount}</Badge>
                  </div>
                  {lastSync && (
                    <p className="text-xs text-muted-foreground pt-2 border-t">
                      Last sync: {new Date(lastSync).toLocaleString()}
                    </p>
                  )}
                  {(pendingCount > 0 || failedCount > 0) && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full mt-2"
                      onClick={handleClearSyncQueues}
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      Clear Sync Queues
                    </Button>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Cache Status */}
            <Collapsible>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-3 hover:bg-accent">
                <span className="text-sm font-medium">Cache Status</span>
                <ChevronDown className="h-4 w-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-3">
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Customers Cache</span>
                    <Badge variant="outline" className="text-xs">{(cacheInfo.customers / 1024).toFixed(2)} KB</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Items Cache</span>
                    <Badge variant="outline" className="text-xs">{(cacheInfo.items / 1024).toFixed(2)} KB</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Quotes Cache</span>
                    <Badge variant="outline" className="text-xs">{(cacheInfo.quotes / 1024).toFixed(2)} KB</Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full mt-2"
                    onClick={handleClearCache}
                  >
                    <Database className="mr-2 h-3 w-3" />
                    Clear Data Cache
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Active Operations */}
            {activeOps.length > 0 && (
              <div className="rounded-lg border p-3 space-y-2">
                <p className="text-sm font-medium">Active Operations</p>
                {activeOps.map((op) => (
                  <div key={op.id} className="flex items-center justify-between text-xs p-2 bg-accent rounded">
                    <span>{op.description}</span>
                    <Badge variant="outline" className="text-xs">
                      {(op.elapsed / 1000).toFixed(1)}s
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sample Data Management - Public Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5" />
              Sample Data Management
            </CardTitle>
            <CardDescription>
              Import pre-made sample data for testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Import sample customers, items, and company settings for field service businesses (plumbers, electricians, handymen, home rehab).
            </p>
            
            <Button 
              onClick={handleImportSampleData} 
              disabled={importing || !user}
              variant="outline"
              className="w-full"
            >
              <Upload className={`mr-2 h-4 w-4 ${importing ? 'animate-pulse' : ''}`} />
              {importing ? 'Importing...' : 'Import Sample Data'}
            </Button>

            {importResult && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Import Results</AlertTitle>
                <AlertDescription>
                  Successfully imported {importResult.success} records.
                  {importResult.skipped > 0 && ` ${importResult.skipped} duplicates skipped.`}
                  {importResult.failed > 0 && ` ${importResult.failed} records failed.`}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Admin Controls - Only visible to admin users */}
      {isAdmin && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Admin Controls
            </CardTitle>
            <CardDescription>
              Administrative tools for testing and managing accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Role Management Section */}
            <div className="space-y-3">
              <Label>AI Account Tier</Label>
              <Select value={userRole || 'free'} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free Tier</SelectItem>
                  <SelectItem value="pro">Pro Tier</SelectItem>
                  <SelectItem value="max">Max Tier</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Change your AI account tier for testing features
              </p>
            </div>

            <Separator />

            {/* Clear & Import Sample Data - Admin Only */}
            <div className="space-y-3">
              <div>
                <Label>Clear Database & Import Sample Data</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Delete all data and import fresh sample data (Admin only)
                </p>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    disabled={importing || !user}
                    variant="secondary"
                    className="w-full"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Database & Import Sample Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All Data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete all customers, items, and quotes from the database, then import fresh sample data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAndImport}>
                      Clear & Import
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone - Moved to Bottom */}
      <Collapsible open={dangerZoneOpen} onOpenChange={setDangerZoneOpen}>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CollapsibleTrigger className="flex w-full items-center justify-between [&[data-state=open]>svg]:rotate-180">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </div>
              <ChevronDown className="h-5 w-5 text-destructive transition-transform duration-200" />
            </CollapsibleTrigger>
            <CardDescription>
              Irreversible actions that permanently delete your data
            </CardDescription>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-destructive/20 bg-background p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <h4 className="font-semibold text-sm">Clear All Application Data</h4>
                    <p className="text-sm text-muted-foreground">
                      This will permanently delete:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                      <li>All customers and their information</li>
                      <li>All items and pricing</li>
                      <li>All quotes and their history</li>
                      <li>All local cache data</li>
                    </ul>
                    <p className="text-sm font-medium text-destructive">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full" onClick={() => setConfirmText('')}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear All Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all customers, items, and quotes from your application.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="confirm-text">
                          Type <span className="font-mono font-bold">DELETE ALL</span> to confirm
                        </Label>
                        <Input
                          id="confirm-text"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          placeholder="DELETE ALL"
                          className="font-mono"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="clear-company"
                          checked={clearCompanyInfo}
                          onCheckedChange={setClearCompanyInfo}
                        />
                        <Label htmlFor="clear-company" className="cursor-pointer text-sm">
                          Also clear company information and settings
                        </Label>
                      </div>
                    </div>
                    
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => {
                        setClearCompanyInfo(false);
                        setConfirmText('');
                      }}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleClearAllData} 
                        disabled={confirmText !== 'DELETE ALL'}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Yes, clear {clearCompanyInfo ? 'all data' : 'data'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

    </div>
  );
}
