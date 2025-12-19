import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Globe, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ProposalVisuals } from "@/types/proposal";
import { visualsService } from "@/lib/services/visuals-service";

interface VisualsTabProps {
  quoteId: string;
  projectDescription?: string;
}

export function VisualsTab({ quoteId, projectDescription }: VisualsTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [visuals, setVisuals] = useState<ProposalVisuals>({
    coverImage: "",
    logo: "",
    gallery: [],
    sectionBackgrounds: {}
  });

  // Load existing visuals
  useEffect(() => {
    loadVisuals();
  }, [quoteId]);

  const loadVisuals = async () => {
    try {
      setLoading(true);
      const data = await visualsService.getVisuals(quoteId);
      if (data) setVisuals(data);
    } catch (error) {
      console.error(error);
      toast({ title: "Error loading visuals", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedVisuals: ProposalVisuals) => {
    setVisuals(updatedVisuals);
    try {
      await visualsService.saveVisuals(quoteId, updatedVisuals);
      toast({ title: "Visuals saved", description: "Your proposal looks great!" });
    } catch (error) {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Visual Assets</h2>
          <p className="text-muted-foreground">Manage imagery and branding for this proposal</p>
        </div>

      </div>

      <Tabs defaultValue="cover" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cover">Cover & Brand</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="backgrounds">Section Backgrounds</TabsTrigger>
        </TabsList>

        {/* COVER & BRAND TAB */}
        <TabsContent value="cover" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cover Image</CardTitle>
                <CardDescription>The hero image shown on the proposal landing page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative group">
                  {visuals.coverImage ? (
                    <img src={visuals.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <ImageIcon className="w-12 h-12 opacity-20" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Image URL..."
                    value={visuals.coverImage}
                    onChange={(e) => handleSave({ ...visuals, coverImage: e.target.value })}
                  />
                  <Button variant="outline" size="icon">
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Logo</CardTitle>
                <CardDescription>Specific logo for this project (overrides company default)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-square w-32 mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative">
                  {visuals.logo ? (
                    <img src={visuals.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <ImageIcon className="w-8 h-8 opacity-20" />
                    </div>
                  )}
                </div>
                <Input
                  placeholder="Logo URL..."
                  value={visuals.logo || ""}
                  onChange={(e) => handleSave({ ...visuals, logo: e.target.value })}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* GALLERY TAB */}
        <TabsContent value="gallery" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Gallery</CardTitle>
              <CardDescription>Additional images to showcase work or concepts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {visuals.gallery?.map((url, idx) => (
                  <div key={idx} className="aspect-square rounded-lg overflow-hidden relative group">
                    <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const newGallery = visuals.gallery?.filter((_, i) => i !== idx);
                        handleSave({ ...visuals, gallery: newGallery });
                      }}
                    >
                      <span className="sr-only">Delete</span>
                      ×
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="aspect-square flex flex-col items-center justify-center gap-2 h-full w-full border-dashed"
                  onClick={() => {
                    const url = prompt("Enter image URL:");
                    if (url) handleSave({ ...visuals, gallery: [...(visuals.gallery || []), url] });
                  }}
                >
                  <Upload className="w-6 h-6" />
                  <span>Add Image</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BACKGROUNDS TAB */}
        <TabsContent value="backgrounds" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Section Backgrounds</CardTitle>
              <CardDescription>Custom backgrounds for specific category sections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Pool Structure', 'Equipment', 'Decking'].map((section) => (
                  <div key={section} className="flex items-center gap-4">
                    <Label className="w-32">{section}</Label>
                    <Input
                      placeholder="Background Image URL..."
                      value={visuals.sectionBackgrounds?.[section] || ""}
                      onChange={(e) => {
                        handleSave({
                          ...visuals,
                          sectionBackgrounds: {
                            ...visuals.sectionBackgrounds,
                            [section]: e.target.value
                          }
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}