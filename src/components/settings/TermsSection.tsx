import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CompanySettings } from "@/types";

interface TermsSectionProps {
  settings: CompanySettings;
  onChange: (value: string) => void;
}

export function TermsSection({ settings, onChange }: TermsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Terms & Conditions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label htmlFor="terms">Default Terms</Label>
        <Textarea
          id="terms"
          value={settings.terms}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Payment terms, warranties, and conditions..."
          rows={6}
        />
        <p className="text-xs text-muted-foreground">
          These terms will appear on all quotes by default. You can customize them per-quote when needed.
        </p>
      </CardContent>
    </Card>
  );
}