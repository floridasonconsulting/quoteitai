import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileCheck } from "lucide-react";
import { toast } from "sonner";
import { CompanySettings } from "@/types";

interface TermsSectionProps {
  settings: CompanySettings;
  onUpdate: (updates: Partial<CompanySettings>) => Promise<void>;
}

export function TermsSection({ settings, onUpdate }: TermsSectionProps) {
  const [terms, setTerms] = useState(settings.terms || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      console.log('[TermsSection] Saving terms, length:', terms.length);
      await onUpdate({ terms });
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
      
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Terms & Conditions"}
      </Button>
    </div>
  );
}