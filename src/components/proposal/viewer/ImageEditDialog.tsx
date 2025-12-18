import { useState } from "react";
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

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsLoading(true);
        try {
            const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&client_id=QnCH4kO-p9J8m9_qWw8oT0v-jS6-Vf3-_4R0V_X8-g0&per_page=12`);
            const data = await response.json();
            setSearchResults(data.results || []);
        } catch (error) {
            console.error("Failed to search Unsplash:", error);
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

                        {searchResults.length === 0 && !isLoading && (
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
