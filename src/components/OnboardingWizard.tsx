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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CompanyData {
  name: string;
  email: string;
  phone: string;
  address: string;
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
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  
  // Form data
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  
  const [brandingData, setBrandingData] = useState<BrandingData>({
    primaryColor: "#4F46E5",
    accentColor: "#10B981",
  });
  
  const [importOption, setImportOption] = useState("fresh");

  useEffect(() => {
    // Only check onboarding status when user is loaded
    if (!user?.id) return;
    
    const hasCompletedOnboarding = localStorage.getItem(`onboarding_completed_${user.id}`);
    if (!hasCompletedOnboarding) {
      setIsOpen(true);
    }
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
      console.log("[OnboardingWizard] Starting onboarding completion for user:", user.id);
      
      // Step 1: Get existing settings from database
      console.log("[OnboardingWizard] Fetching existing settings...");
      const existingSettings = await getSettings(user.id);
      console.log("[OnboardingWizard] Retrieved existing settings");
      
      // Step 2: Merge with new onboarding data
      const updatedSettings = {
        ...existingSettings,
        name: companyData.name,
        email: companyData.email,
        phone: companyData.phone,
        address: companyData.address,
        primary_color: brandingData.primaryColor,
        accent_color: brandingData.accentColor,
      };

      console.log("[OnboardingWizard] Saving updated settings to database...");

      // Step 3: Save to database with retry logic
      let saveSuccessful = false;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!saveSuccessful && attempts < maxAttempts) {
        attempts++;
        try {
          console.log(`[OnboardingWizard] Save attempt ${attempts} of ${maxAttempts}...`);
          
          // Save to database
          await saveSettings(user.id, updatedSettings);
          console.log("[OnboardingWizard] saveSettings() completed");

          // Wait for database write to propagate (2 seconds for safety)
          console.log("[OnboardingWizard] Waiting for database write to complete...");
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Step 4: Verify the settings were saved by reading them back
          console.log("[OnboardingWizard] Verifying settings were saved...");
          const verifySettings = await getSettings(user.id);
          console.log("[OnboardingWizard] Verification - settings after save:", {
            expected: updatedSettings.name,
            actual: verifySettings.name
          });

          // Check if settings match what we saved
          if (verifySettings.name === companyData.name && 
              verifySettings.email === companyData.email) {
            console.log("[OnboardingWizard] Settings verified successfully ✓");
            saveSuccessful = true;
            
            // Create a backup in localStorage as well (redundancy)
            const backupKey = `onboarding_backup_${user.id}`;
            localStorage.setItem(backupKey, JSON.stringify(updatedSettings));
            console.log("[OnboardingWizard] Backup saved to localStorage");
          } else {
            console.warn("[OnboardingWizard] Settings verification failed - data mismatch");
            if (attempts < maxAttempts) {
              console.log(`[OnboardingWizard] Retrying... (attempt ${attempts + 1} of ${maxAttempts})`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
            }
          }
        } catch (saveError) {
          console.error(`[OnboardingWizard] Save attempt ${attempts} failed:`, saveError);
          if (attempts < maxAttempts) {
            console.log(`[OnboardingWizard] Retrying... (attempt ${attempts + 1} of ${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
          } else {
            throw saveError; // Re-throw if all attempts failed
          }
        }
      }

      if (!saveSuccessful) {
        throw new Error("Failed to save settings after multiple attempts. Please check your internet connection and try again.");
      }

      // Step 5: Handle import option
      if (importOption === "sample") {
        console.log("[OnboardingWizard] Loading sample data...");
        const { generateSampleData } = await import("@/lib/sample-data");
        await generateSampleData(user.id, true);
        toast.success("Sample data loaded successfully!");
      }

      // Step 6: Mark onboarding as complete for this specific user
      const completionKey = `onboarding_completed_${user.id}`;
      localStorage.setItem(completionKey, "true");
      
      console.log("[OnboardingWizard] Onboarding marked as complete");
      console.log("[OnboardingWizard] Completion flag:", localStorage.getItem(completionKey));
      
      // Show success message
      toast.success("Setup complete! Your company information has been saved.");
      
      // Wait before closing to ensure all saves are complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Close the wizard
      console.log("[OnboardingWizard] Closing wizard...");
      setIsOpen(false);
      
      console.log("[OnboardingWizard] Onboarding completion process finished successfully ✓");
    } catch (error) {
      console.error("[OnboardingWizard] ERROR during onboarding completion:", error);
      
      // Provide specific error message based on error type
      if (error instanceof Error) {
        console.error("[OnboardingWizard] Error message:", error.message);
        console.error("[OnboardingWizard] Error stack:", error.stack);
        
        // Check for specific error types
        if (error.message.includes("Failed to fetch") || error.message.includes("network")) {
          toast.error("Network error. Please check your internet connection and try again.");
        } else if (error.message.includes("timeout")) {
          toast.error("The request timed out. Please try again.");
        } else if (error.message.includes("Failed to save")) {
          toast.error(error.message); // Use the specific error message
        } else {
          toast.error(`Failed to save settings: ${error.message}`);
        }
      } else {
        console.error("[OnboardingWizard] Unknown error type:", error);
        toast.error("An unexpected error occurred. Please try again or contact support.");
      }
      
      // Don't close the wizard if there was an error
      return;
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
