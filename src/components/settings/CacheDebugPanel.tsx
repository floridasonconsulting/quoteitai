import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCacheQuota, getCacheDetails, clearAllCaches } from "@/lib/cache-manager";
import { Loader2, Trash2, RefreshCw, Database } from "lucide-react";
import { toast } from "sonner";

export function CacheDebugPanel() {
  const [quota, setQuota] = useState<{ usage: number; quota: number; percentage: number }>();
  const [caches, setCaches] = useState<{ name: string; size: number; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const loadCacheInfo = async () => {
    setIsLoading(true);
    try {
      const quotaInfo = await getCacheQuota();
      const cacheInfo = await getCacheDetails();
      setQuota(quotaInfo);
      setCaches(cacheInfo);
    } catch (error) {
      console.error("Failed to load cache info:", error);
      toast.error("Failed to load cache information");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadCacheInfo();
  }, []);
  
  const handleClearCaches = async () => {
    if (!confirm("Are you sure you want to clear all caches? This may affect offline functionality.")) {
      return;
    }
    
    setIsLoading(true);
    try {
      await clearAllCaches();
      toast.success("All caches cleared successfully");
      await loadCacheInfo();
    } catch (error) {
      console.error("Failed to clear caches:", error);
      toast.error("Failed to clear caches");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          <CardTitle>Cache Management</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={loadCacheInfo} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {quota && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Storage Usage</span>
              <span>{quota.percentage}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${Math.min(quota.percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Used: {(quota.usage / 1024 / 1024).toFixed(2)} MB</span>
              <span>Total: {(quota.quota / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Active Caches</h4>
          {caches.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No active caches found</p>
          ) : (
            caches.map((cache) => (
              <div key={cache.name} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div>
                  <p className="font-medium text-sm">{cache.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {cache.count} items
                  </p>
                </div>
                <div className="text-sm font-mono">
                  {(cache.size / 1024).toFixed(2)} KB
                </div>
              </div>
            ))
          )}
        </div>
        
        <Button 
          onClick={handleClearCaches} 
          variant="destructive" 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Clear All Caches
        </Button>
      </CardContent>
    </Card>
  );
}
