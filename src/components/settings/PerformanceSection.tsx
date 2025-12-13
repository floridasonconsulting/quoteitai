import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, Layout, MousePointerClick, Zap, LucideIcon } from "lucide-react";
import { performanceMonitor, type PerformanceMetrics } from "@/lib/performance-monitor";

export function PerformanceSection() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(performanceMonitor.getMetrics());

  useEffect(() => {
    // Subscribe to performance updates
    const unsubscribe = performanceMonitor.subscribe((newMetrics) => {
      setMetrics(newMetrics);
    });

    return () => unsubscribe();
  }, []);

  // Helper to determine metric status color
  const getStatusColor = (value: number | null, thresholds: { good: number; poor: number }) => {
    if (value === null) return "bg-muted text-muted-foreground";
    if (value <= thresholds.good) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 hover:bg-green-100";
    if (value > thresholds.poor) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 hover:bg-red-100";
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 hover:bg-yellow-100";
  };

  // Helper to determine metric status text
  const getStatusText = (value: number | null, thresholds: { good: number; poor: number }) => {
    if (value === null) return "Waiting...";
    if (value <= thresholds.good) return "Good";
    if (value > thresholds.poor) return "Poor";
    return "Needs Improvement";
  };

  const formatValue = (value: number | null, unit: string = "ms") => {
    if (value === null) return "--";
    return `${Math.round(value)}${unit}`;
  };

  const MetricCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    thresholds,
    unit = "ms"
  }: { 
    title: string; 
    value: number | null; 
    description: string; 
    icon: LucideIcon; 
    thresholds: { good: number; poor: number };
    unit?: string;
  }) => (
    <div className="flex flex-col p-4 border rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{title}</span>
        </div>
        <Badge variant="secondary" className={getStatusColor(value, thresholds)}>
          {getStatusText(value, thresholds)}
        </Badge>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold">{formatValue(value, unit)}</span>
        {value !== null && (
          <span className="text-xs text-muted-foreground mb-1">
            Target: &lt;{thresholds.good}{unit}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Monitor
        </CardTitle>
        <CardDescription>
          Real-time Core Web Vitals metrics for your current session
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="LCP (Loading)"
            value={metrics.lcp}
            description="Largest Contentful Paint: Time to see the main content."
            icon={Zap}
            thresholds={{ good: 2500, poor: 4000 }}
          />
          <MetricCard
            title="INP (Interactivity)"
            value={metrics.inp}
            description="Interaction to Next Paint: responsiveness to clicks/inputs."
            icon={MousePointerClick}
            thresholds={{ good: 200, poor: 500 }}
          />
          <MetricCard
            title="CLS (Stability)"
            value={metrics.cls}
            description="Cumulative Layout Shift: unexpected layout movement."
            icon={Layout}
            thresholds={{ good: 0.1, poor: 0.25 }}
            unit=""
          />
          <MetricCard
            title="TTFB (Server)"
            value={metrics.ttfb}
            description="Time to First Byte: server response time."
            icon={Clock}
            thresholds={{ good: 800, poor: 1800 }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
