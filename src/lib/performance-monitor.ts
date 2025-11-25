import { onCLS, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';

export interface PerformanceMetrics {
  lcp: number | null;
  cls: number | null;
  ttfb: number | null;
  inp: number | null; // Interaction to Next Paint (replaces FID)
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    lcp: null,
    cls: null,
    ttfb: null,
    inp: null,
  };

  private listeners: ((metrics: PerformanceMetrics) => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    try {
      onCLS(this.handleMetric.bind(this));
      onLCP(this.handleMetric.bind(this));
      onTTFB(this.handleMetric.bind(this));
      onINP(this.handleMetric.bind(this));
    } catch (error) {
      console.error('[Performance] Failed to initialize metrics:', error);
    }
  }

  private handleMetric(metric: Metric) {
    switch (metric.name) {
      case 'CLS':
        this.metrics.cls = metric.value;
        break;
      case 'LCP':
        this.metrics.lcp = metric.value;
        break;
      case 'TTFB':
        this.metrics.ttfb = metric.value;
        break;
      case 'INP':
        this.metrics.inp = metric.value;
        break;
    }
    this.notifyListeners();
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.push(callback);
    // Notify immediately with current values
    callback(this.getMetrics());

    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.getMetrics()));
  }
}

export const performanceMonitor = new PerformanceMonitor();
