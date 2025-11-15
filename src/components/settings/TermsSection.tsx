import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck } from "lucide-react";

interface TermsSectionProps {
  settings: {
    defaultTerms?: string;
  };
  onUpdate: (updates: Partial<TermsSectionProps["settings"]>) => Promise<void>;
}

export function TermsSection({ settings, onUpdate }: TermsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          Terms & Conditions
        </CardTitle>
        <CardDescription>
          Set default terms and conditions for your quotes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="defaultTerms">Default Terms</Label>
          <Textarea
            id="defaultTerms"
            value={settings.defaultTerms || ""}
            onChange={(e) => onUpdate({ defaultTerms: e.target.value })}
            placeholder="Enter your default terms and conditions..."
            rows={8}
          />
        </div>
      </CardContent>
    </Card>
  );
}
