export interface APIMetric {
  endpoint: string;
  method: string;
  duration: number;
  timestamp: number;
  status: 'success' | 'error';
}

class APIPerformanceTracker {
  private metrics: APIMetric[] = [];
  private listeners: ((metrics: APIMetric[]) => void)[] = [];
  private MAX_HISTORY = 100;

  track(endpoint: string, method: string, duration: number, status: 'success' | 'error') {
    const metric: APIMetric = {
      endpoint,
      method,
      duration,
      timestamp: Date.now(),
      status
    };

    this.metrics.unshift(metric);
    if (this.metrics.length > this.MAX_HISTORY) {
      this.metrics.pop();
    }

    this.notifyListeners();
  }

  getMetrics(): APIMetric[] {
    return [...this.metrics];
  }

  getStats() {
    const durations = this.metrics.map(m => m.duration).sort((a, b) => a - b);
    const total = durations.length;
    if (total === 0) return { p50: 0, p95: 0, p99: 0, avg: 0, errorRate: 0, count: 0 };

    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / total;
    const p50 = durations[Math.floor(total * 0.5)];
    const p95 = durations[Math.floor(total * 0.95)];
    const p99 = durations[Math.floor(total * 0.99)];
    
    const errors = this.metrics.filter(m => m.status === 'error').length;
    const errorRate = (errors / total) * 100;

    return { p50, p95, p99, avg, errorRate, count: total };
  }

  getSlowestEndpoints(limit = 5): { endpoint: string, avgDuration: number }[] {
    const endpointStats = new Map<string, { count: number, totalDuration: number }>();
    
    this.metrics.forEach(m => {
      const current = endpointStats.get(m.endpoint) || { count: 0, totalDuration: 0 };
      endpointStats.set(m.endpoint, {
        count: current.count + 1,
        totalDuration: current.totalDuration + m.duration
      });
    });

    return Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgDuration: stats.totalDuration / stats.count
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);
  }

  subscribe(callback: (metrics: APIMetric[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.getMetrics()));
  }
}

export const apiTracker = new APIPerformanceTracker();
