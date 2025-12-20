import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ChevronDown, RefreshCw, Shield, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { saveSettings, clearDatabaseData, clearSampleData } from "@/lib/db-service";
import { clearAllData } from "@/lib/storage";
import {
  importCustomersFromCSV,
  importItemsFromCSV,
  importQuotesFromCSV,
  importCompanySettingsFromCSV,
  loadSampleDataFile,
  validateItemsCSV,
  validateQuotesCSV,
} from "@/lib/import-export-utils";
import { CompanySettings } from "@/types";
import { toast } from "sonner";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useSyncManager } from "@/hooks/useSyncManager";
import { checkAndMigrateData } from "@/lib/migration-helper";
import { dispatchDataRefresh } from "@/hooks/useDataRefresh";
import { supabase } from "@/integrations/supabase/client";

import { CompanyInfoSection } from "@/components/settings/CompanyInfoSection";
import { BrandingSection } from "@/components/settings/BrandingSection";
import { TermsSection } from "@/components/settings/TermsSection";
import { NotificationPreferencesSection } from "@/components/settings/NotificationPreferencesSection";
import { DataManagementSection } from "@/components/settings/DataManagementSection";
import { AccountSection } from "@/components/settings/AccountSection";
import { AppearanceSection } from "@/components/settings/AppearanceSection";
import { IntegrationsSection } from "@/components/settings/IntegrationsSection";
import { ProposalThemeSelector } from "@/components/settings/ProposalThemeSelector";
import { VisualsDefaultsSection } from "@/components/settings/VisualsDefaultsSection";
import { CacheManagementSection } from '@/components/settings/CacheManagementSection';
import { PerformanceDashboard } from '@/components/PerformanceDashboard';
import { VisualRule } from "@/types";

// Helper to safely parse visual rules from JSON or object
const parseVisualRules = (rules: any): VisualRule[] => {
  if (!rules) return [];
  if (Array.isArray(rules)) return rules; // Already an object (Supabase JSONB auto-parsing)
  try {
    return JSON.parse(rules); // Stringified JSON
  } catch (e) {
    console.error("Failed to parse visual rules:", e);
    return [];
  }
};

