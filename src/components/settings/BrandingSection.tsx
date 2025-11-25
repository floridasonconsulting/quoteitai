import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Palette, Upload, X, Crown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface BrandingSectionProps {
  settings: {
    primaryColor?: string;
    secondaryColor?: string;
    logo?: string;
  };
  onUpdate: (updates: Partial<BrandingSectionProps["settings"]>) => Promise<void>;
}

export function BrandingSection({ settings, onUpdate }: BrandingSectionProps) {
  const { user, isMaxAITier } = useAuth();
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor || "#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState(settings.secondaryColor || "#8b5cf6");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    if (!isMaxAITier) {
      toast.error("Logo upload is only available for Max AI tier users");
      return;
    }

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
      setIsUploading(true);
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/logo.${fileExt}`;
      const filePath = `company-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      // Update company settings
      await onUpdate({ logo: publicUrl });
      toast.success("Logo uploaded successfully");
    } catch (error) {
      console.error("Failed to upload logo:", error);
      toast.error("Failed to upload logo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogoRemove = async () => {
    if (!isMaxAITier || !settings.logo) return;

    try {
      setIsDeleting(true);

      // Extract file path from URL
      const logoPath = settings.logo.split('/company-logos/')[1];
      
      if (logoPath) {
        // Remove from storage
        const { error: deleteError } = await supabase.storage
          .from('company-logos')
          .remove([`company-logos/${logoPath}`]);

        if (deleteError) {
          console.warn("Failed to delete logo from storage:", deleteError);
        }
      }

      // Update company settings
      await onUpdate({ logo: '' });
      toast.success("Logo removed successfully");
    } catch (error) {
      console.error("Failed to remove logo:", error);
      toast.error("Failed to remove logo");
    } finally {
      setIsDeleting(false);
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
        {/* White-Label Logo Upload (Max AI Tier Only) */}
        <div className="space-y-3">
          <Label htmlFor="logo-upload">Company Logo for Branding</Label>
          
          {!isMaxAITier && (
            <Alert>
              <Crown className="h-4 w-4" />
              <AlertDescription>
                White-label branding is available exclusively for Max AI tier subscribers. 
                <Button variant="link" className="p-0 h-auto ml-1" onClick={() => window.location.href = '/subscription'}>
                  Upgrade to Max AI
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {isMaxAITier && (
            <>
              {settings.logo && (
                <div className="mb-3 flex items-center gap-4">
                  <img
                    src={settings.logo}
                    alt="Company logo"
                    className="h-16 w-auto object-contain"
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={isDeleting}>
                        <X className="mr-2 h-4 w-4" />
                        Remove Logo
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Logo</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove your company logo? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogoRemove}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                  aria-label="Company Logo for Branding"
                />
                <label htmlFor="logo-upload">
                  <Button variant="outline" asChild disabled={isUploading}>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      {isUploading ? "Uploading..." : "Upload Logo"}
                    </span>
                  </Button>
                </label>
                <p className="text-sm text-muted-foreground mt-2">
                  Recommended: PNG or SVG, max 2MB
                </p>
              </div>
            </>
          )}
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
