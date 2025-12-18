import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Image as ImageIcon, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UnsplashImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [customUrl, setCustomUrl] = useState("");
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const [accessKey, setAccessKey] = useState(import.meta.env.VITE_UNSPLASH_ACCESS_KEY || "");
    const [showKeyInput, setShowKeyInput] = useState(!import.meta.env.VITE_UNSPLASH_ACCESS_KEY);

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

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Unsplash Search Section */}
                    <div className="space-y-4">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Search Unsplash</label>
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

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

                        {searchResults.length === 0 && !isLoading && !error && (
                            <div className="h-40 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                                <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                                <p className="text-xs text-gray-400 font-medium">Search for professional imagery on Unsplash</p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 py-2">
                        <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">OR</span>
                        <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                    </div>

                    {/* Custom URL Section */}
                    <div className="space-y-4">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Custom Image URL</label>
                        <Input
                            placeholder="https://images.unsplash.com/..."
                            value={customUrl}
                            onChange={(e) => {
                                setCustomUrl(e.target.value);
                                setSelectedUrl(null);
                            }}
                            className="h-12 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                    </div>
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
