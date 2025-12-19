import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Image, X, Plus, Upload, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CompanySettings, VisualRule } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface VisualsDefaultsSectionProps {
    settings: CompanySettings;
    onUpdate: (updates: Partial<CompanySettings>) => Promise<void>;
}

export function VisualsDefaultsSection({ settings, onUpdate }: VisualsDefaultsSectionProps) {
    const { user } = useAuth();
    const [isUploading, setIsUploading] = useState<string | null>(null);
    const [newKeyword, setNewKeyword] = useState("");
    const [newImageUrl, setNewImageUrl] = useState("");

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: 'defaultCoverImage' | 'defaultHeaderImage' | 'ruleImage') => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size must be less than 5MB");
            return;
        }

        try {
            setIsUploading(field);
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${uuidv4()}.${fileExt}`;
            const bucket = 'company-logos'; // Using existing public bucket to avoid "Bucket not found" errors

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);

            if (field === 'ruleImage') {
                setNewImageUrl(publicUrl);
            } else {
                await onUpdate({ [field]: publicUrl });
                toast.success(`Default ${field === 'defaultCoverImage' ? 'Cover' : 'Header'} updated`);
            }
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error("Failed to upload image");
        } finally {
            setIsUploading(null);
        }
    };

    const addRule = async () => {
        if (!newKeyword.trim() || !newImageUrl) {
            toast.error("Please enter a keyword and select an image");
            return;
        }

        const newRule: VisualRule = {
            id: uuidv4(),
            keyword: newKeyword.trim(),
            imageUrl: newImageUrl,
            matchType: 'contains'
        };

        const currentRules = settings.visualRules || [];
        const updatedRules = [...currentRules, newRule];

        await onUpdate({ visualRules: updatedRules });

        setNewKeyword("");
        setNewImageUrl("");
        toast.success("Visual mapping rule added");
    };

    const removeRule = async (id: string) => {
        const currentRules = settings.visualRules || [];
        const updatedRules = currentRules.filter(r => r.id !== id);
        await onUpdate({ visualRules: updatedRules });
        toast.success("Rule removed");
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Visual Defaults
                </CardTitle>
                <CardDescription>
                    Set default images and automated keyword mapping rules for your proposals.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

                {/* Global Defaults */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <Label>Default Cover Image</Label>
                        <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center min-h-[200px] relative bg-slate-50 dark:bg-slate-900">
                            {settings.defaultCoverImage ? (
                                <>
                                    <img src={settings.defaultCoverImage} alt="Cover Default" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                        <Button variant="destructive" size="sm" onClick={() => onUpdate({ defaultCoverImage: undefined })}>Remove</Button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-4">
                                    <Image className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">No default set (System will use Theme Gradient)</p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center">
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'defaultCoverImage')} className="hidden" id="upload-cover" />
                            <Label htmlFor="upload-cover">
                                <Button variant="outline" size="sm" asChild disabled={!!isUploading}>
                                    <span>
                                        <Upload className="w-4 h-4 mr-2" />
                                        {isUploading === 'defaultCoverImage' ? 'Uploading...' : 'Upload Cover'}
                                    </span>
                                </Button>
                            </Label>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label>Default Section Header</Label>
                        <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center min-h-[200px] relative bg-slate-50 dark:bg-slate-900">
                            {settings.defaultHeaderImage ? (
                                <>
                                    <img src={settings.defaultHeaderImage} alt="Header Default" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                        <Button variant="destructive" size="sm" onClick={() => onUpdate({ defaultHeaderImage: undefined })}>Remove</Button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-4">
                                    <Image className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">No default set (System will use Theme Gradient)</p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center">
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'defaultHeaderImage')} className="hidden" id="upload-header" />
                            <Label htmlFor="upload-header">
                                <Button variant="outline" size="sm" asChild disabled={!!isUploading}>
                                    <span>
                                        <Upload className="w-4 h-4 mr-2" />
                                        {isUploading === 'defaultHeaderImage' ? 'Uploading...' : 'Upload Header'}
                                    </span>
                                </Button>
                            </Label>
                        </div>
                    </div>
                </div>

                <div className="border-t pt-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-medium">Smart Keyword Mapping</h3>
                            <p className="text-sm text-muted-foreground">Automatically assign images to categories based on keywords.</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-4 mb-6">
                        <Label>Add New Rule</Label>
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 space-y-2 w-full">
                                <Label className="text-xs">If Category Name Contains:</Label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="e.g. 'Pool', 'Labor', 'Lighting'"
                                        className="pl-9"
                                        value={newKeyword}
                                        onChange={(e) => setNewKeyword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 space-y-2 w-full">
                                <Label className="text-xs">Use This Image:</Label>
                                <div className="flex gap-2">
                                    <div className="h-10 w-16 bg-slate-200 dark:bg-slate-800 rounded border overflow-hidden flex-shrink-0">
                                        {newImageUrl && <img src={newImageUrl} className="h-full w-full object-cover" />}
                                    </div>
                                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'ruleImage')} className="hidden" id="upload-rule" />
                                    <Label htmlFor="upload-rule" className="flex-1">
                                        <Button variant="outline" className="w-full" asChild disabled={!!isUploading}>
                                            <span>{newImageUrl ? "Change Image" : "Select Image"}</span>
                                        </Button>
                                    </Label>
                                </div>
                            </div>

                            <Button onClick={addRule} disabled={!newKeyword || !newImageUrl}>
                                <Plus className="w-4 h-4 mr-2" /> Add Rule
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Keyword</TableHead>
                                    <TableHead>Mapped Image</TableHead>
                                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(!settings.visualRules || settings.visualRules.length === 0) ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                            No rules defined yet. Add one above to automate your proposal visuals.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    settings.visualRules.map((rule) => (
                                        <TableRow key={rule.id}>
                                            <TableCell className="font-medium">
                                                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                                                    CONTAINS "{rule.keyword}"
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-12 rounded border overflow-hidden bg-slate-100">
                                                        <img src={rule.imageUrl} alt={rule.keyword} className="h-full w-full object-cover" />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {rule.imageUrl.split('/').pop()}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => removeRule(rule.id)}>
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
