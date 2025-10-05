import { useEffect, useState } from 'react';
import { Building2, Save, Trash2, Bell, Sun, Moon, Sunset, AlertTriangle, ChevronDown, RefreshCw, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { getSettings, saveSettings } from '@/lib/db-service';
import { clearAllData } from '@/lib/storage';
import { CompanySettings } from '@/types';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncManager } from '@/hooks/useSyncManager';
import { checkAndMigrateData } from '@/lib/migration-helper';
import { generateSampleData } from '@/lib/sample-data';
import { Separator } from '@/components/ui/separator';

export default function Settings() {
  const { permission, requestPermission, isSupported } = useNotifications();
  const { themeMode, setThemeMode } = useTheme();
  const { user, userRole, isAdmin, updateUserRole, checkUserRole } = useAuth();
  const { queueChange } = useSyncManager();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [clearCompanyInfo, setClearCompanyInfo] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [dangerZoneOpen, setDangerZoneOpen] = useState(false);
  const [generatingSample, setGeneratingSample] = useState(false);
  const [includeCompanySettings, setIncludeCompanySettings] = useState(true);
  const [sampleDataResult, setSampleDataResult] = useState<any>(null);
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

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    setLoading(true);
    const settings = await getSettings(user?.id);
    setFormData(settings);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings(user?.id, formData, queueChange);
    toast.success('Company settings saved successfully');
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
    clearAllData();
    
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
      toast.success('All data and company information cleared.');
    } else {
      toast.success('All data cleared from local cache. Company settings preserved.');
    }
    
    window.location.reload();
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

  const handleGenerateSampleData = async () => {
    setGeneratingSample(true);
    setSampleDataResult(null);
    
    try {
      const result = await generateSampleData(user?.id, includeCompanySettings);
      
      if (includeCompanySettings) {
        await loadSettings();
      }
      
      setSampleDataResult(result);
      toast.success('Sample data generated successfully!');
    } catch (error) {
      console.error('Error generating sample data:', error);
      toast.error('Failed to generate sample data');
    } finally {
      setGeneratingSample(false);
    }
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

        <div className="flex justify-end">
          <Button type="submit" size="lg">
            <Save className="mr-2 h-5 w-5" />
            Save Settings
          </Button>
        </div>
      </form>

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

      {/* Admin Controls - Only visible to admin users */}
      {isAdmin && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Admin Controls
            </CardTitle>
            <CardDescription>
              Administrative tools for testing and managing user accounts
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

            {/* Sample Data Generation Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Generate Sample Data</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Populate all fields with realistic test data for screenshots and testing
                  </p>
                </div>
                <Button 
                  onClick={handleGenerateSampleData} 
                  disabled={generatingSample}
                  variant="outline"
                >
                  <Sparkles className={`mr-2 h-4 w-4 ${generatingSample ? 'animate-pulse' : ''}`} />
                  {generatingSample ? 'Generating...' : 'Generate Data'}
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="include-company"
                  checked={includeCompanySettings}
                  onCheckedChange={setIncludeCompanySettings}
                />
                <Label htmlFor="include-company" className="cursor-pointer text-sm">
                  Include sample company information
                </Label>
              </div>

              {sampleDataResult && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-medium text-primary mb-2">
                    ✓ Sample data generated successfully!
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• {sampleDataResult.customersAdded} customers added</li>
                    <li>• {sampleDataResult.itemsAdded} items added</li>
                    <li>• {sampleDataResult.quotesAdded} quotes added</li>
                    {sampleDataResult.companySettingsAdded && (
                      <li>• Company information populated</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
