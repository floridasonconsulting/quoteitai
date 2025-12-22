import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileCheck, Scale } from "lucide-react";
import { toast } from "sonner";
import { CompanySettings } from "@/types";

interface TermsSectionProps {
  settings: CompanySettings;
  onUpdate: (updates: Partial<CompanySettings>) => Promise<void>;
}

export function TermsSection({ settings, onUpdate }: TermsSectionProps) {
  const [terms, setTerms] = useState(settings.terms || "");
  const [legalTerms, setLegalTerms] = useState(settings.legalTerms || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setIsSaving(true);
      console.log('[TermsSection] Saving terms:', { termsLength: terms.length, legalTermsLength: legalTerms.length });
      await onUpdate({ terms, legalTerms });
      toast.success("Terms and conditions updated successfully");
    } catch (error) {
      console.error("[TermsSection] Failed to update terms:", error);
      toast.error("Failed to update terms");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="terms" className="flex items-center gap-2">
          <FileCheck className="h-4 w-4" />
          Payment Terms & Conditions
        </Label>
        <Textarea
          id="terms"
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          placeholder="Enter your default payment terms and conditions here...&#10;&#10;Example:&#10;- 50% deposit required to begin work&#10;- Final 50% due upon completion&#10;- Payment accepted via check, credit card, or bank transfer"
          rows={8}
          className="font-mono text-sm"
        />
        <p className="text-sm text-muted-foreground">
          These terms will appear on all quotes and proposals by default
        </p>
      </div>

      <div className="space-y-2 pt-4 border-t">
        <Label htmlFor="legal-terms" className="flex items-center gap-2">
          <Scale className="h-4 w-4" />
          Legal & Contractual Terms (Global Default)
        </Label>
        <Textarea
          id="legal-terms"
          value={legalTerms}
          onChange={(e) => setLegalTerms(e.target.value)}
          placeholder="Enter your standard legal clauses, indemnification, liability limitations, etc...&#10;&#10;These will be used as the default for all new quotes, but can be overridden on a per-quote basis."
          rows={8}
          className="font-mono text-sm"
        />
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> These legal terms are distinct from payment terms and typically appear in the acceptance section.
        </p>
      </div>

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Terms & Conditions"}
      </Button>
    </div>
  );
}