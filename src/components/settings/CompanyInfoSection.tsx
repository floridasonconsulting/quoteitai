import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { toast } from "sonner";

interface CompanyInfoSectionProps {
  settings: {
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
    companyWebsite?: string;
    taxId?: string;
  };
  onUpdate: (updates: Partial<CompanyInfoSectionProps["settings"]>) => Promise<void>;
}

export function CompanyInfoSection({ settings, onUpdate }: CompanyInfoSectionProps) {
  const [formData, setFormData] = useState({
    companyName: settings.companyName || "",
    companyAddress: settings.companyAddress || "",
    companyPhone: settings.companyPhone || "",
    companyEmail: settings.companyEmail || "",
    companyWebsite: settings.companyWebsite || "",
    taxId: settings.taxId || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onUpdate(formData);
      toast.success("Company information updated successfully");
    } catch (error) {
      console.error("Failed to update company info:", error);
      toast.error("Failed to update company information");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Company Information
        </CardTitle>
        <CardDescription>
          This information appears on your quotes and proposals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleChange("companyName", e.target.value)}
              placeholder="Acme Corporation"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyEmail">Email Address *</Label>
            <Input
              id="companyEmail"
              type="email"
              value={formData.companyEmail}
              onChange={(e) => handleChange("companyEmail", e.target.value)}
              placeholder="contact@acme.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyPhone">Phone Number</Label>
            <Input
              id="companyPhone"
              type="tel"
              value={formData.companyPhone}
              onChange={(e) => handleChange("companyPhone", e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyWebsite">Website</Label>
            <Input
              id="companyWebsite"
              type="url"
              value={formData.companyWebsite}
              onChange={(e) => handleChange("companyWebsite", e.target.value)}
              placeholder="https://acme.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyAddress">Address</Label>
          <Textarea
            id="companyAddress"
            value={formData.companyAddress}
            onChange={(e) => handleChange("companyAddress", e.target.value)}
            placeholder="123 Business St, Suite 100&#10;City, State 12345"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="taxId">Tax ID / EIN (Optional)</Label>
          <Input
            id="taxId"
            value={formData.taxId}
            onChange={(e) => handleChange("taxId", e.target.value)}
            placeholder="12-3456789"
          />
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Company Information"}
        </Button>
      </CardContent>
    </Card>
  );
}
