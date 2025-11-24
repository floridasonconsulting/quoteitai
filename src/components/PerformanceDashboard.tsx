import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { performanceMonitor } from "@/lib/performance-monitor";

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState(performanceMonitor.getMetrics());
  
  useEffect(() =&gt; {
    const unsubscribe = performanceMonitor.subscribe(setMetrics);
    return unsubscribe;
  }, []);
  
  const getScoreClass = (value: number | null, thresholds: [number, number]) =&gt; {
    if (value === null) return "text-gray-400";
    if (value &lt;= thresholds[0]) return "text-green-600";
    if (value &lt;= thresholds[1]) return "text-yellow-600";
    return "text-red-600";
  };
  
  return (
    &lt;Card&gt;
      &lt;CardHeader&gt;
        &lt;CardTitle&gt;Performance Metrics&lt;/CardTitle&gt;
      &lt;/CardHeader&gt;
      &lt;CardContent className="space-y-4"&gt;
        &lt;div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"&gt;
          &lt;div className="p-4 border rounded-lg"&gt;
            &lt;p className="text-sm font-medium text-muted-foreground"&gt;Largest Contentful Paint (LCP)&lt;/p&gt;
            &lt;p className={`text-2xl font-bold ${getScoreClass(metrics.lcp, [2500, 4000])}`}&gt;
              {metrics.lcp ? `${(metrics.lcp / 1000).toFixed(2)}s` : 'Measuring...'}
            &lt;/p&gt;
            &lt;p className="text-xs text-muted-foreground mt-1"&gt;Good: &amp;lt;2.5s | Needs Improvement: 2.5-4s&lt;/p&gt;
          &lt;/div&gt;
          
          &lt;div className="p-4 border rounded-lg"&gt;
            &lt;p className="text-sm font-medium text-muted-foreground"&gt;First Input Delay (FID)&lt;/p&gt;
            &lt;p className={`text-2xl font-bold ${getScoreClass(metrics.fid, [100, 300])}`}&gt;
              {metrics.fid ? `${metrics.fid.toFixed(0)}ms` : 'Measuring...'}
            &lt;/p&gt;
            &lt;p className="text-xs text-muted-foreground mt-1"&gt;Good: &amp;lt;100ms | Needs Improvement: 100-300ms&lt;/p&gt;
          &lt;/div&gt;
          
          &lt;div className="p-4 border rounded-lg"&gt;
            &lt;p className="text-sm font-medium text-muted-foreground"&gt;Cumulative Layout Shift (CLS)&lt;/p&gt;
            &lt;p className={`text-2xl font-bold ${getScoreClass(metrics.cls, [0.1, 0.25])}`}&gt;
              {metrics.cls !== null ? metrics.cls.toFixed(3) : 'Measuring...'}
            &lt;/p&gt;
            &lt;p className="text-xs text-muted-foreground mt-1"&gt;Good: &amp;lt;0.1 | Needs Improvement: 0.1-0.25&lt;/p&gt;
          &lt;/div&gt;
          
          &lt;div className="p-4 border rounded-lg"&gt;
            &lt;p className="text-sm font-medium text-muted-foreground"&gt;Time to First Byte (TTFB)&lt;/p&gt;
            &lt;p className={`text-2xl font-bold ${getScoreClass(metrics.ttfb, [800, 1800])}`}&gt;
              {metrics.ttfb ? `${metrics.ttfb.toFixed(0)}ms` : 'Measuring...'}
            &lt;/p&gt;
            &lt;p className="text-xs text-muted-foreground mt-1"&gt;Good: &amp;lt;800ms | Needs Improvement: 800-1800ms&lt;/p&gt;
          &lt;/div&gt;
          
          &lt;div className="p-4 border rounded-lg"&gt;
            &lt;p className="text-sm font-medium text-muted-foreground"&gt;Interaction to Next Paint (INP)&lt;/p&gt;
            &lt;p className={`text-2xl font-bold ${getScoreClass(metrics.inp, [200, 500])}`}&gt;
              {metrics.inp ? `${metrics.inp.toFixed(0)}ms` : 'Measuring...'}
            &lt;/p&gt;
            &lt;p className="text-xs text-muted-foreground mt-1"&gt;Good: &amp;lt;200ms | Needs Improvement: 200-500ms&lt;/p&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/CardContent&gt;
    &lt;/Card&gt;
  );
}
