import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CompanySettings } from "@/types";

interface CompanyInfoSectionProps {
  settings: CompanySettings;
  onChange: (field: keyof CompanySettings, value: string) => void;
}

export function CompanyInfoSection({ settings, onChange }: CompanyInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            value={settings.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Your Company Name"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={settings.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={settings.email}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="info@company.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={settings.website}
            onChange={(e) => onChange("website", e.target.value)}
            placeholder="https://www.company.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            value={settings.address}
            onChange={(e) => onChange("address", e.target.value)}
            placeholder="123 Main Street"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={settings.city}
              onChange={(e) => onChange("city", e.target.value)}
              placeholder="City"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={settings.state}
              onChange={(e) => onChange("state", e.target.value)}
              placeholder="ST"
              maxLength={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip">ZIP Code</Label>
            <Input
              id="zip"
              value={settings.zip}
              onChange={(e) => onChange("zip", e.target.value)}
              placeholder="12345"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="license">License Number</Label>
            <Input
              id="license"
              value={settings.license || ""}
              onChange={(e) => onChange("license", e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="insurance">Insurance Policy</Label>
            <Input
              id="insurance"
              value={settings.insurance || ""}
              onChange={(e) => onChange("insurance", e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}