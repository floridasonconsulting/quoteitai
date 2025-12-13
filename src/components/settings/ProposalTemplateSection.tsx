import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface ProposalTemplateSectionProps {
  settings: {
    proposalTemplate?: string;
  };
  onUpdate: (updates: Partial<ProposalTemplateSectionProps["settings"]>) => Promise<void>;
}

export function ProposalTemplateSection({ settings, onUpdate }: ProposalTemplateSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Proposal Template
        </CardTitle>
        <CardDescription>
          Customize the default template for your proposals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="proposalTemplate">Default Template</Label>
          <Textarea
            id="proposalTemplate"
            value={settings.proposalTemplate || ""}
            onChange={(e) => onUpdate({ proposalTemplate: e.target.value })}
            placeholder="Enter your default proposal template..."
            rows={10}
            className="font-mono text-sm"
          />
          <p className="text-sm text-muted-foreground">
            Use variables: {"{company_name}"}, {"{customer_name}"}, {"{quote_total}"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
