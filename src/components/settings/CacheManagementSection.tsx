import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Database, Trash2, RefreshCw, WifiOff, Wifi } from "lucide-react";
import { toast } from "sonner";
import { cacheManager } from "@/lib/cache-manager";

export function CacheManagementSection() {
    const [storageUsage, setStorageUsage] = useState<{ usage: number; quota: number } | null>(null);
    const [cleaning, setCleaning] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine);

    useEffect(() => {
        checkStorage();

        const handleOnline = () => setIsOfflineMode(false);
        const handleOffline = () => setIsOfflineMode(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const checkStorage = async () => {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                setStorageUsage({
                    usage: estimate.usage || 0,
                    quota: estimate.quota || 0
                });
            } catch (e) {
                console.error("Storage estimate failed", e);
            }
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleClearCache = async () => {
        setCleaning(true);
        try {
            // 1. Clear Memory Cache
            await cacheManager.clearAll();

            // 2. Clear Service Worker Caches
            if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(key => caches.delete(key)));
            }

            // 3. Unregister Service Workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                }
            }

            toast.success("Cache cleared successfully. Reloading...");
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error("Failed to clear cache:", error);
            toast.error("Failed to clear cache");
        } finally {
            setCleaning(false);
        }
    };

    const handleUpdateServiceWorker = async () => {
        setUpdating(true);
        try {
            if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.ready;
                await reg.update();
                toast.success("Service Worker updated");
            } else {
                toast.info("Service Worker not supported");
            }
        } catch (error) {
            console.error("Update failed:", error);
            toast.error("Failed to update Service Worker");
        } finally {
            setUpdating(false);
        }
    };

    const percentage = storageUsage ? (storageUsage.usage / storageUsage.quota) * 100 : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Cache & Offline Storage
                </CardTitle>
                <CardDescription>
                    Manage your local data storage and offline capabilities
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Storage Usage */}
                <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Storage Used</span>
                        <span className="font-medium">
                            {storageUsage ? `${formatBytes(storageUsage.usage)} / ${formatBytes(storageUsage.quota)}` : 'Calculating...'}
                        </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                </div>

                {/* Status Indicators */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isOfflineMode ? <WifiOff className="h-4 w-4 text-destructive" /> : <Wifi className="h-4 w-4 text-green-500" />}
                            <span className="text-sm font-medium">Network Status</span>
                        </div>
                        <Badge variant={isOfflineMode ? "destructive" : "outline"} className={!isOfflineMode ? "border-green-500 text-green-500" : ""}>
                            {isOfflineMode ? "Offline" : "Online"}
                        </Badge>
                    </div>

                    <div className="border rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Service Worker</span>
                        </div>
                        <Badge variant="secondary">Active</Badge>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleUpdateServiceWorker}
                        disabled={updating || isOfflineMode}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${updating ? "animate-spin" : ""}`} />
                        Check for Updates
                    </Button>

                    <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={handleClearCache}
                        disabled={cleaning}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {cleaning ? "Clearing..." : "Clear Cache & Reload"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
