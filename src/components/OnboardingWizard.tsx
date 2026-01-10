import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CheckCircle2, Building, Upload, FileText, Palette } from "lucide-react";
import { getSettings, saveSettings } from "@/lib/db-service";
import { SettingsDB, isIndexedDBSupported } from "@/lib/indexed-db";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLocation } from "react-router-dom";
import { SUPPORTED_INDUSTRIES, Industry } from "@/lib/proposal-image-library";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createFreshSupabaseClient } from "@/integrations/supabase/client";
import { useMemo } from "react";

interface CompanyData {
  name: string;
  email: string;
  phone: string;
  address: string;
  industry: Industry;
  logo?: string;
}

interface BrandingData {
  primaryColor: string;
  accentColor: string;
}

const WelcomeStep = () => (
  <div className="text-center space-y-4 py-8">
    <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
    <h3 className="text-2xl font-bold">Welcome to Quote.it AI!</h3>
    <p className="text-muted-foreground max-w-md mx-auto">
      Let's get you set up in just a few minutes. We'll help you configure your company information and get started with your first quote.
    </p>
  </div>
);

interface CompanyInfoStepProps {
  data: CompanyData;
  onChange: (data: CompanyData) => void;
}

const CompanyInfoStep = ({ data, onChange }: CompanyInfoStepProps) => (
  <div className="space-y-4 py-4">
    <div className="flex items-center gap-2 mb-4">
      <Building className="h-5 w-5 text-primary" />
      <h4 className="font-semibold">Company Information</h4>
    </div>

    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="company-name">Company Name *</Label>
        <Input
          id="company-name"
          placeholder="Acme Corporation"
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-email">Email *</Label>
        <Input
          id="company-email"
          type="email"
          placeholder="hello@company.com"
          value={data.email}
          onChange={(e) => onChange({ ...data, email: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-phone">Phone Number</Label>
        <Input
          id="company-phone"
          type="tel"
          placeholder="+1 (555) 123-4567"
          value={data.phone}
          onChange={(e) => onChange({ ...data, phone: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-address">Business Address</Label>
        <Textarea
          id="company-address"
          placeholder="123 Main Street, Suite 100&#10;City, State 12345"
          value={data.address}
          onChange={(e) => onChange({ ...data, address: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-industry">Primary Industry</Label>
        <Select
          value={data.industry}
          onValueChange={(value) => onChange({ ...data, industry: value as Industry })}
        >
          <SelectTrigger id="company-industry">
            <SelectValue placeholder="Select industry..." />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_INDUSTRIES.map(industry => (
              <SelectItem key={industry.value} value={industry.value}>
                {industry.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
);

interface BrandingStepProps {
  data: BrandingData;
  onChange: (data: BrandingData) => void;
}

const BrandingStep = ({ data, onChange }: BrandingStepProps) => (
  <div className="space-y-4 py-4">
    <div className="flex items-center gap-2 mb-4">
      <Palette className="h-5 w-5 text-primary" />
      <h4 className="font-semibold">Brand Colors</h4>
    </div>

    <p className="text-sm text-muted-foreground mb-4">
      Choose colors that match your brand. These will appear on your quotes and proposals.
    </p>

    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="primary-color">Primary Brand Color</Label>
        <div className="flex gap-2">
          <Input
            id="primary-color"
            type="color"
            value={data.primaryColor}
            onChange={(e) => onChange({ ...data, primaryColor: e.target.value })}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={data.primaryColor}
            onChange={(e) => onChange({ ...data, primaryColor: e.target.value })}
            placeholder="#4F46E5"
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="accent-color">Accent Color</Label>
        <div className="flex gap-2">
          <Input
            id="accent-color"
            type="color"
            value={data.accentColor}
            onChange={(e) => onChange({ ...data, accentColor: e.target.value })}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={data.accentColor}
            onChange={(e) => onChange({ ...data, accentColor: e.target.value })}
            placeholder="#10B981"
            className="flex-1"
          />
        </div>
      </div>

      <div className="mt-4 p-4 border rounded-lg">
        <p className="text-sm font-medium mb-2">Preview</p>
        <div className="flex gap-2">
          <div
            className="h-12 flex-1 rounded"
            style={{ backgroundColor: data.primaryColor }}
          />
          <div
            className="h-12 flex-1 rounded"
            style={{ backgroundColor: data.accentColor }}
          />
        </div>
      </div>
    </div>
  </div>
);

interface ImportDataStepProps {
  importOption: string;
  onChange: (option: string) => void;
}

const ImportDataStep = ({ importOption, onChange }: ImportDataStepProps) => (
  <div className="space-y-4 py-4">
    <div className="flex items-center gap-2 mb-4">
      <Upload className="h-5 w-5 text-primary" />
      <h4 className="font-semibold">Getting Started</h4>
    </div>

    <p className="text-sm text-muted-foreground mb-4">
      How would you like to begin?
    </p>

    <RadioGroup value={importOption} onValueChange={onChange}>
      <div className="space-y-3">
        <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
          <RadioGroupItem value="fresh" id="fresh" />
          <div className="flex-1">
            <Label htmlFor="fresh" className="cursor-pointer font-medium">
              Start Fresh
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Begin with a clean slate. You can add customers and items as you go.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
          <RadioGroupItem value="sample" id="sample" />
          <div className="flex-1">
            <Label htmlFor="sample" className="cursor-pointer font-medium">
              Use Sample Data
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Explore with pre-populated sample customers, items, and quotes.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
          <RadioGroupItem value="import" id="import" />
          <div className="flex-1">
            <Label htmlFor="import" className="cursor-pointer font-medium">
              Import Existing Data
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Upload CSV files with your existing customers and product catalog.
            </p>
          </div>
        </div>
      </div>
    </RadioGroup>
  </div>
);

const CompletionStep = () => (
  <div className="text-center space-y-4 py-8">
    <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
    <h3 className="text-2xl font-bold">You're All Set!</h3>
    <p className="text-muted-foreground max-w-md mx-auto">
      Your account is configured and ready to go. Click finish to start creating professional quotes.
    </p>
    <div className="flex items-center justify-center gap-2 pt-4">
      <FileText className="h-5 w-5 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Ready to create your first quote</span>
    </div>
  </div>
);

export function OnboardingWizard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const { user, session, organizationId } = useAuth();
  const location = useLocation();

  // 🚀 LIBRARY ISOLATION: Create a fresh client instance just for onboarding
  const onboardingClient = useMemo(() => createFreshSupabaseClient(), []);

  // Synchronize isolated client with current session
  useEffect(() => {
    if (session) {
      onboardingClient.auth.setSession(session).catch(err =>
        console.warn('[Onboarding] Failed to sync session to isolated client:', err)
      );
    }
  }, [session, onboardingClient]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true); // Add checking state

  // CRITICAL: Check if this is a public page BEFORE any state initialization
  const path = location.pathname.toLowerCase();
  const publicPaths = ['/public-quote-view', '/auth', '/landing', '/', '/privacy-policy', '/terms-of-service', '/quotes/public'];

  // Skip logic: Public pages OR Quote Viewer pages (to prevent interruption while working)
  const isPublicPage = publicPaths.some(p =>
    path === p || path.startsWith(p + '/')
  ) || path.includes('/preview') || path.includes('/public/') || path.includes('/quotes/') || path === '/quotes';

  console.log('[OnboardingWizard] Checking visibility:', {
    pathname: location.pathname,
    pathLower: path,
    isPublicPage,
    reason: path.includes('/quotes/') ? 'Quote Page' : 'Public/Other'
  });

  // Form data
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    industry: "other",
  });

  const [brandingData, setBrandingData] = useState<BrandingData>({
    primaryColor: "#4F46E5",
    accentColor: "#10B981",
  });

  const [importOption, setImportOption] = useState("fresh");

  useEffect(() => {
    // CRITICAL: Don't run onboarding check on public pages - check FIRST before any async operations
    if (isPublicPage) {
      console.log('[OnboardingWizard] Public page detected:', location.pathname);
      setIsChecking(false);
      setIsDialogOpen(false);
      return;
    }

    // Check onboarding status when user is loaded
    const checkOnboardingStatus = async () => {
      if (!user?.id) {
        console.log('[OnboardingWizard] No user ID, setting isChecking to false');
        setIsChecking(false);
        return;
      }

      console.log("[OnboardingWizard] ========== CHECKING ONBOARDING STATUS ==========");
      console.log("[OnboardingWizard] Location:", location.pathname);
      console.log("[OnboardingWizard] User ID:", user.id);

      // SIMPLIFIED CHECK: Only check localStorage flags (no database verification)
      const localFlag = localStorage.getItem(`onboarding_completed_${user.id}`);
      const statusFlag = localStorage.getItem(`onboarding_status_${user.id}`);
      const sessionFlag = sessionStorage.getItem(`onboarding_completed_${user.id}`);

      console.log("[OnboardingWizard] Completion flags check:");
      console.log("  - localFlag:", localFlag);
      console.log("  - statusFlag:", statusFlag);
      console.log("  - sessionFlag:", sessionFlag);

      // If ANY flag is set, consider onboarding complete (no database verification)
      if (localFlag === "true" || statusFlag === "completed" || sessionFlag === "true") {
        console.log("[OnboardingWizard] ✓ Onboarding completed (flags found) - wizard will NOT show");
        setIsDialogOpen(false);
        setIsChecking(false);
        console.log("[OnboardingWizard] ========== CHECK COMPLETE: WIZARD CLOSED ==========");
        return;
      }

      // If no flags found, CHECK DATABASE before showing wizard
      try {
        console.log("[OnboardingWizard] Local flags missing. Verifying with database...");
        // Check DB settings (non-blocking verification)
        const dbSettings = await getSettings(user.id, organizationId);

        if (dbSettings && (dbSettings.onboardingCompleted || (dbSettings.name && dbSettings.email))) {
          console.log("[OnboardingWizard] ✓ Database confirms onboarding complete. Restoring local flags...");

          // Restore local flags to avoid future DB checks
          const completionKey = `onboarding_completed_${user.id}`;
          localStorage.setItem(completionKey, "true");
          localStorage.setItem(`onboarding_status_${user.id}`, "completed");
          sessionStorage.setItem(completionKey, "true");

          setIsDialogOpen(false);
          setIsChecking(false);
          return;
        }
      } catch (err) {
        console.warn("[OnboardingWizard] Failed to verify with database, defaulting to HIDE to prevent interruption:", err);
        setIsDialogOpen(false);
        setIsChecking(false);
        return;
      }

      console.log("[OnboardingWizard] No completion flags found locally or in DB - wizard WILL show");
      setIsDialogOpen(true);
      setIsChecking(false);
      console.log("[OnboardingWizard] ========== CHECK COMPLETE: WIZARD OPENING ==========");
    };

    checkOnboardingStatus();
  }, [user?.id]);

  const steps = [
    {
      title: "Welcome to Quote.it AI",
      description: "Let's get you set up in just a few minutes",
      component: <WelcomeStep />,
      canSkip: false,
    },
    {
      title: "Company Information",
      description: "Add your business details to appear on quotes",
      component: <CompanyInfoStep data={companyData} onChange={setCompanyData} />,
      canSkip: false,
    },
    {
      title: "Brand Colors",
      description: "Customize the look of your quotes",
      component: <BrandingStep data={brandingData} onChange={setBrandingData} />,
      canSkip: false,
    },
    {
      title: "Getting Started",
      description: "Choose how you'd like to begin",
      component: <ImportDataStep importOption={importOption} onChange={setImportOption} />,
      canSkip: false,
    },
    {
      title: "All Set!",
      description: "You're ready to start creating quotes",
      component: <CompletionStep />,
      canSkip: false,
    },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 1: // Company Info
        return companyData.name.trim() !== "" && companyData.email.trim() !== "";
      case 2: // Branding
        return true; // Colors have defaults
      case 3: // Import option
        return importOption !== "";
      default:
        return true;
    }
  };

  const handleComplete = async () => {
    if (!user?.id) {
      toast.error("User session not found. Please try signing in again.");
      return;
    }

    try {
      console.log("[OnboardingWizard] ========== STARTING ONBOARDING COMPLETION ==========");
      console.log("[OnboardingWizard] User ID:", user.id);

      // CRITICAL: Set completion flags IMMEDIATELY (before any async operations)
      console.log("[OnboardingWizard] Step 1: Setting completion flags...");
      const completionKey = `onboarding_completed_${user.id}`;
      const completionTimestamp = new Date().toISOString();

      localStorage.setItem(completionKey, "true");
      localStorage.setItem(`${completionKey}_timestamp`, completionTimestamp);
      localStorage.setItem(`onboarding_status_${user.id}`, "completed");
      sessionStorage.setItem(completionKey, "true");
      localStorage.setItem("onboarding_completed", "true");
      console.log("[OnboardingWizard] ✓ Completion flags set");

      // CRITICAL: Close wizard immediately to prevent reopening
      console.log("[OnboardingWizard] Step 2: Closing wizard...");
      setIsDialogOpen(false);
      console.log("[OnboardingWizard] ✓ Wizard closed");

      // Step 3: Get existing settings (using isolated client)
      console.log("[OnboardingWizard] Step 3: Fetching existing settings...");
      const existingSettings = await getSettings(user.id, organizationId, onboardingClient);

      // Step 4: Merge with new onboarding data
      const updatedSettings = {
        ...existingSettings,
        name: companyData.name,
        email: companyData.email,
        phone: companyData.phone,
        address: companyData.address,
        industry: companyData.industry,
        primaryColor: brandingData.primaryColor,
        accentColor: brandingData.accentColor,
        onboardingCompleted: true,
      };

      console.log("[OnboardingWizard] Step 4: Saving settings...");

      // Step 5: Save to storage using isolated client
      await saveSettings(user.id, organizationId, updatedSettings, () => { }, onboardingClient);
      console.log("[OnboardingWizard] ✓ Settings saved successfully");

      // Step 6: Handle import option
      if (importOption === "sample") {
        console.log("[OnboardingWizard] Step 6: Loading sample data...");
        try {
          const { generateSampleData } = await import("@/lib/sample-data");
          await generateSampleData(user.id, true);
          console.log("[OnboardingWizard] ✓ Sample data loaded");
          toast.success("Setup complete! Sample data has been loaded.");
        } catch (sampleError) {
          console.error("[OnboardingWizard] Sample data load failed:", sampleError);
          toast.success("Setup complete! You can start adding your data.");
        }
      } else {
        toast.success("Setup complete! You're ready to create your first quote.");
      }

      console.log("[OnboardingWizard] ✓ All steps completed");
      console.log("[OnboardingWizard] ========== ONBOARDING COMPLETION SUCCESSFUL ==========");
    } catch (error) {
      console.error("[OnboardingWizard] ========== ONBOARDING COMPLETION ERROR ==========");
      console.error("[OnboardingWizard] Error:", error);

      // Ensure completion flags are set even on error (prevent infinite loop)
      const completionKey = `onboarding_completed_${user.id}`;
      localStorage.setItem(completionKey, "true");
      localStorage.setItem(`onboarding_status_${user.id}`, "completed");
      sessionStorage.setItem(completionKey, "true");

      toast.success("Setup complete! If you encounter any issues, try refreshing the page.");

      // Always close wizard to prevent loop
      setIsDialogOpen(false);
    }
  };

  if (isChecking) {
    // Don't render anything while checking - prevents flash of wizard
    return null;
  }

  // CRITICAL: Early exit for public pages - don't render at all
  if (isPublicPage) {
    return null;
  }

  if (!isDialogOpen) {
    return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-2xl p-0 max-h-[90vh] overflow-hidden flex flex-col" data-demo="onboarding-wizard">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl">{steps[currentStep].title}</DialogTitle>
          <DialogDescription>{steps[currentStep].description}</DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-2">
          <Progress value={progress} className="h-2" />
        </div>

        <div className="px-6 flex-1 overflow-y-auto">
          <div className="min-h-[300px] flex items-center justify-center">
            {steps[currentStep].component}
          </div>
        </div>

        <div className="flex justify-between p-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          <Button
            onClick={() => {
              if (currentStep === steps.length - 1) {
                handleComplete();
              } else {
                setCurrentStep(currentStep + 1);
              }
            }}
            disabled={!canProceed()}
          >
            {currentStep === steps.length - 1 ? "Finish Setup" : "Next"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
