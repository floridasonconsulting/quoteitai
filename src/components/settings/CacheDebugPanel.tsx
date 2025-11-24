import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCacheQuota, getCacheDetails, clearAllCaches } from "@/lib/cache-manager";
import { Loader2, Trash2, RefreshCw, Database } from "lucide-react";
import { toast } from "sonner";

export function CacheDebugPanel() {
  const [quota, setQuota] = useState&lt;{ usage: number; quota: number; percentage: number }&gt;();
  const [caches, setCaches] = useState&lt;{ name: string; size: number; count: number }[]&gt;([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const loadCacheInfo = async () =&gt; {
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
  
  useEffect(() =&gt; {
    loadCacheInfo();
  }, []);
  
  const handleClearCaches = async () =&gt; {
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
    &lt;Card&gt;
      &lt;CardHeader className="flex flex-row items-center justify-between"&gt;
        &lt;div className="flex items-center gap-2"&gt;
          &lt;Database className="h-5 w-5" /&gt;
          &lt;CardTitle&gt;Cache Management&lt;/CardTitle&gt;
        &lt;/div&gt;
        &lt;Button variant="ghost" size="icon" onClick={loadCacheInfo} disabled={isLoading}&gt;
          &lt;RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /&gt;
        &lt;/Button&gt;
      &lt;/CardHeader&gt;
      &lt;CardContent className="space-y-6"&gt;
        {quota &amp;&amp; (
          &lt;div className="space-y-2"&gt;
            &lt;div className="flex justify-between text-sm"&gt;
              &lt;span&gt;Storage Usage&lt;/span&gt;
              &lt;span&gt;{quota.percentage}%&lt;/span&gt;
            &lt;/div&gt;
            &lt;div className="h-2 w-full bg-secondary rounded-full overflow-hidden"&gt;
              &lt;div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${Math.min(quota.percentage, 100)}%` }}
              /&gt;
            &lt;/div&gt;
            &lt;div className="flex justify-between text-xs text-muted-foreground"&gt;
              &lt;span&gt;Used: {(quota.usage / 1024 / 1024).toFixed(2)} MB&lt;/span&gt;
              &lt;span&gt;Total: {(quota.quota / 1024 / 1024).toFixed(2)} MB&lt;/span&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        )}
        
        &lt;div className="space-y-3"&gt;
          &lt;h4 className="text-sm font-medium"&gt;Active Caches&lt;/h4&gt;
          {caches.length === 0 ? (
            &lt;p className="text-sm text-muted-foreground italic"&gt;No active caches found&lt;/p&gt;
          ) : (
            caches.map((cache) =&gt; (
              &lt;div key={cache.name} className="flex items-center justify-between p-3 border rounded-lg bg-card"&gt;
                &lt;div&gt;
                  &lt;p className="font-medium text-sm"&gt;{cache.name}&lt;/p&gt;
                  &lt;p className="text-xs text-muted-foreground"&gt;
                    {cache.count} items
                  &lt;/p&gt;
                &lt;/div&gt;
                &lt;div className="text-sm font-mono"&gt;
                  {(cache.size / 1024).toFixed(2)} KB
                &lt;/div&gt;
              &lt;/div&gt;
            ))
          )}
        &lt;/div&gt;
        
        &lt;Button 
          onClick={handleClearCaches} 
          variant="destructive" 
          className="w-full"
          disabled={isLoading}
        &gt;
          {isLoading ? (
            &lt;Loader2 className="mr-2 h-4 w-4 animate-spin" /&gt;
          ) : (
            &lt;Trash2 className="mr-2 h-4 w-4" /&gt;
          )}
          Clear All Caches
        &lt;/Button&gt;
      &lt;/CardContent&gt;
    &lt;/Card&gt;
  );
}
