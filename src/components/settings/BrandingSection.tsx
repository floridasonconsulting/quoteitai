import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Upload, X, Crown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CompanySettings } from "@/types";

interface BrandingSectionProps {
  settings: CompanySettings;
  onUpdate: (updates: Partial<CompanySettings>) => Promise<void>;
}

export function BrandingSection({ settings, onUpdate }: BrandingSectionProps) {
  const { user, isMaxAITier } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogoDisplayChange = async (value: 'logo' | 'name' | 'both') => {
    try {
      console.log('[BrandingSection] Updating logoDisplayOption to:', value);
      await onUpdate({ logoDisplayOption: value });
      toast.success("Logo display preference updated");
    } catch (error) {
      console.error("Failed to update logo display:", error);
      toast.error("Failed to update logo display");
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
      const filePath = fileName; // CRITICAL: Do limit path to just user/file for RLS to work

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      console.log('[BrandingSection] Logo uploaded, URL:', publicUrl);

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
          .remove([logoPath]);

        if (deleteError) {
          console.warn("Failed to delete logo from storage:", deleteError);
        }
      }

      console.log('[BrandingSection] Logo removed');

      // Update company settings
      await onUpdate({ logo: undefined });
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
          Customize your company logo and display preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Display Option */}
        <div className="space-y-3">
          <Label htmlFor="logoDisplayOption">Logo Display on Proposals</Label>
          <Select
            value={settings.logoDisplayOption || 'both'}
            onValueChange={handleLogoDisplayChange}
          >
            <SelectTrigger id="logoDisplayOption">
              <SelectValue placeholder="Select display option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="logo">Logo Only</SelectItem>
              <SelectItem value="name">Company Name Only</SelectItem>
              <SelectItem value="both">Both Logo and Name</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Choose how your company branding appears on proposals
          </p>
        </div>

        {/* White-Label Logo Upload (Max AI Tier Only) */}
        <div className="space-y-3 pt-4 border-t">
          <Label htmlFor="logo-upload">Company Logo</Label>

          {!isMaxAITier && (
            <Alert>
              <Crown className="h-4 w-4" />
              <AlertDescription>
                Custom logo upload is available exclusively for Max AI tier subscribers.
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
                    className="h-16 w-auto object-contain border rounded p-2"
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
                  aria-label="Company Logo Upload"
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

        {/* Custom Favicon (Max AI Tier Only) */}
        <div className="space-y-3 pt-4 border-t">
          <Label htmlFor="favicon-upload">Custom Favicon</Label>

          {!isMaxAITier && (
            <Alert>
              <Crown className="h-4 w-4" />
              <AlertDescription>
                Custom favicon is available exclusively for Max AI tier subscribers.
              </AlertDescription>
            </Alert>
          )}

          {isMaxAITier && (
            <>
              {(settings as any).customFavicon && (
                <div className="mb-3 flex items-center gap-4">
                  <img
                    src={(settings as any).customFavicon}
                    alt="Custom favicon"
                    className="h-8 w-8 object-contain border rounded"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await onUpdate({ customFavicon: undefined } as any);
                        toast.success("Favicon removed");
                      } catch (e) {
                        toast.error("Failed to remove favicon");
                      }
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Remove Favicon
                  </Button>
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/x-icon,image/png,image/svg+xml"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 1 * 1024 * 1024) {
                      toast.error("Favicon must be less than 1MB");
                      return;
                    }
                    try {
                      const fileExt = file.name.split('.').pop();
                      const fileName = `${user?.id}/favicon.${fileExt}`;
                      const { error: uploadError } = await supabase.storage
                        .from('company-logos')
                        .upload(fileName, file, { upsert: true });
                      if (uploadError) throw uploadError;
                      const { data: { publicUrl } } = supabase.storage
                        .from('company-logos')
                        .getPublicUrl(fileName);
                      await onUpdate({ customFavicon: publicUrl } as any);
                      toast.success("Favicon uploaded");
                    } catch (err) {
                      toast.error("Failed to upload favicon");
                    }
                  }}
                  className="hidden"
                  id="favicon-upload"
                />
                <label htmlFor="favicon-upload">
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Favicon
                    </span>
                  </Button>
                </label>
                <p className="text-sm text-muted-foreground mt-2">
                  Recommended: ICO, PNG, or SVG, 32x32 or 64x64 pixels
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}