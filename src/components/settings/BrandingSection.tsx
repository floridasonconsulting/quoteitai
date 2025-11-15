import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, Upload } from "lucide-react";
import { toast } from "sonner";

interface BrandingSectionProps {
  settings: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  };
  onUpdate: (updates: Partial<BrandingSectionProps["settings"]>) => Promise<void>;
}

export function BrandingSection({ settings, onUpdate }: BrandingSectionProps) {
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor || "#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState(settings.secondaryColor || "#8b5cf6");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onUpdate({
        primaryColor,
        secondaryColor,
      });
      toast.success("Branding updated successfully");
    } catch (error) {
      console.error("Failed to update branding:", error);
      toast.error("Failed to update branding");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const logoUrl = e.target?.result as string;
        await onUpdate({ logoUrl });
        toast.success("Logo uploaded successfully");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to upload logo:", error);
      toast.error("Failed to upload logo");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Branding
        </CardTitle>
        <CardDescription>
          Customize your brand colors and logo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Upload */}
        <div className="space-y-3">
          <Label>Company Logo</Label>
          {settings.logoUrl && (
            <div className="mb-3">
              <img
                src={settings.logoUrl}
                alt="Company logo"
                className="h-16 w-auto object-contain"
              />
            </div>
          )}
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              id="logo-upload"
            />
            <label htmlFor="logo-upload">
              <Button variant="outline" asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Logo
                </span>
              </Button>
            </label>
            <p className="text-sm text-muted-foreground mt-2">
              Recommended: PNG or SVG, max 2MB
            </p>
          </div>
        </div>

        {/* Color Pickers */}
        <div className="space-y-4 pt-4 border-t">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#8b5cf6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Branding"}
        </Button>
      </CardContent>
    </Card>
  );
}
