import { onCLS, onFID, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';

interface PerformanceMetrics {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  ttfb: number | null;
  inp: number | null;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    inp: null,
  };
  
  private listeners: Array&lt;(metrics: PerformanceMetrics) =&gt; void&gt; = [];
  
  constructor() {
    // Check if we are in a browser environment
    if (typeof window !== 'undefined') {
      this.initializeTracking();
    }
  }
  
  private initializeTracking() {
    try {
      onLCP((metric: Metric) =&gt; {
        this.metrics.lcp = metric.value;
        this.notifyListeners();
      });
      
      onFID((metric: Metric) =&gt; {
        this.metrics.fid = metric.value;
        this.notifyListeners();
      });
      
      onCLS((metric: Metric) =&gt; {
        this.metrics.cls = metric.value;
        this.notifyListeners();
      });
      
      onTTFB((metric: Metric) =&gt; {
        this.metrics.ttfb = metric.value;
        this.notifyListeners();
      });
      
      onINP((metric: Metric) =&gt; {
        this.metrics.inp = metric.value;
        this.notifyListeners();
      });
    } catch (error) {
      console.error('[PerformanceMonitor] Failed to initialize metrics:', error);
    }
  }
  
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  public subscribe(callback: (metrics: PerformanceMetrics) =&gt; void): () =&gt; void {
    this.listeners.push(callback);
    // Notify immediately with current values
    callback(this.getMetrics());
    
    return () =&gt; {
      this.listeners = this.listeners.filter((l) =&gt; l !== callback);
    };
  }
  
  private notifyListeners() {
    this.listeners.forEach((listener) =&gt; listener(this.getMetrics()));
  }
}

export const performanceMonitor = new PerformanceMonitor();
