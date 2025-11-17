import { useState, useEffect, ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CheckCircle2, Building, Upload, FileText } from "lucide-react";

interface OnboardingStep {
  title: string;
  description: string;
  component: ReactNode;
}

const WelcomeStep = () => (
  <div className="text-center space-y-4 py-8">
    <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
    <h3 className="text-2xl font-bold">Welcome to Quote.it AI!</h3>
    <p className="text-muted-foreground">
      Let's get you set up in less than 5 minutes.
    </p>
  </div>
);

// Placeholder components for other steps
const CompanyInfoStep = () => <div className="text-center p-8"><Building className="mx-auto h-12 w-12 mb-4" />Company Info Form...</div>;
const ImportDataStep = () => <div className="text-center p-8"><Upload className="mx-auto h-12 w-12 mb-4" />Import Data Section...</div>;
const FirstQuoteStep = () => <div className="text-center p-8"><FileText className="mx-auto h-12 w-12 mb-4" />First Quote Guide...</div>;


export function OnboardingWizard() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem(`onboarding_completed_${user?.id}`);
    if (user && !hasCompletedOnboarding) {
      setIsOpen(true);
    }
  }, [user]);

  const steps: OnboardingStep[] = [
    {
      title: 'Welcome to Quote.it AI',
      description: 'Let\'s get you set up in 5 minutes',
      component: <WelcomeStep />,
    },
    {
      title: 'Company Information',
      description: 'Add your business details to appear on quotes',
      component: <CompanyInfoStep />,
    },
    {
      title: 'Import Your Data',
      description: 'Import customers and items, or start fresh',
      component: <ImportDataStep />,
    },
    {
      title: 'Create Your First Quote',
      description: 'Let\'s walk through creating your first quote',
      component: <FirstQuoteStep />,
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleComplete = () => {
    localStorage.setItem(`onboarding_completed_${user?.id}`, 'true');
    setIsOpen(false);
    toast.success("Setup complete! You're ready to start quoting.");
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl p-0" data-demo="onboarding-wizard">
        <DialogHeader className="p-6">
          <DialogTitle className="text-2xl">{steps[currentStep].title}</DialogTitle>
          <DialogDescription>{steps[currentStep].description}</DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6">
          <Progress value={progress} className="h-2 mb-6" />

          <div className="min-h-[250px] flex items-center justify-center">
            {steps[currentStep].component}
          </div>

          <div className="flex justify-between pt-6 border-t">
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
            >
              {currentStep === steps.length - 1 ? 'Finish Setup' : 'Next'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
