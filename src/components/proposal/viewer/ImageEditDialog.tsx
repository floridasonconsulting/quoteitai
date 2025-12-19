import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Image as ImageIcon, Loader2, Check, Upload as UploadIcon, Link as LinkIcon, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface UnsplashImage {
    id: string;
    urls: {
        regular: string;
        small: string;
        thumb: string;
    };
    alt_description: string;
    user: {
        name: string;
    };
}

interface ImageEditDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    title?: string;
    currentImage?: string;
}

export function ImageEditDialog({
    isOpen,
    onClose,
    onSelect,
    title = "Change Image",
    currentImage
}: ImageEditDialogProps) {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UnsplashImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [customUrl, setCustomUrl] = useState("");
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const [accessKey, setAccessKey] = useState(import.meta.env.VITE_UNSPLASH_ACCESS_KEY || "");
    const [showKeyInput, setShowKeyInput] = useState(!import.meta.env.VITE_UNSPLASH_ACCESS_KEY);
    const [isUploading, setIsUploading] = useState(false);

    const [error, setError] = useState<string | null>(null);

    // Debug logging for environment variable detection
    useEffect(() => {
        if (isOpen) {
            console.log("[ImageEditDialog] Unsplash key detection:", {
                hasEnvKey: !!import.meta.env.VITE_UNSPLASH_ACCESS_KEY,
                envKeyLength: import.meta.env.VITE_UNSPLASH_ACCESS_KEY?.length,
                currentAccessKeyLength: accessKey?.length
            });
        }
    }, [isOpen, accessKey]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            // Use header-based authentication as recommended by Unsplash docs
            const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=12`;
            const response = await fetch(url, {
                headers: {
                    "Authorization": `Client-ID ${accessKey}`,
                    "Accept-Version": "v1"
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 401 || response.status === 403) {
                    setShowKeyInput(true);
                    throw new Error("Invalid or rate-limited API key. Please provide a valid Unsplash Access Key.");
                }
                throw new Error(errorData.errors?.[0] || `Search failed with status ${response.status}`);
            }

            const data = await response.json();
            setSearchResults(data.results || []);
            if (data.results?.length === 0) {
                setError("No images found for this search. Try a broader term.");
            }
        } catch (error: any) {
            console.error("Failed to search Unsplash:", error);
            setError(error.message || "Failed to search Unsplash.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size must be less than 5MB");
            return;
        }

        try {
            setIsUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${uuidv4()}.${fileExt}`;
            const bucket = 'company-logos';

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);

            setSelectedUrl(publicUrl);
            setCustomUrl(""); // Clear custom URL if set

            // Optionally auto-select/close
            // onSelect(publicUrl); 
            // onClose();

        } catch (error: any) {
            console.error("Upload failed:", error);
            toast.error(`Failed to upload: ${error.message || 'Unknown error'}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleConfirm = () => {
        const urlToUse = customUrl || selectedUrl;
        if (urlToUse) {
            onSelect(urlToUse);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-gray-950 border-none shadow-2xl rounded-3xl">
                <DialogHeader className="p-8 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                        <ImageIcon className="w-6 h-6 text-primary" />
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    <Tabs defaultValue="unsplash" className="h-full flex flex-col">
                        <div className="px-8 pt-4">
                            <TabsList className="bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
                                <TabsTrigger value="unsplash" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm">
                                    <Search className="w-4 h-4 mr-2" />
                                    Unsplash
                                </TabsTrigger>
                                <TabsTrigger value="upload" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm">
                                    <UploadIcon className="w-4 h-4 mr-2" />
                                    Upload File
                                </TabsTrigger>
                                <TabsTrigger value="url" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm">
                                    <LinkIcon className="w-4 h-4 mr-2" />
                                    Custom URL
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <TabsContent value="unsplash" className="m-0 space-y-6 h-full">
                                <div className="space-y-4">
                                    <div className="flex gap-3">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                placeholder="e.g. Modern swimming pool, luxury backyard..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                className="pl-11 h-12 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20"
                                            />
                                        </div>
                                        <Button
                                            onClick={handleSearch}
                                            disabled={isLoading}
                                            className="h-12 px-6 rounded-xl font-bold uppercase tracking-wider"
                                        >
                                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-4">
                                        <AnimatePresence mode="popLayout">
                                            {searchResults.map((img) => (
                                                <motion.div
                                                    key={img.id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    onClick={() => {
                                                        setSelectedUrl(img.urls.regular);
                                                        setCustomUrl("");
                                                    }}
                                                    className={`relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 ${selectedUrl === img.urls.regular
                                                        ? "ring-4 ring-primary ring-offset-2 dark:ring-offset-gray-950"
                                                        : "hover:scale-[1.02] hover:shadow-lg"
                                                        }`}
                                                >
                                                    <img
                                                        src={img.urls.small}
                                                        alt={img.alt_description}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <p className="text-[10px] text-white font-bold uppercase tracking-tight px-2 text-center">
                                                            Photo by {img.user.name}
                                                        </p>
                                                    </div>
                                                    {selectedUrl === img.urls.regular && (
                                                        <div className="absolute top-2 right-2 bg-primary text-white p-1 rounded-full shadow-lg">
                                                            <Check className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>

                                        {searchResults.length === 0 && !isLoading && !error && (
                                            <div className="col-span-full h-40 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                                                <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                                                <p className="text-xs text-gray-400 font-medium">Search for professional imagery on Unsplash</p>
                                            </div>
                                        )}
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-2xl">
                                            <p className="text-xs text-red-600 dark:text-red-400 font-medium text-center">{error}</p>
                                            {showKeyInput && (
                                                <div className="mt-4 space-y-2">
                                                    <Input
                                                        type="password"
                                                        placeholder="Enter your Unsplash Access Key"
                                                        value={accessKey}
                                                        onChange={(e) => setAccessKey(e.target.value)}
                                                        className="h-10 bg-white/50 dark:bg-black/50 border-red-200"
                                                    />
                                                    <p className="text-[10px] text-red-500/70 italic text-center">
                                                        Get a free key at <a href="https://unsplash.com/developers" target="_blank" rel="noopener noreferrer" className="underline">unsplash.com/developers</a>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="upload" className="m-0 h-full">
                                <div className="h-full flex flex-col items-center justify-center space-y-6">
                                    <div className="w-full max-w-md aspect-video rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center relative overflow-hidden">
                                        {selectedUrl && !searchResults.some(r => r.urls.regular === selectedUrl) ? (
                                            <img src={selectedUrl} alt="Selected" className="absolute inset-0 w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center p-8 space-y-2">
                                                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full shadow-sm flex items-center justify-center mx-auto mb-4">
                                                    <UploadIcon className="w-8 h-8 text-primary" />
                                                </div>
                                                <h3 className="font-bold text-gray-900 dark:text-gray-100">Click to upload</h3>
                                                <p className="text-sm text-gray-500">SVG, PNG, JPG or GIF (max. 5MB)</p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            disabled={isUploading}
                                        />
                                        {isUploading && (
                                            <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center backdrop-blur-sm">
                                                <div className="text-center">
                                                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                                                    <p className="font-bold text-primary">Uploading...</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {!user && (
                                        <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-xl max-w-md">
                                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                            <p className="text-sm font-medium">You must be logged in to upload files.</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="url" className="m-0 h-full">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Custom Image URL</Label>
                                        <Input
                                            placeholder="https://images.unsplash.com/..."
                                            value={customUrl}
                                            onChange={(e) => {
                                                setCustomUrl(e.target.value);
                                                setSelectedUrl(null);
                                            }}
                                            className="h-12 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20"
                                        />
                                        <p className="text-xs text-gray-400">Paste a direct link to an image from the web.</p>
                                    </div>

                                    {(customUrl || (selectedUrl && !searchResults.some(r => r.urls.regular === selectedUrl))) && (
                                        <div className="aspect-video rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                                            <img
                                                src={customUrl || selectedUrl || ""}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Invalid+Image+URL';
                                                }}
                                            />
                                            <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md">
                                                Preview
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <DialogFooter className="p-8 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold uppercase tracking-wider">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedUrl && !customUrl}
                        className="rounded-xl px-8 font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                    >
                        Apply and Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
