import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CompanySettings } from "@/types";

interface ProposalTemplateSectionProps {
  settings: CompanySettings;
  onChange: (value: "classic" | "modern" | "detailed") => void;
}

export function ProposalTemplateSection({ settings, onChange }: ProposalTemplateSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Proposal Template Style</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={settings.proposalTemplate || "classic"}
          onValueChange={onChange}
        >
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="classic" id="classic" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="classic" className="cursor-pointer font-semibold">
                Classic Template
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Traditional business format with logo, company info, and itemized list. 
                Perfect for formal proposals and established businesses.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="modern" id="modern" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="modern" className="cursor-pointer font-semibold">
                Modern Template
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Clean, minimal design with accent bars and two-column layout. 
                Great for creative industries and tech-focused businesses.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="detailed" id="detailed" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="detailed" className="cursor-pointer font-semibold">
                Detailed Template
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Comprehensive format with bordered sections, signature blocks, and extensive terms. 
                Ideal for construction, contractors, and complex projects.
              </p>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}