import { useEffect, useState } from 'react';
import { Building2, Save, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { getSettings, saveSettings, clearAllData } from '@/lib/storage';
import { CompanySettings } from '@/types';
import { toast } from 'sonner';
import { generateSampleData } from '@/lib/sample-data';

export default function Settings() {
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
    const settings = getSettings();
    setFormData(settings);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(formData);
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

  const handleGenerateSampleData = () => {
    const result = generateSampleData();
    toast.success(`Generated ${result.customersAdded} customers, ${result.itemsAdded} items, and ${result.quotesAdded} quotes`);
  };

  const handleClearAllData = () => {
    clearAllData();
    toast.success('All data cleared successfully');
    window.location.reload(); // Refresh to show empty state
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Configure your company information and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateSampleData}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Sample Data
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all customers, items, and quotes from your application. Your company settings will be preserved.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAllData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, clear all data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="grid gap-4 md:grid-cols-3">
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

            <div className="grid gap-4 md:grid-cols-2">
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

            <div className="grid gap-4 md:grid-cols-2">
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
    </div>
  );
}
