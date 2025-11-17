
import { QuickBooksSection } from "./QuickBooksSection";
import { StripeSection } from "./StripeSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link as LinkIcon } from "lucide-react";
import { CompanySettings } from "@/types";

interface IntegrationsSectionProps {
  settings: CompanySettings;
  onUpdate: (updates: Partial<CompanySettings>) => Promise<void>;
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
          {/* QuickBooks Integration */}
          <QuickBooksSection />

          {/* Stripe Payment Integration */}
          <StripeSection />
        </CardContent>
      </Card>
    </div>
  );
}
