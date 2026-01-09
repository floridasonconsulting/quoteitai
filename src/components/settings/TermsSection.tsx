import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileCheck, Scale, Eye, EyeOff, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { CompanySettings } from "@/types";
import { formatTermsContent } from "@/lib/json-terms-formatter";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface TermsSectionProps {
  settings: CompanySettings;
  onUpdate: (updates: Partial<CompanySettings>) => Promise<void>;
}

// Markdown example for users
const MARKDOWN_EXAMPLE = `## Project Overview
This proposal covers the complete renovation of your pool including surface preparation, finish application, and all related work.

## Warranty Terms
**Coverage:** One-year warranty against defects in materials and workmanship

**Equipment Warranty:** Three-year warranty on all equipment purchases

**Exclusions:**
• Damage caused by improper maintenance
• Normal wear and tear
• Issues caused by water chemistry imbalance

## Payment Schedule
• **Contract Acceptance:** 15%
• **Project Start:** 40%
• **Completion of Work:** 40%
• **Final Inspection:** 5%

## Customer Responsibilities
• Provide water source for pool filling
• Maintain proper chemical balance
• Schedule timely inspections

## Important Notes
All work is guaranteed for one year from completion date. Changes to the scope must be approved in writing.`;

export function TermsSection({ settings, onUpdate }: TermsSectionProps) {
  const [terms, setTerms] = useState(settings.terms || "");
  const [legalTerms, setLegalTerms] = useState(settings.legalTerms || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showTermsPreview, setShowTermsPreview] = useState(false);
  const [showLegalPreview, setShowLegalPreview] = useState(false);
  const [showFormattingGuide, setShowFormattingGuide] = useState(false);

  // Format terms for preview
  const formattedTerms = useMemo(() => formatTermsContent(terms), [terms]);
  const formattedLegalTerms = useMemo(() => formatTermsContent(legalTerms), [legalTerms]);

  const handleSave = async () => {
    try {
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

  const insertExample = (field: 'terms' | 'legal') => {
    if (field === 'terms') {
      setTerms(MARKDOWN_EXAMPLE);
    } else {
      setLegalTerms(MARKDOWN_EXAMPLE);
    }
    toast.success("Example template inserted! Customize it for your business.");
  };

  return (
    <div className="space-y-6">
      {/* Formatting Guide */}
      <Collapsible open={showFormattingGuide} onOpenChange={setShowFormattingGuide}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Formatting Guide
            </span>
            {showFormattingGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-3">
            <p className="font-medium">Use simple markdown formatting for best results:</p>
            <div className="grid gap-2 text-xs font-mono bg-background rounded p-3">
              <div><span className="text-blue-600">## Section Title</span> — Creates a main section header</div>
              <div><span className="text-blue-600">### Subsection</span> — Creates a smaller subsection</div>
              <div><span className="text-blue-600">**Bold text**</span> — Makes text bold</div>
              <div><span className="text-blue-600">• Bullet point</span> — Creates a bullet list item</div>
              <div><span className="text-blue-600">- Dash point</span> — Also creates a bullet item</div>
            </div>
            <p className="text-muted-foreground">
              <strong>Tip:</strong> Each <code>## Section</code> will appear as a separate card in the proposal viewer.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Payment Terms */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="terms" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Payment Terms & Conditions
          </Label>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertExample('terms')}
              className="text-xs h-7"
            >
              Insert Example
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTermsPreview(!showTermsPreview)}
              className="text-xs h-7"
            >
              {showTermsPreview ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
              {showTermsPreview ? "Edit" : "Preview"}
            </Button>
          </div>
        </div>

        {showTermsPreview ? (
          <div className="border rounded-lg p-4 bg-muted/20 min-h-[200px] text-sm whitespace-pre-wrap">
            {formattedTerms || <span className="text-muted-foreground italic">No content to preview</span>}
          </div>
        ) : (
          <Textarea
            id="terms"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder={`## Warranty Terms
**Coverage:** One-year warranty on workmanship

## Payment Schedule
• **Deposit:** 50% due at signing
• **Completion:** 50% due upon completion

## Important Notes
All work guaranteed for one year from completion.`}
            rows={10}
            className="font-mono text-sm"
          />
        )}
        <p className="text-xs text-muted-foreground">
          These terms appear on all quotes and proposals. Use <code>## Headers</code> to create sections.
        </p>
      </div>

      {/* Legal Terms */}
      <div className="space-y-2 pt-4 border-t">
        <div className="flex items-center justify-between">
          <Label htmlFor="legal-terms" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Legal & Contractual Terms (Shown at Signing)
          </Label>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertExample('legal')}
              className="text-xs h-7"
            >
              Insert Example
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLegalPreview(!showLegalPreview)}
              className="text-xs h-7"
            >
              {showLegalPreview ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
              {showLegalPreview ? "Edit" : "Preview"}
            </Button>
          </div>
        </div>

        {showLegalPreview ? (
          <div className="border rounded-lg p-4 bg-muted/20 min-h-[200px] text-sm whitespace-pre-wrap">
            {formattedLegalTerms || <span className="text-muted-foreground italic">No content to preview</span>}
          </div>
        ) : (
          <Textarea
            id="legal-terms"
            value={legalTerms}
            onChange={(e) => setLegalTerms(e.target.value)}
            placeholder={`## Liability & Indemnification
The contractor shall not be liable for pre-existing conditions...

## Dispute Resolution
Any disputes shall be resolved through arbitration...

## Cancellation Policy
• 48 hours notice required for cancellation without penalty
• Deposits are non-refundable after work begins`}
            rows={10}
            className="font-mono text-sm"
          />
        )}
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> Legal terms are shown when the customer clicks "Approve" and must be reviewed before signing.
        </p>
      </div>

      <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
        {isSaving ? "Saving..." : "Save Terms & Conditions"}
      </Button>
    </div>
  );
}