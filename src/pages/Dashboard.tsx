import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { Plus, Users, Package, FileText, Clock, TrendingUp, Target, DollarSign, TrendingDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getQuotes, getCustomers, getItems } from '@/lib/db-service';
import { getAgingSummary, getQuoteAge } from '@/lib/quote-utils';
import { Quote } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useLoadingState } from '@/hooks/useLoadingState';
import { useSyncManager } from '@/hooks/useSyncManager';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { startLoading, stopLoading } = useLoadingState();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showStuckHelper, setShowStuckHelper] = useState(false);
  const hasLoadedData = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadStartTime = useRef<number>(0);
  const [stats, setStats] = useState({
    totalQuotes: 0,
    totalCustomers: 0,
    totalItems: 0,
    pendingValue: 0,
    acceptanceRate: 0,
    avgQuoteValue: 0,
    totalRevenue: 0,
    declinedValue: 0,
  });

  useEffect(() => {
    if (!authLoading && user && !hasLoadedData.current) {
      console.log('[Dashboard] Loading data for user:', user.id);
      hasLoadedData.current = true;
      loadData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('[Dashboard] Aborted data loading on unmount');
      }
    };
  }, [user, authLoading]);

  // Show "stuck" helper after 10 seconds
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowStuckHelper(true);
      }, 10000);
      return () => clearTimeout(timer);
    } else {
      setShowStuckHelper(false);
    }
  }, [loading]);

  const loadData = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    loadStartTime.current = Date.now();
    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);
    setLoadingProgress([]);

    const operationId = `dashboard-load-${Date.now()}`;
    startLoading(operationId, 'Loading dashboard data');

    const timeoutDuration = 8000; // Reduced from 15s to 8s

    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError('Loading timeout - data took too long to fetch.');
      setLoadingProgress([]);
      stopLoading(operationId);
      console.error('[Dashboard] Timeout after', Date.now() - loadStartTime.current, 'ms');
    }, timeoutDuration);

    try {
      console.log('[Dashboard] Starting parallel data load');
      const startTime = Date.now();
      
      // Load all data in parallel for maximum speed
      setLoadingProgress(['Loading customers', 'Loading items', 'Loading quotes']);
      
      const [customersData, itemsData, quotesData] = await Promise.all([
        getCustomers(user?.id),
        getItems(user?.id),
        getQuotes(user?.id)
      ]);
      
      console.log('[Dashboard] Data loaded in', Date.now() - startTime, 'ms');

      if (abortControllerRef.current?.signal.aborted) {
        console.log('[Dashboard] Load aborted');
        clearTimeout(timeoutId);
        stopLoading(operationId);
        return;
      }

      const pendingValue = quotesData
        .filter(q => q.status === 'sent')
        .reduce((sum, q) => sum + q.total, 0);

      const sentQuotes = quotesData.filter(q => q.status === 'sent' || q.status === 'accepted' || q.status === 'declined');
      const acceptedQuotes = quotesData.filter(q => q.status === 'accepted');
      const acceptanceRate = sentQuotes.length > 0 
        ? (acceptedQuotes.length / sentQuotes.length) * 100 
        : 0;

      const avgQuoteValue = quotesData.length > 0
        ? quotesData.reduce((sum, q) => sum + q.total, 0) / quotesData.length
        : 0;

      const totalRevenue = acceptedQuotes.reduce((sum, q) => sum + q.total, 0);
      
      const declinedValue = quotesData
        .filter(q => q.status === 'declined')
        .reduce((sum, q) => sum + q.total, 0);

      setQuotes(quotesData);
      setStats({
        totalQuotes: quotesData.length,
        totalCustomers: customersData.length,
        totalItems: itemsData.length,
        pendingValue,
        acceptanceRate,
        avgQuoteValue,
        totalRevenue,
        declinedValue,
      });
      
      setLoading(false);
      setLoadingProgress([]);
      setRetryCount(0);
      clearTimeout(timeoutId);
      stopLoading(operationId);
    } catch (error) {
      clearTimeout(timeoutId);
      stopLoading(operationId);
      console.error('[Dashboard] Error:', error, 'Duration:', Date.now() - loadStartTime.current, 'ms');
      setError('Failed to load dashboard data. Please try again.');
      setLoading(false);
      setLoadingProgress([]);
      toast({
        title: 'Error loading data',
        description: 'Could not load dashboard. Check console for details.',
        variant: 'destructive',
      });
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    hasLoadedData.current = false;
    loadData();
  };

  const handleFullReset = async () => {
    try {
      // Clear all caches
      localStorage.removeItem('customers-cache');
      localStorage.removeItem('items-cache');
      localStorage.removeItem('quotes-cache');
      localStorage.removeItem('sync-queue');
      localStorage.removeItem('failed-sync-queue');
      
      // Clear service worker caches
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = () => {
          console.log('[Dashboard] Service worker caches cleared');
        };
        navigator.serviceWorker.controller.postMessage(
          { type: 'CLEAR_ALL_CACHE' },
          [messageChannel.port2]
        );
      }
      
      // Reset state
      hasLoadedData.current = false;
      setRetryCount(0);
      setError(null);
      
      // Reload
      setTimeout(() => {
        loadData();
      }, 500);
    } catch (error) {
      console.error('[Dashboard] Error during reset:', error);
    }
  };

  const agingSummary = getAgingSummary(quotes.filter(q => q.status === 'sent'));
  const recentQuotes = quotes.slice(0, 5);

  const getAgeColor = (age: string) => {
    switch (age) {
      case 'fresh': return 'bg-success/10 text-success border-success/20';
      case 'warm': return 'bg-warning/10 text-warning border-warning/20';
      case 'aging': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'stale': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-success/10 text-success border-success/20';
      case 'sent': return 'bg-primary/10 text-primary border-primary/20';
      case 'draft': return 'bg-muted text-muted-foreground border-border';
      case 'declined': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading dashboard...</p>
        {loadingProgress.length > 0 && (
          <div className="text-sm text-muted-foreground space-y-1">
            {loadingProgress.map((step, i) => (
              <p key={i}>• {step}</p>
            ))}
          </div>
        )}
        <Progress value={33} className="w-48" />
        {showStuckHelper && (
          <Button variant="outline" size="sm" onClick={handleFullReset}>
            Stuck? Click here to reset
          </Button>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-destructive font-medium">{error}</p>
        {retryCount > 0 && (
          <p className="text-sm text-muted-foreground">
            Retry attempt {retryCount} of 3
          </p>
        )}
        <div className="flex gap-2">
          <Button onClick={handleRetry} disabled={retryCount >= 3}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
          <Button variant="outline" onClick={handleFullReset}>
            Clear Cache & Reset
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            Force Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden max-w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back! Here's your business overview.
          </p>
        </div>
        <Button onClick={() => navigate('/quotes/new')} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          New Quote
        </Button>
      </div>

      {/* Stats Grid - Grouped Layout */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Business Overview Group */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Business Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Quotes</span>
              </div>
              <span className="text-lg font-bold">{stats.totalQuotes}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Customers</span>
              </div>
              <span className="text-lg font-bold">{stats.totalCustomers}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Catalog Items</span>
              </div>
              <span className="text-lg font-bold">{stats.totalItems}</span>
            </div>
          </CardContent>
        </Card>

        {/* Sales Performance Group */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sales Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Win Rate</span>
              </div>
              <span className="text-lg font-bold">{stats.acceptanceRate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Avg Value</span>
              </div>
              <span className="text-lg font-bold">{formatCurrency(stats.avgQuoteValue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Pending</span>
              </div>
              <span className="text-lg font-bold">{formatCurrency(stats.pendingValue)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Group */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-sm">Total Revenue</span>
              </div>
              <span className="text-lg font-bold text-success">{formatCurrency(stats.totalRevenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-sm">Declined</span>
              </div>
              <span className="text-lg font-bold text-muted-foreground">{formatCurrency(stats.declinedValue)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t">
              <span className="text-sm font-medium">Potential</span>
              <span className="text-lg font-bold">{formatCurrency(stats.totalRevenue + stats.pendingValue)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aging Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Aging Overview</CardTitle>
          <CardDescription>Track the status of your sent quotes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div 
              className="space-y-2 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate('/quotes?status=sent&age=fresh')}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fresh (≤7 days)</span>
                <Badge variant="outline" className={getAgeColor('fresh')}>
                  {agingSummary.fresh}
                </Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success transition-all"
                  style={{ width: `${(agingSummary.fresh / Math.max(1, agingSummary.fresh + agingSummary.warm + agingSummary.aging + agingSummary.stale)) * 100}%` }}
                />
              </div>
            </div>

            <div 
              className="space-y-2 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate('/quotes?status=sent&age=warm')}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Warm (8-14 days)</span>
                <Badge variant="outline" className={getAgeColor('warm')}>
                  {agingSummary.warm}
                </Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-warning transition-all"
                  style={{ width: `${(agingSummary.warm / Math.max(1, agingSummary.fresh + agingSummary.warm + agingSummary.aging + agingSummary.stale)) * 100}%` }}
                />
              </div>
            </div>

            <div 
              className="space-y-2 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate('/quotes?status=sent&age=aging')}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Aging (15-30 days)</span>
                <Badge variant="outline" className={getAgeColor('aging')}>
                  {agingSummary.aging}
                </Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-destructive transition-all"
                  style={{ width: `${(agingSummary.aging / Math.max(1, agingSummary.fresh + agingSummary.warm + agingSummary.aging + agingSummary.stale)) * 100}%` }}
                />
              </div>
            </div>

            <div 
              className="space-y-2 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate('/quotes?status=sent&age=stale')}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Stale (&gt;30 days)</span>
                <Badge variant="outline" className={getAgeColor('stale')}>
                  {agingSummary.stale}
                </Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-destructive transition-all"
                  style={{ width: `${(agingSummary.stale / Math.max(1, agingSummary.fresh + agingSummary.warm + agingSummary.aging + agingSummary.stale)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Quotes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Quotes</CardTitle>
              <CardDescription>Your latest quote activity</CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate('/quotes')}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentQuotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No quotes yet. Create your first quote to get started!</p>
              <Button className="mt-4" onClick={() => navigate('/quotes/new')}>
                Create Quote
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentQuotes.map((quote) => {
                const age = getQuoteAge(quote);
                return (
                  <div
                    key={quote.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/quotes/${quote.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{quote.title}</p>
                        <Badge variant="outline" className={getStatusColor(quote.status)}>
                          {quote.status}
                        </Badge>
                        {quote.status === 'sent' && (
                          <Badge variant="outline" className={getAgeColor(age)}>
                            {age}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{quote.customerName}</span>
                        <span>•</span>
                        <span>{quote.quoteNumber}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold">{formatCurrency(quote.total)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
