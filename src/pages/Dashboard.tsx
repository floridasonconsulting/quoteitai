import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { flushSync } from "react-dom";
import { Plus, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getQuotes, getCustomers, getItems, clearInFlightRequests } from "@/lib/db-service";
import { getAgingSummary, getQuoteAge } from "@/lib/quote-utils";
import { Quote, Customer } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useLoadingState } from "@/hooks/useLoadingState";
import { AdvancedAnalytics } from "@/components/AdvancedAnalytics";
import { BasicStatCards } from "@/components/dashboard/BasicStatCards";
import { storageCache } from "@/lib/storage-cache";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, userRole } = useAuth();
  const { startLoading, stopLoading } = useLoadingState();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const hasLoadedData = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
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
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Determine if user has advanced tier (Business/Max/Admin)
  const hasAdvancedTier = userRole === "business" || userRole === "max" || userRole === "admin";

  useEffect(() => {
    if (user && !hasLoadedData.current) {
      hasLoadedData.current = true;
      loadData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [user]);

  const loadData = async () => {
    if (hasLoadedData.current && !loading && quotes.length > 0) {
      return;
    }

    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      return;
    }

    clearInFlightRequests();

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    const operationId = `dashboard-load-${Date.now()}`;
    startLoading(operationId, "Loading dashboard data");

    const timeoutDuration = 15000;

    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError("Loading timeout - data took too long to fetch.");
      stopLoading(operationId);
    }, timeoutDuration);

    try {
      const [quotesData, customersData, itemsData] = await Promise.all([
        getQuotes(user?.id),
        getCustomers(user?.id),
        getItems(user?.id)
      ]);
      
      const pendingValue = quotesData
        .filter(q => q.status === "sent")
        .reduce((sum, q) => sum + q.total, 0);

      const sentQuotes = quotesData.filter(q => q.status === "sent" || q.status === "accepted" || q.status === "declined");
      const acceptedQuotes = quotesData.filter(q => q.status === "accepted");
      const acceptanceRate = sentQuotes.length > 0 
        ? (acceptedQuotes.length / sentQuotes.length) * 100 
        : 0;

      const avgQuoteValue = quotesData.length > 0
        ? quotesData.reduce((sum, q) => sum + q.total, 0) / quotesData.length
        : 0;

      const totalRevenue = acceptedQuotes.reduce((sum, q) => sum + q.total, 0);
      
      const declinedValue = quotesData
        .filter(q => q.status === "declined")
        .reduce((sum, q) => sum + q.total, 0);

      const newStats = {
        totalQuotes: quotesData.length,
        totalCustomers: customersData.length,
        totalItems: itemsData.length,
        pendingValue,
        acceptanceRate,
        avgQuoteValue,
        totalRevenue,
        declinedValue,
      };

      flushSync(() => {
        setQuotes(quotesData);
        setCustomers(customersData);
        setStats(newStats);
        setRetryCount(0);
        setError(null);
        setLoading(false);
      });
      
      clearTimeout(timeoutId);
      stopLoading(operationId);
    } catch (error) {
      clearTimeout(timeoutId);
      stopLoading(operationId);
      if (error instanceof Error && error.name !== 'AbortError') {
        setError("Failed to load dashboard data. Please try again.");
        toast({
          title: "Error loading data",
          description: "Could not load dashboard. Please try refreshing.",
          variant: "destructive",
        });
      }
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    hasLoadedData.current = false;
    loadData();
  };

  const handleFullReset = async () => {
    try {
      // Clear all storage cache entries
      storageCache.clear();
      
      // Also clear any legacy direct localStorage entries
      localStorage.removeItem("sync-queue");
      localStorage.removeItem("failed-sync-queue");
      
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();
        navigator.serviceWorker.controller.postMessage(
          { type: "CLEAR_ALL_CACHE" },
          [messageChannel.port2]
        );
      }
      
      hasLoadedData.current = false;
      setRetryCount(0);
      setError(null);
      
      toast({
        title: "Cache cleared",
        description: "All cached data has been cleared. Reloading...",
      });
      
      setTimeout(() => {
        loadData();
      }, 500);
    } catch (error) {
      console.error("Error during reset:", error);
      toast({
        title: "Reset failed",
        description: "Could not clear cache. Please try refreshing the page.",
        variant: "destructive",
      });
    }
  };

  const agingSummary = getAgingSummary(quotes.filter(q => q.status === "sent"));
  const recentQuotes = quotes.slice(0, 5);

  const getAgeColor = (age: string) => {
    switch (age) {
      case "fresh": return "bg-success/10 text-success border-success/20";
      case "warm": return "bg-warning/10 text-warning border-warning/20";
      case "aging": return "bg-destructive/10 text-destructive border-destructive/20";
      case "stale": return "bg-destructive/20 text-destructive border-destructive/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted": return "bg-success/10 text-success border-success/20";
      case "sent": return "bg-primary/10 text-primary border-primary/20";
      case "draft": return "bg-muted text-muted-foreground border-border";
      case "declined": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading || authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
             <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24"/>
                  <Skeleton className="h-4 w-4"/>
              </CardHeader>
              <CardContent>
                  <Skeleton className="h-8 w-20 mb-1"/>
                  <Skeleton className="h-3 w-40"/>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48 mb-2"/>
                <Skeleton className="h-4 w-80"/>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="space-y-2 p-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24"/>
                    <Skeleton className="h-6 w-12"/>
                  </div>
                  <Skeleton className="h-2 w-full"/>
                </div>
              ))}
            </CardContent>
        </Card>
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
      {/* Header - All Users */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back! Here's your business overview.
          </p>
        </div>
        <Button onClick={() => navigate("/quotes/new")} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          New Quote
        </Button>
      </div>

      {/* Core Stats - All Users */}
      <BasicStatCards stats={stats} />

      {/* Quote Aging Overview - All Users */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Aging Overview</CardTitle>
          <CardDescription>Track the status of your sent quotes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div 
              className="space-y-2 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate("/quotes?status=sent&age=fresh")}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fresh (≤7 days)</span>
                <Badge variant="outline" className={getAgeColor("fresh")}>
                  {agingSummary.fresh}
                </Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success transition-all"
                  style={{ width: `${(agingSummary.fresh / Math.max(1, quotes.filter(q=>q.status === 'sent').length)) * 100}%` }}
                />
              </div>
            </div>

            <div 
              className="space-y-2 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate("/quotes?status=sent&age=warm")}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Warm (8-14 days)</span>
                <Badge variant="outline" className={getAgeColor("warm")}>
                  {agingSummary.warm}
                </Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-warning transition-all"
                  style={{ width: `${(agingSummary.warm / Math.max(1, quotes.filter(q=>q.status === 'sent').length)) * 100}%` }}
                />
              </div>
            </div>

            <div 
              className="space-y-2 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate("/quotes?status=sent&age=aging")}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Aging (15-30 days)</span>
                <Badge variant="outline" className={getAgeColor("aging")}>
                  {agingSummary.aging}
                </Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-destructive transition-all"
                  style={{ width: `${(agingSummary.aging / Math.max(1, quotes.filter(q=>q.status === 'sent').length)) * 100}%` }}
                />
              </div>
            </div>

            <div 
              className="space-y-2 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate("/quotes?status=sent&age=stale")}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Stale (&gt;30 days)</span>
                <Badge variant="outline" className={getAgeColor("stale")}>
                  {agingSummary.stale}
                </Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-destructive transition-all"
                  style={{ width: `${(agingSummary.stale / Math.max(1, quotes.filter(q=>q.status === 'sent').length)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tiered Content - Business/Max users see Advanced Analytics, Free/Pro users see Recent Quotes */}
      {hasAdvancedTier ? (
        /* Business/Max/Admin: Show Advanced Analytics */
        <AdvancedAnalytics />
      ) : (
        /* Free/Pro: Show Recent Quotes */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Quotes</CardTitle>
                <CardDescription>Your latest quote activity</CardDescription>
              </div>
              <Button variant="outline" onClick={() => navigate("/quotes")}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentQuotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No quotes yet. Create your first quote to get started!</p>
                <Button className="mt-4" onClick={() => navigate("/quotes/new")}>
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
                          {quote.status === "sent" && (
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
      )}
    </div>
  );
}
