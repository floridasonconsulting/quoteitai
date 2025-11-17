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
  const [isChecking, setIsChecking] = useState(true); // Add checking state
  
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
    // Check onboarding status when user is loaded
    const checkOnboardingStatus = async () => {
      if (!user?.id) {
        setIsChecking(false);
        return;
      }
      
      console.log("[OnboardingWizard] Checking onboarding status for user:", user.id);
      
      // Check 1: localStorage completion flags
      const localFlag = localStorage.getItem(`onboarding_completed_${user.id}`);
      const statusFlag = localStorage.getItem(`onboarding_status_${user.id}`);
      const sessionFlag = sessionStorage.getItem(`onboarding_completed_${user.id}`);
      
      console.log("[OnboardingWizard] Completion flags:", {
        localFlag,
        statusFlag,
        sessionFlag
      });
      
      // If ANY flag is set, consider onboarding complete
      if (localFlag === "true" || statusFlag === "completed" || sessionFlag === "true") {
        console.log("[OnboardingWizard] ✓ Onboarding already completed (flags found)");
        setIsOpen(false);
        setIsChecking(false);
        return;
      }
      
      // Check 2: Verify database settings (fallback if localStorage was cleared)
      try {
        console.log("[OnboardingWizard] No completion flags found, checking database...");
        const dbSettings = await getSettings(user.id);
        
        // If company name and email are set in database, consider onboarding complete
        if (dbSettings.name && dbSettings.name.trim() !== "" && 
            dbSettings.email && dbSettings.email.trim() !== "") {
          console.log("[OnboardingWizard] ✓ Onboarding already completed (database has settings)");
          console.log("[OnboardingWizard] Company name:", dbSettings.name);
          console.log("[OnboardingWizard] Company email:", dbSettings.email);
          
          // Restore completion flags since database confirms completion
          localStorage.setItem(`onboarding_completed_${user.id}`, "true");
          localStorage.setItem(`onboarding_status_${user.id}`, "completed");
          sessionStorage.setItem(`onboarding_completed_${user.id}`, "true");
          
          console.log("[OnboardingWizard] ✓ Restored completion flags from database verification");
          
          setIsOpen(false);
          setIsChecking(false);
          return;
        }
        
        console.log("[OnboardingWizard] Database settings not complete, showing onboarding");
        console.log("[OnboardingWizard] Company name:", dbSettings.name || "(empty)");
        console.log("[OnboardingWizard] Company email:", dbSettings.email || "(empty)");
      } catch (error) {
        console.error("[OnboardingWizard] Error checking database settings:", error);
      }
      
      // If we get here, onboarding is not complete - show wizard
      console.log("[OnboardingWizard] Opening onboarding wizard");
      setIsOpen(true);
      setIsChecking(false);
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
      console.log("[OnboardingWizard] Company Name:", companyData.name);
      console.log("[OnboardingWizard] Company Email:", companyData.email);
      
      // Step 1: Get existing settings from database
      console.log("[OnboardingWizard] Step 1: Fetching existing settings...");
      const existingSettings = await getSettings(user.id);
      console.log("[OnboardingWizard] Retrieved existing settings:", existingSettings);
      
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

      console.log("[OnboardingWizard] Step 2: Merged settings:", updatedSettings);

      // Step 3: Save to database with extended retry logic
      let saveSuccessful = false;
      let attempts = 0;
      const maxAttempts = 5; // Increased from 3 to 5
      
      while (!saveSuccessful && attempts < maxAttempts) {
        attempts++;
        console.log(`[OnboardingWizard] Step 3: Save attempt ${attempts} of ${maxAttempts}...`);
        
        try {
          // Save to database
          await saveSettings(user.id, updatedSettings);
          console.log("[OnboardingWizard] ✓ saveSettings() completed successfully");

          // Wait longer for database write to propagate (3 seconds instead of 2)
          console.log("[OnboardingWizard] Waiting 3 seconds for database write propagation...");
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Step 4: Extended verification loop (verify multiple times)
          console.log("[OnboardingWizard] Step 4: Extended verification loop starting...");
          
          let verificationPassed = false;
          let verificationAttempts = 0;
          const maxVerificationAttempts = 3;
          
          while (!verificationPassed && verificationAttempts < maxVerificationAttempts) {
            verificationAttempts++;
            console.log(`[OnboardingWizard] Verification attempt ${verificationAttempts} of ${maxVerificationAttempts}...`);
            
            // Verification 1: Read from database
            const dbSettings = await getSettings(user.id);
            console.log("[OnboardingWizard] Database settings:", {
              name: dbSettings.name,
              email: dbSettings.email,
              expected_name: companyData.name,
              expected_email: companyData.email
            });

            // Verification 2: Check localStorage cache
            const cachedSettings = localStorage.getItem("quote-it-settings");
            console.log("[OnboardingWizard] Cached settings exist:", !!cachedSettings);

            // Verification 3: Verify data matches
            const nameMatches = dbSettings.name === companyData.name;
            const emailMatches = dbSettings.email === companyData.email;
            
            console.log("[OnboardingWizard] Data validation:", {
              nameMatches,
              emailMatches,
              allMatch: nameMatches && emailMatches
            });

            if (nameMatches && emailMatches) {
              console.log("[OnboardingWizard] ✓ Verification passed!");
              verificationPassed = true;
              saveSuccessful = true;
            } else if (verificationAttempts < maxVerificationAttempts) {
              console.log("[OnboardingWizard] Verification failed, waiting 1 second before retry...");
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
          if (verificationPassed) {
            // Create multiple backup copies in localStorage
            console.log("[OnboardingWizard] Creating persistent backup copies...");
            const backupKey = `onboarding_backup_${user.id}`;
            const backupData = JSON.stringify(updatedSettings);
            
            // Store in multiple locations for redundancy
            localStorage.setItem(backupKey, backupData);
            localStorage.setItem("quote-it-settings", backupData);
            localStorage.setItem(`settings_backup_${user.id}`, backupData);
            console.log("[OnboardingWizard] ✓ Backups created in localStorage (3 locations)");
          } else {
            throw new Error("Verification failed after multiple attempts");
          }
        } catch (saveError) {
          console.error(`[OnboardingWizard] ✗ Save attempt ${attempts} failed:`, saveError);
          if (attempts < maxAttempts) {
            console.log(`[OnboardingWizard] Retrying... (attempt ${attempts + 1} of ${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between attempts
          } else {
            throw saveError;
          }
        }
      }

      if (!saveSuccessful) {
        throw new Error(
          "Failed to save settings after multiple attempts. " +
          "Please check your internet connection and try again. " +
          "If the problem persists, contact support."
        );
      }

      // Step 5: Handle import option
      if (importOption === "sample") {
        console.log("[OnboardingWizard] Step 5: Loading sample data...");
        const { generateSampleData } = await import("@/lib/sample-data");
        await generateSampleData(user.id, true);
        console.log("[OnboardingWizard] ✓ Sample data loaded");
        toast.success("Sample data loaded successfully!");
      } else {
        console.log("[OnboardingWizard] Step 5: Skipping sample data (option:", importOption, ")");
      }

      // Step 6: Mark onboarding as complete (with multiple persistent flags)
      console.log("[OnboardingWizard] Step 6: Marking onboarding as complete...");
      const completionKey = `onboarding_completed_${user.id}`;
      const completionTimestamp = new Date().toISOString();
      
      // Set multiple completion flags for maximum redundancy
      localStorage.setItem(completionKey, "true");
      localStorage.setItem(`${completionKey}_timestamp`, completionTimestamp);
      localStorage.setItem(`${completionKey}_version`, "2.0");
      localStorage.setItem(`onboarding_status_${user.id}`, "completed"); // Additional flag
      
      // Also store in sessionStorage as additional backup
      sessionStorage.setItem(completionKey, "true");
      sessionStorage.setItem(`onboarding_status_${user.id}`, "completed");
      
      console.log("[OnboardingWizard] ✓ Completion flags set in multiple locations:");
      console.log("[OnboardingWizard]   - localStorage:", localStorage.getItem(completionKey));
      console.log("[OnboardingWizard]   - sessionStorage:", sessionStorage.getItem(completionKey));
      console.log("[OnboardingWizard]   - Timestamp:", completionTimestamp);
      
      // Final verification: Check ALL completion flags
      const localFlag = localStorage.getItem(completionKey);
      const sessionFlag = sessionStorage.getItem(completionKey);
      const statusFlag = localStorage.getItem(`onboarding_status_${user.id}`);
      
      console.log("[OnboardingWizard] Final verification - all flags:", {
        localFlag,
        sessionFlag,
        statusFlag
      });
      
      if (localFlag !== "true" || sessionFlag !== "true" || statusFlag !== "completed") {
        console.error("[OnboardingWizard] ✗ ERROR: Not all completion flags were set correctly!");
        throw new Error("Failed to mark onboarding as complete. Please try again.");
      }
      
      console.log("[OnboardingWizard] ✓ All completion flags verified!");
      
      // Show success message
      toast.success("Setup complete! Your company information has been saved.");
      
      // Wait before closing to ensure all storage operations complete
      console.log("[OnboardingWizard] Waiting 1 second before closing...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Close the wizard
      console.log("[OnboardingWizard] Closing wizard...");
      setIsOpen(false);
      
      console.log("[OnboardingWizard] ========== ONBOARDING COMPLETION SUCCESSFUL ==========");
    } catch (error) {
      console.error("[OnboardingWizard] ========== ONBOARDING COMPLETION FAILED ==========");
      console.error("[OnboardingWizard] Error:", error);
      
      if (error instanceof Error) {
        console.error("[OnboardingWizard] Error message:", error.message);
        console.error("[OnboardingWizard] Error stack:", error.stack);
        
        // Provide specific error messages
        if (error.message.includes("Failed to fetch") || error.message.includes("network")) {
          toast.error("Network error. Please check your internet connection and try again.");
        } else if (error.message.includes("timeout")) {
          toast.error("The request timed out. Please try again.");
        } else if (error.message.includes("Failed to save") || error.message.includes("Failed to mark")) {
          toast.error(error.message);
        } else {
          toast.error(`Failed to save settings: ${error.message}`);
        }
      } else {
        console.error("[OnboardingWizard] Unknown error type:", error);
        toast.error("An unexpected error occurred. Please try again or contact support.");
      }
      
      // Don't close the wizard on error
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
