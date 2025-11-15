import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Trash2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CompanySettings } from "@/types";

interface BrandingSectionProps {
  settings: CompanySettings;
  isMaxAITier: boolean;
  logoPreview: string | null;
  isUploadingLogo: boolean;
  onLogoChange: (file: File) => void;
  onLogoDelete: () => void;
  onDisplayOptionChange: (value: "logo" | "name" | "both") => void;
}

export function BrandingSection({
  settings,
  isMaxAITier,
  logoPreview,
  isUploadingLogo,
  onLogoChange,
  onLogoDelete,
  onDisplayOptionChange,
}: BrandingSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding & Logo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isMaxAITier && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <span className="font-semibold">Upgrade to Max AI</span> to unlock white-label branding.
              Custom logo uploads are available on the Max AI tier.
            </AlertDescription>
          </Alert>
        )}

        {isMaxAITier && (
          <>
            <div className="space-y-2">
              <Label htmlFor="logo">Company Logo for Branding</Label>
              <div className="flex flex-col gap-3">
                {(logoPreview || settings.logo) && (
                  <div className="relative w-32 h-32 border-2 border-dashed rounded-lg overflow-hidden">
                    <img
                      src={logoPreview || settings.logo}
                      alt="Company Logo"
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploadingLogo}
                    onClick={() => document.getElementById("logo-upload")?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploadingLogo ? "Uploading..." : "Upload Logo"}
                  </Button>
                  {(logoPreview || settings.logo) && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={onLogoDelete}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onLogoChange(file);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: Square image, max 2MB (PNG, JPG, or SVG)
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Logo Display Options</Label>
              <RadioGroup
                value={settings.logoDisplayOption || "both"}
                onValueChange={onDisplayOptionChange}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="logo" id="logo-only" />
                  <Label htmlFor="logo-only" className="cursor-pointer font-normal">
                    Logo Only
                    <Badge variant="secondary" className="ml-2">White-label</Badge>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="name" id="name-only" />
                  <Label htmlFor="name-only" className="cursor-pointer font-normal">
                    Company Name Only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="logo-and-name" />
                  <Label htmlFor="logo-and-name" className="cursor-pointer font-normal">
                    Logo + Company Name
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}