export default function Settings() {
  const navigate = useNavigate();
  const { themeMode } = useTheme();
  const { user, userRole, isAdmin, isMaxAITier, updateUserRole, checkUserRole, subscription, refreshSubscription } = useAuth();
  const { queueChange, pauseSync, resumeSync, isOnline, isSyncing, pendingCount, failedCount } = useSyncManager();

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [clearingSampleData, setClearingSampleData] = useState(false);
  const [dangerZoneOpen, setDangerZoneOpen] = useState(false);

  const [settings, setSettings] = useState<CompanySettings>({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    email: "",
    website: "",
    industry: "other",
    license: "",
    insurance: "",
    logoDisplayOption: "both",
    terms: "",
    proposalTemplate: "classic",
    notifyEmailAccepted: true,
    notifyEmailDeclined: true,
  });

  const loadSettings = useCallback(async () => {
    if (!user?.id) {
      console.log('[Settings] No user ID, skipping settings load');
      return;
    }

    console.log('[Settings] ========== LOADING SETTINGS ==========');
    console.log('[Settings] Loading settings for user:', user.id);
    setLoading(true);

    try {
      // CRITICAL: Load from Supabase FIRST to get most up-to-date data
      console.log('[Settings] Fetching from Supabase...');
      const { data: supabaseSettings, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[Settings] Supabase fetch error:', error);
        throw error;
      }

      if (supabaseSettings) {
        const sSettings = supabaseSettings as any;
        console.log('[Settings] ✓ Loaded settings from Supabase:', {
          name: sSettings.name,
          email: sSettings.email,
          phone: sSettings.phone,
          address: sSettings.address,
          industry: sSettings.industry,
          termsLength: sSettings.terms?.length || 0,
          hasLogo: !!sSettings.logo
        });

        // Convert database format to app format
        const loadedSettings: CompanySettings = {
          name: sSettings.name || "",
          address: sSettings.address || "",
          city: sSettings.city || "",
          state: sSettings.state || "",
          zip: sSettings.zip || "",
          phone: sSettings.phone || "",
          email: sSettings.email || "",
          website: sSettings.website || "",
          logo: sSettings.logo || undefined,
          logoDisplayOption: (sSettings.logo_display_option as any) || 'both',
          industry: (sSettings.industry as any) || "other",
          license: sSettings.license || "",
          insurance: sSettings.insurance || "",
          terms: sSettings.terms || "",
          proposalTemplate: (sSettings.proposal_template as any) || 'classic',
          proposalTheme: (sSettings.proposal_theme as any) || 'modern-corporate',
          notifyEmailAccepted: sSettings.notify_email_accepted ?? true,
          notifyEmailDeclined: sSettings.notify_email_declined ?? true,
          showProposalImages: sSettings.show_proposal_images ?? true,
          defaultCoverImage: sSettings.default_cover_image || undefined,
          defaultHeaderImage: sSettings.default_header_image || undefined,
          visualRules: sSettings.visual_rules ? parseVisualRules(sSettings.visual_rules) : [],
          onboardingCompleted: sSettings.onboarding_completed ?? false,
        };

        setSettings(loadedSettings);
        console.log('[Settings] ✓ Settings state updated');
      } else {
        console.log('[Settings] No settings found in Supabase, using defaults');
        // Keep default empty settings
      }

      console.log('[Settings] ========== SETTINGS LOAD COMPLETE ==========');
    } catch (error) {
      console.error("[Settings] Failed to load settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleUpdateSettings = async (updates: Partial<CompanySettings>) => {
    if (!user?.id) {
      toast.error("You must be signed in to update settings");
      return;
    }

    console.log('[Settings] ========== UPDATING SETTINGS ==========');
    console.log('[Settings] Update request:', updates);
    console.log('[Settings] Current settings state:', {
      name: settings.name,
      email: settings.email,
      phone: settings.phone,
      address: settings.address
    });

    try {
      const updatedSettings = { ...settings, ...updates };
      console.log('[Settings] Merged settings:', {
        name: updatedSettings.name,
        email: updatedSettings.email,
        phone: updatedSettings.phone,
        address: updatedSettings.address,
        termsLength: updatedSettings.terms?.length || 0
      });

      // Save settings with sync queue
      await saveSettings(user.id, updatedSettings, queueChange as any);

      // Update local state
      setSettings(updatedSettings);

      toast.success("Settings updated successfully");
      console.log('[Settings] ✓ Settings updated successfully');
      console.log('[Settings] ========== UPDATE COMPLETE ==========');
    } catch (error) {
      console.error("[Settings] Update failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update settings";
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleManualSync = async () => {
    if (!user?.id) {
      toast.error("You must be signed in to sync data");
      return;
    }

    setSyncing(true);
    try {
      await checkAndMigrateData(user.id);
      toast.success("Data synced successfully to database");
    } catch (error) {
      console.error("Manual sync error:", error);
      toast.error("Failed to sync data. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const handleClearSampleData = async () => {
    if (!user) return;

    setClearingSampleData(true);

    try {
      await clearSampleData(user.id);
      toast.success("Sample data cleared successfully! Your company settings remain intact.");

      dispatchDataRefresh("customers-changed");
      dispatchDataRefresh("items-changed");
      dispatchDataRefresh("quotes-changed");
    } catch (error) {
      console.error("Error clearing sample data:", error);
      toast.error("Failed to clear sample data");
    } finally {
      setClearingSampleData(false);
    }
  };

  const handleImportSampleData = async () => {
    if (!user?.id) {
      toast.error("You must be signed in to import data");
      return;
    }

    pauseSync();
    setImporting(true);

    const timeoutId = setTimeout(() => {
      toast.error("Import is taking too long. Please refresh the page.");
      setImporting(false);
    }, 30000);

    try {
      toast.loading("Loading CSV files...");
      const customersCSV = await loadSampleDataFile("customers.csv");
      const itemsCSV = await loadSampleDataFile("items.csv");
      const quotesCSV = await loadSampleDataFile("quotes.csv");
      const settingsCSV = await loadSampleDataFile("company-settings.csv");

      const itemsValidation = validateItemsCSV(itemsCSV);
      const quotesValidation = validateQuotesCSV(quotesCSV);

      if (!itemsValidation.valid || !quotesValidation.valid) {
        const allErrors = [...itemsValidation.errors, ...quotesValidation.errors];
        toast.error(`Validation failed: ${allErrors[0]}`);
        return;
      }

      toast.loading("Importing customers...");
      const customersResult = await importCustomersFromCSV(customersCSV, user.id);

      toast.loading("Importing items...");
      const itemsResult = await importItemsFromCSV(itemsCSV, user.id);

      toast.loading("Importing quotes...");
      const quotesResult = await importQuotesFromCSV(quotesCSV, user.id);

      toast.loading("Importing company settings...");
      await importCompanySettingsFromCSV(settingsCSV, user.id);

      await loadSettings();

      dispatchDataRefresh("customers-changed");
      dispatchDataRefresh("items-changed");
      dispatchDataRefresh("quotes-changed");

      const totalSuccess = customersResult.success + itemsResult.success + quotesResult.success;
      const totalFailed = customersResult.failed + itemsResult.failed + quotesResult.failed;
      const totalSkipped = customersResult.skipped + itemsResult.skipped + quotesResult.skipped;

      if (totalFailed > 0) {
        toast.warning(`Import completed with errors. ${totalSuccess} imported, ${totalSkipped} skipped, ${totalFailed} failed.`);
      } else if (totalSkipped > 0) {
        toast.success(`Imported ${totalSuccess} records, skipped ${totalSkipped} duplicates.`);
      } else {
        toast.success(`Successfully imported ${totalSuccess} records!`);
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error(`Failed to import sample data: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      clearTimeout(timeoutId);
      setImporting(false);
      resumeSync();
      window.location.reload();
    }
  };

  const handleClearAndImport = async () => {
    if (!user?.id) {
      toast.error("You must be signed in");
      return;
    }

    pauseSync();
    setImporting(true);

    try {
      toast.loading("Clearing database...");
      await clearDatabaseData(user.id);
      await clearAllData();

      toast.success("Database cleared. Importing sample data...");

      const customersCSV = await loadSampleDataFile("customers.csv");
      const itemsCSV = await loadSampleDataFile("items.csv");
      const quotesCSV = await loadSampleDataFile("quotes.csv");
      const settingsCSV = await loadSampleDataFile("company-settings.csv");

      const itemsValidation = validateItemsCSV(itemsCSV);
      const quotesValidation = validateQuotesCSV(quotesCSV);

      if (!itemsValidation.valid || !quotesValidation.valid) {
        const allErrors = [...itemsValidation.errors, ...quotesValidation.errors];
        toast.error(`Validation failed: ${allErrors[0]}`);
        return;
      }

      toast.loading("Importing customers...");
      const customersResult = await importCustomersFromCSV(customersCSV, user.id);

      toast.loading("Importing items...");
      const itemsResult = await importItemsFromCSV(itemsCSV, user.id);

      toast.loading("Importing quotes...");
      const quotesResult = await importQuotesFromCSV(quotesCSV, user.id);

      toast.loading("Importing company settings...");
      await importCompanySettingsFromCSV(settingsCSV, user.id);

      localStorage.removeItem("sync-queue");

      dispatchDataRefresh("customers-changed");
      dispatchDataRefresh("items-changed");
      dispatchDataRefresh("quotes-changed");

      const totalSuccess = customersResult.success + itemsResult.success + quotesResult.success;
      const totalFailed = customersResult.failed + itemsResult.failed + quotesResult.failed;

      if (totalFailed > 0) {
        toast.warning(`Import completed with errors. ${totalSuccess} records imported, ${totalFailed} failed.`);
      } else {
        toast.success(`Successfully imported ${totalSuccess} records!`);
      }

      toast.loading("Reloading page...");
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error("Clear and import error:", error);
      toast.error(`Failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setImporting(false);
      resumeSync();
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!user?.id) return;

    try {
      await updateUserRole(user.id, newRole);
      await checkUserRole();
      toast.success(`Account tier updated to ${newRole}`);
    } catch (error) {
      console.error("Role change error:", error);
      toast.error("Failed to update account tier");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl overflow-x-hidden">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure your company information and preferences
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* COMPANY TAB */}
        <TabsContent value="company" className="space-y-6">
          <BrandingSection
            settings={settings}
            onUpdate={handleUpdateSettings}
          />

          <CompanyInfoSection
            settings={settings}
            onUpdate={handleUpdateSettings}
          />

          <NotificationPreferencesSection
            settings={settings as any}
            onUpdate={handleUpdateSettings as any}
          />

          <AccountSection />
        </TabsContent>

        {/* PROPOSALS TAB */}
        <TabsContent value="proposals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Proposal Settings</CardTitle>
              <CardDescription>
                Configure your proposal templates and terms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ProposalThemeSelector settings={settings} onUpdate={handleUpdateSettings} />
              <Separator />
              <TermsSection settings={settings} onUpdate={handleUpdateSettings} />
            </CardContent>
          </Card>

          <VisualsDefaultsSection
            settings={settings}
            onUpdate={handleUpdateSettings}
          />

          <AppearanceSection />
        </TabsContent>

        {/* INTEGRATIONS TAB */}
        <TabsContent value="integrations" className="space-y-6">
          <IntegrationsSection />
        </TabsContent>

        {/* SYSTEM TAB */}
        <TabsContent value="system" className="space-y-6">
          <DataManagementSection />

          {isAdmin && (
            <>
              <CacheManagementSection />

              <PerformanceDashboard />
            </>
          )}

          {isAdmin && (
            <>
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
                      Force sync all local data to the database for cross-device access.
                    </p>
                    <Button
                      onClick={handleManualSync}
                      disabled={syncing || !user}
                      variant="outline"
                      className="w-full"
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                      {syncing ? "Syncing..." : "Sync Data Now"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    System Status
                  </CardTitle>
                  <CardDescription>
                    Monitor connection and sync status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 grid-cols-3">
                    <div className="rounded-lg border p-3 space-y-1">
                      <p className="text-xs text-muted-foreground">Connection</p>
                      <p className="text-sm font-bold">{isOnline ? "Online" : "Offline"}</p>
                    </div>

                    <div className="rounded-lg border p-3 space-y-1">
                      <p className="text-xs text-muted-foreground">Sync Status</p>
                      <p className="text-sm font-bold">{isSyncing ? "Syncing" : "Idle"}</p>
                    </div>

                    <div className="rounded-lg border p-3 space-y-1">
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <Badge variant={pendingCount > 0 ? "default" : "secondary"}>{pendingCount}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

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
                <div className="space-y-3">
                  <Label>AI Account Tier</Label>
                  <Select value={userRole || "free"} onValueChange={handleRoleChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free Tier</SelectItem>
                      <SelectItem value="pro">Pro Tier</SelectItem>
                      <SelectItem value="max">Max Tier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Sample Data Management</Label>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleImportSampleData}
                      disabled={importing || !user}
                      variant="outline"
                      className="flex-1"
                    >
                      {importing ? "Importing..." : "Import Sample Data"}
                    </Button>

                    <Button
                      onClick={handleClearSampleData}
                      disabled={clearingSampleData || !user}
                      variant="outline"
                      className="flex-1"
                    >
                      {clearingSampleData ? "Clearing..." : "Clear Sample Data"}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Clear Database & Import</Label>
                  <Button
                    onClick={handleClearAndImport}
                    disabled={importing || !user}
                    variant="secondary"
                    className="w-full"
                  >
                    Clear Database & Import Sample Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Collapsible open={dangerZoneOpen} onOpenChange={setDangerZoneOpen}>
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader>
                <CollapsibleTrigger className="flex w-full items-center justify-between">
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
                <CardContent>
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Critical operations are available through the Data Management section above.
                      Contact support if you need to permanently delete your account.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </TabsContent>
      </Tabs>
    </div>
  );
}