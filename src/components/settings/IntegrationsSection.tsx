import { Component, ErrorInfo, ReactNode } from "react";
import { QuickBooksSection } from "./QuickBooksSection";
import { StripeSection } from "./StripeSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link as LinkIcon, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CompanySettings } from "@/types";

interface IntegrationsSectionProps {
  settings: CompanySettings;
  onUpdate: (updates: Partial<CompanySettings>) => Promise<void>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class IntegrationsErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Integrations section error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load integrations. Please refresh the page or contact support if the issue persists.
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export function IntegrationsSection({ settings, onUpdate }: IntegrationsSectionProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Integrations
          </CardTitle>
          <CardDescription>
            Connect external services to enhance Quote-It AI with accounting and payment capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QuickBooks Integration with Error Boundary */}
          <IntegrationsErrorBoundary>
            <QuickBooksSection />
          </IntegrationsErrorBoundary>

          {/* Stripe Payment Integration with Error Boundary */}
          <IntegrationsErrorBoundary>
            <StripeSection />
          </IntegrationsErrorBoundary>
        </CardContent>
      </Card>
    </div>
  );
}
