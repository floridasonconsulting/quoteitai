import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { performanceMonitor } from "@/lib/performance-monitor";

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState(performanceMonitor.getMetrics());
  
  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe(setMetrics);
    return unsubscribe;
  }, []);
  
  const getScoreClass = (value: number | null, thresholds: [number, number]) => {
    if (value === null) return "text-gray-400";
    if (value <= thresholds[0]) return "text-green-600";
    if (value <= thresholds[1]) return "text-yellow-600";
    return "text-red-600";
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">Largest Contentful Paint (LCP)</p>
            <p className={`text-2xl font-bold ${getScoreClass(metrics.lcp, [2500, 4000])}`}>
              {metrics.lcp ? `${(metrics.lcp / 1000).toFixed(2)}s` : 'Measuring...'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Good: &lt;2.5s | Needs Improvement: 2.5-4s</p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">First Input Delay (FID)</p>
            <p className={`text-2xl font-bold ${getScoreClass(metrics.fid, [100, 300])}`}>
              {metrics.fid ? `${metrics.fid.toFixed(0)}ms` : 'Measuring...'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Good: &lt;100ms | Needs Improvement: 100-300ms</p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">Cumulative Layout Shift (CLS)</p>
            <p className={`text-2xl font-bold ${getScoreClass(metrics.cls, [0.1, 0.25])}`}>
              {metrics.cls !== null ? metrics.cls.toFixed(3) : 'Measuring...'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Good: &lt;0.1 | Needs Improvement: 0.1-0.25</p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">Time to First Byte (TTFB)</p>
            <p className={`text-2xl font-bold ${getScoreClass(metrics.ttfb, [800, 1800])}`}>
              {metrics.ttfb ? `${metrics.ttfb.toFixed(0)}ms` : 'Measuring...'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Good: &lt;800ms | Needs Improvement: 800-1800ms</p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">Interaction to Next Paint (INP)</p>
            <p className={`text-2xl font-bold ${getScoreClass(metrics.inp, [200, 500])}`}>
              {metrics.inp ? `${metrics.inp.toFixed(0)}ms` : 'Measuring...'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Good: &lt;200ms | Needs Improvement: 200-500ms</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
