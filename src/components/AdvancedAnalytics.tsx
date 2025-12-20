import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isDemoModeActive } from '@/contexts/DemoContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AIUpgradeDialog } from './AIUpgradeDialog';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Calendar,
  Download,
  BarChart3,
  AlertCircle,
  Lightbulb,
  Plus,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { Quote, Customer } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { getQuotes, getCustomers } from '@/lib/db-service';

interface AdvancedAnalyticsProps {
  quotes?: Quote[];
  customers?: Customer[];
}

export function AdvancedAnalytics({ quotes: propQuotes, customers: propCustomers }: AdvancedAnalyticsProps) {
  const navigate = useNavigate();
  const { user, userRole, isAdmin, isMaxAITier, organizationId } = useAuth();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [timeRange, setTimeRange] = useState<'30' | '90' | '365' | 'all'>('90');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [analytics, setAnalytics] = useState({
    revenueByMonth: [] as { month: string; revenue: number; quotes: number }[],
    winRateBySegment: [] as { segment: string; winRate: number; totalValue: number }[],
    topCustomers: [] as { name: string; totalRevenue: number; quoteCount: number }[],
    conversionFunnel: {
      draft: 0,
      sent: 0,
      accepted: 0,
      declined: 0
    },
    averageTimeToClose: 0,
    customerLifetimeValue: 0,
    monthOverMonthGrowth: 0,
    periodComparison: {
      revenue: { current: 0, previous: 0, change: 0 },
      quotes: { current: 0, previous: 0, change: 0 },
      customers: { current: 0, previous: 0, change: 0 }
    }
  });

  // Load live data from the database service
  const loadLiveData = useCallback(async (showToast = false) => {
    if (!user?.id) {
      // Don't show an error on initial load if user is not ready
      if (showToast) {
        toast.error("Cannot refresh data: User not signed in.");
      }
      console.warn("loadLiveData called without user ID.");
      setIsLoading(false);
      return;
    }

    setIsRefreshing(true);
    try {
      // Use props if provided, otherwise fetch from the database service
      const liveQuotes = propQuotes || await getQuotes(user.id, organizationId, isAdmin || isMaxAITier);
      const liveCustomers = propCustomers || await getCustomers(user.id, organizationId, isAdmin || isMaxAITier);

      console.log('AdvancedAnalytics: Loaded data from db-service', {
        quotesCount: liveQuotes.length,
        customersCount: liveCustomers.length
      });

      setQuotes(liveQuotes);
      setCustomers(liveCustomers);
      setLastRefresh(new Date());

      // Only show toast if explicitly requested (manual refresh)
      if (showToast) {
        toast.success('Analytics data refreshed', {
          description: `Updated with ${liveQuotes.length} quotes and ${liveCustomers.length} customers`
        });
      }
    } catch (error) {
      console.error('Error loading live data from db-service:', error);
      if (showToast) {
        toast.error('Failed to refresh analytics data');
      }
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [user, propQuotes, propCustomers]);

  // Recalculate analytics when data or time range changes
  const calculateAnalytics = useCallback(() => {
    const now = new Date();
    const daysAgo = timeRange === 'all' ? Infinity : parseInt(timeRange);
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    const filteredQuotes = timeRange === 'all'
      ? quotes
      : quotes.filter(q => new Date(q.createdAt) >= cutoffDate);

    // Revenue by month calculation
    const monthlyData: Record<string, { revenue: number; quotes: number }> = {};
    filteredQuotes.forEach(quote => {
      if (quote.status === 'accepted') {
        const month = new Date(quote.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, quotes: 0 };
        }
        monthlyData[month].revenue += quote.total;
        monthlyData[month].quotes += 1;
      }
    });

    const revenueByMonth = Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-12);

    // Win rate by segment
    const segments = {
      'Small (<$1k)': { total: 0, accepted: 0, value: 0 },
      'Medium ($1k-$5k)': { total: 0, accepted: 0, value: 0 },
      'Large ($5k-$20k)': { total: 0, accepted: 0, value: 0 },
      'Enterprise (>$20k)': { total: 0, accepted: 0, value: 0 }
    };

    filteredQuotes.forEach(quote => {
      if (quote.status === 'sent' || quote.status === 'accepted' || quote.status === 'declined') {
        let segment: keyof typeof segments;
        if (quote.total < 1000) segment = 'Small (<$1k)';
        else if (quote.total < 5000) segment = 'Medium ($1k-$5k)';
        else if (quote.total < 20000) segment = 'Large ($5k-$20k)';
        else segment = 'Enterprise (>$20k)';

        segments[segment].total += 1;
        segments[segment].value += quote.total;
        if (quote.status === 'accepted') {
          segments[segment].accepted += 1;
        }
      }
    });

    const winRateBySegment = Object.entries(segments)
      .map(([segment, data]) => ({
        segment,
        winRate: data.total > 0 ? (data.accepted / data.total) * 100 : 0,
        totalValue: data.value
      }))
      .filter(s => s.totalValue > 0);

    // Top customers
    const customerRevenue: Record<string, { revenue: number; quotes: number }> = {};
    filteredQuotes.forEach(quote => {
      if (quote.status === 'accepted') {
        if (!customerRevenue[quote.customerId]) {
          customerRevenue[quote.customerId] = { revenue: 0, quotes: 0 };
        }
        customerRevenue[quote.customerId].revenue += quote.total;
        customerRevenue[quote.customerId].quotes += 1;
      }
    });

    const topCustomers = Object.entries(customerRevenue)
      .map(([customerId, data]) => {
        const customer = customers.find(c => c.id === customerId);
        return {
          name: customer?.name || 'Unknown',
          totalRevenue: data.revenue,
          quoteCount: data.quotes
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Conversion funnel
    const conversionFunnel = {
      draft: filteredQuotes.filter(q => q.status === 'draft').length,
      sent: filteredQuotes.filter(q => q.status === 'sent').length,
      accepted: filteredQuotes.filter(q => q.status === 'accepted').length,
      declined: filteredQuotes.filter(q => q.status === 'declined').length
    };

    // Average time to close
    const acceptedQuotes = filteredQuotes.filter(q => q.status === 'accepted');
    const averageTimeToClose = acceptedQuotes.length > 0
      ? acceptedQuotes.reduce((sum, q) => {
        const sent = new Date(q.createdAt);
        const accepted = new Date(q.updatedAt);
        const days = Math.abs((accepted.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0) / acceptedQuotes.length
      : 0;

    // Customer lifetime value
    const customerLifetimeValue = customers.length > 0
      ? filteredQuotes.filter(q => q.status === 'accepted').reduce((sum, q) => sum + q.total, 0) / customers.length
      : 0;

    // Month over month growth
    const lastTwoMonths = revenueByMonth.slice(-2);
    const monthOverMonthGrowth = lastTwoMonths.length === 2
      ? ((lastTwoMonths[1].revenue - lastTwoMonths[0].revenue) / lastTwoMonths[0].revenue) * 100
      : 0;

    setAnalytics({
      revenueByMonth,
      winRateBySegment,
      topCustomers,
      conversionFunnel,
      averageTimeToClose,
      customerLifetimeValue,
      monthOverMonthGrowth,
      periodComparison: {
        revenue: { current: 0, previous: 0, change: 0 },
        quotes: { current: 0, previous: 0, change: 0 },
        customers: { current: 0, previous: 0, change: 0 }
      }
    });
  }, [quotes, customers, timeRange]);

  // Initial load and auto-refresh setup
  useEffect(() => {
    if (userRole === 'max' || userRole === 'admin' || isDemoModeActive()) {
      // Silent load on mount (no toast)
      loadLiveData(false);

      // Auto-refresh every 5 minutes (silent, no toast)
      const refreshInterval = setInterval(() => {
        loadLiveData(false);
      }, 5 * 60 * 1000);

      return () => clearInterval(refreshInterval);
    }
  }, [userRole, loadLiveData]);

  // Recalculate analytics when data or time range changes
  useEffect(() => {
    if (userRole === 'max' || userRole === 'admin' || isDemoModeActive()) {
      calculateAnalytics();
    }
  }, [quotes, customers, timeRange, userRole, calculateAnalytics]);

  const handleRefresh = () => {
    // Manual refresh shows toast
    loadLiveData(true);
  };

  const handleExport = () => {
    if (userRole !== 'max' && userRole !== 'admin' && !isDemoModeActive()) {
      setShowUpgradeDialog(true);
      return;
    }

    const csvData = [
      ['Advanced Analytics Report'],
      [`Time Range: ${timeRange === 'all' ? 'All Time' : `Last ${timeRange} days`}`],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [`Last Refresh: ${lastRefresh.toLocaleString()}`],
      [],
      ['Revenue by Month'],
      ['Month', 'Revenue', 'Quote Count'],
      ...analytics.revenueByMonth.map(m => [m.month, m.revenue.toFixed(2), m.quotes]),
      [],
      ['Win Rate by Segment'],
      ['Segment', 'Win Rate %', 'Total Value'],
      ...analytics.winRateBySegment.map(s => [s.segment, s.winRate.toFixed(1), s.totalValue.toFixed(2)]),
      [],
      ['Top Customers'],
      ['Customer', 'Total Revenue', 'Quote Count'],
      ...analytics.topCustomers.map(c => [c.name, c.totalRevenue.toFixed(2), c.quoteCount]),
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics exported successfully');
  };

  // Helper functions for dynamic styling
  const getTimeToCloseColor = (days: number) => {
    if (days < 7) return { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' };
    if (days <= 14) return { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' };
    return { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' };
  };

  const getLTVColor = (value: number) => {
    if (value > 5000) return { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' };
    if (value > 1000) return { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' };
    return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' };
  };

  const getConversionColor = (rate: number) => {
    if (rate > 50) return { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' };
    if (rate >= 30) return { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' };
    return { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' };
  };

  const getWinRateColor = (rate: number) => {
    if (rate > 60) return 'bg-success';
    if (rate >= 40) return 'bg-primary';
    return 'bg-warning';
  };

  const hasData = quotes.length >= 5;
  const totalRevenue = analytics.topCustomers.reduce((sum, c) => sum + c.totalRevenue, 0);
  const topThreeRevenue = analytics.topCustomers.slice(0, 3).reduce((sum, c) => sum + c.totalRevenue, 0);
  const conversionRate = analytics.conversionFunnel.sent > 0
    ? (analytics.conversionFunnel.accepted / analytics.conversionFunnel.sent) * 100
    : 0;

  const timeSinceRefresh = Math.floor((new Date().getTime() - lastRefresh.getTime()) / 1000 / 60);
  const refreshText = timeSinceRefresh < 1
    ? 'Just now'
    : timeSinceRefresh < 60
      ? `${timeSinceRefresh}m ago`
      : `${Math.floor(timeSinceRefresh / 60)}h ago`;

  if (userRole !== 'max' && userRole !== 'admin' && !isDemoModeActive()) {
    return (
      <>
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Advanced Analytics
              <Badge variant="secondary" className="ml-auto">Max AI</Badge>
            </CardTitle>
            <CardDescription>
              Unlock detailed analytics, revenue trends, and customer insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg mb-4">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm space-y-1">
                <p className="font-medium">Available in Max AI tier:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Real-time revenue trends</li>
                  <li>Customer lifetime value analysis</li>
                  <li>Win rate by customer segment</li>
                  <li>Conversion funnel visualization</li>
                  <li>Top customer reports</li>
                  <li>Export analytics data</li>
                  <li>Auto-refresh every 5 minutes</li>
                </ul>
              </div>
            </div>
            <Button onClick={() => setShowUpgradeDialog(true)} className="w-full">
              Upgrade to Max AI
            </Button>
          </CardContent>
        </Card>

        <AIUpgradeDialog
          isOpen={showUpgradeDialog}
          onClose={() => setShowUpgradeDialog(false)}
          featureName="advanced_analytics"
          requiredTier="max"
        />
      </>
    );
  }

  if (!hasData) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Advanced Analytics</CardTitle>
          <CardDescription>
            Insights will appear once you have more quote data
          </CardDescription>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground/50" />
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Create More Quotes to Unlock Insights
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                You need at least 5 quotes to see meaningful analytics.
                Currently you have {quotes.length}.
              </p>
              <Button onClick={() => navigate('/quotes/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Quote
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Advanced Analytics
                <Badge variant="outline" className="ml-2">Live Data</Badge>
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                Comprehensive business intelligence • Last updated: {refreshText}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Enhanced Key Metrics Grid with Dynamic Colors */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* MoM Growth Card */}
                <Card className={cn(
                  "transition-all hover:shadow-lg card-hover-lift cursor-pointer",
                  analytics.monthOverMonthGrowth >= 0
                    ? "bg-success/5 border-success/20"
                    : "bg-destructive/5 border-destructive/20"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">MoM Growth</CardTitle>
                      {analytics.monthOverMonthGrowth >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-success" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={cn(
                      "text-3xl font-bold animate-count-up metric-pulse",
                      analytics.monthOverMonthGrowth >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {analytics.monthOverMonthGrowth >= 0 ? '+' : ''}
                      {analytics.monthOverMonthGrowth.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      vs previous month
                    </p>
                  </CardContent>
                </Card>

                {/* Avg Time to Close Card */}
                <Card className={cn(
                  "transition-all hover:shadow-lg card-hover-lift cursor-pointer",
                  getTimeToCloseColor(analytics.averageTimeToClose).bg,
                  getTimeToCloseColor(analytics.averageTimeToClose).border
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Avg Time to Close</CardTitle>
                      <Calendar className={cn(
                        "h-5 w-5",
                        getTimeToCloseColor(analytics.averageTimeToClose).text
                      )} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={cn(
                      "text-3xl font-bold animate-count-up metric-pulse",
                      getTimeToCloseColor(analytics.averageTimeToClose).text
                    )}>
                      {analytics.averageTimeToClose.toFixed(0)} days
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      average deal cycle
                    </p>
                  </CardContent>
                </Card>

                {/* Customer LTV Card */}
                <Card className={cn(
                  "transition-all hover:shadow-lg card-hover-lift cursor-pointer",
                  getLTVColor(analytics.customerLifetimeValue).bg,
                  getLTVColor(analytics.customerLifetimeValue).border
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Customer LTV</CardTitle>
                      <DollarSign className={cn(
                        "h-5 w-5",
                        getLTVColor(analytics.customerLifetimeValue).text
                      )} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={cn(
                      "text-3xl font-bold animate-count-up metric-pulse",
                      getLTVColor(analytics.customerLifetimeValue).text
                    )}>
                      ${analytics.customerLifetimeValue.toFixed(0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      per customer
                    </p>
                  </CardContent>
                </Card>

                {/* Conversion Rate Card */}
                <Card className={cn(
                  "transition-all hover:shadow-lg card-hover-lift cursor-pointer",
                  getConversionColor(conversionRate).bg,
                  getConversionColor(conversionRate).border
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                      <Target className={cn(
                        "h-5 w-5",
                        getConversionColor(conversionRate).text
                      )} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={cn(
                      "text-3xl font-bold animate-count-up metric-pulse",
                      getConversionColor(conversionRate).text
                    )}>
                      {conversionRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      sent to accepted
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Smart Insight Callouts */}
              {analytics.topCustomers.length >= 3 && totalRevenue > 0 && (
                <Alert className="border-primary/20 bg-primary/5">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <AlertTitle>Revenue Concentration Insight</AlertTitle>
                  <AlertDescription>
                    Your top 3 customers generate{' '}
                    <span className="font-bold">
                      {((topThreeRevenue / totalRevenue) * 100).toFixed(0)}%
                    </span>
                    {' '}of total revenue. Consider diversifying your customer base to reduce risk.
                  </AlertDescription>
                </Alert>
              )}

              {analytics.averageTimeToClose > 21 && (
                <Alert className="border-warning/20 bg-warning/5">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <AlertTitle>Long Sales Cycle Alert</AlertTitle>
                  <AlertDescription>
                    Average time to close is{' '}
                    <span className="font-bold">{analytics.averageTimeToClose.toFixed(0)} days</span>.
                    Consider implementing follow-up automation to accelerate deals.
                  </AlertDescription>
                </Alert>
              )}

              {/* Enhanced Conversion Funnel with Colors */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Conversion Funnel</CardTitle>
                  <CardDescription>Visual breakdown of quote journey stages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(analytics.conversionFunnel).map(([stage, count]) => {
                      const colors = {
                        draft: { bg: 'bg-muted-foreground', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
                        sent: { bg: 'bg-primary', text: 'text-primary', dot: 'bg-primary' },
                        accepted: { bg: 'bg-success', text: 'text-success', dot: 'bg-success' },
                        declined: { bg: 'bg-destructive', text: 'text-destructive', dot: 'bg-destructive' }
                      };
                      const total = Object.values(analytics.conversionFunnel).reduce((sum, v) => sum + v, 0);
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      const stageColors = colors[stage as keyof typeof colors];

                      return (
                        <div key={stage} className="space-y-2 group hover:bg-muted/30 p-3 rounded-lg transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-3 h-3 rounded-full", stageColors.dot)} />
                              <span className={cn("font-medium capitalize", stageColors.text)}>
                                {stage}
                              </span>
                            </div>
                            <Badge variant="outline" className={cn("font-bold", stageColors.text)}>
                              {count}
                            </Badge>
                          </div>
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn("h-full transition-all duration-500 animate-fill", stageColors.bg)}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Revenue Trend</CardTitle>
                  <CardDescription>Monthly revenue and quote volume</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64 pr-4">
                    <div className="space-y-3">
                      {analytics.revenueByMonth.map((month, idx) => {
                        const avgRevenue = analytics.revenueByMonth.reduce((s, m) => s + m.revenue, 0) / analytics.revenueByMonth.length;
                        const isAboveAvg = month.revenue >= avgRevenue;
                        return (
                          <div
                            key={idx}
                            className={cn(
                              "flex items-center justify-between p-3 border rounded-lg transition-all hover:shadow-md card-hover-lift",
                              isAboveAvg ? "bg-success/5 border-success/20" : "bg-muted/20"
                            )}
                          >
                            <div>
                              <p className="font-medium">{month.month}</p>
                              <p className="text-sm text-muted-foreground">{month.quotes} quotes</p>
                            </div>
                            <div className="text-right">
                              <p className={cn(
                                "font-bold text-lg",
                                isAboveAvg ? "text-success" : "text-foreground"
                              )}>
                                ${month.revenue.toFixed(0)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Win Rate by Segment</CardTitle>
                  <CardDescription>Conversion rates across deal sizes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.winRateBySegment.map((segment, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{segment.segment}</span>
                          <span className="font-bold">{segment.winRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn("h-full transition-all duration-500", getWinRateColor(segment.winRate))}
                              style={{ width: `${segment.winRate}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-24 text-right">
                            ${segment.totalValue.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Customers by Revenue</CardTitle>
                  <CardDescription>Your most valuable customer relationships</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96 pr-4">
                    <div className="space-y-3">
                      {analytics.topCustomers.map((customer, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-all card-hover-lift",
                            idx < 3 && "bg-gradient-to-r from-primary/5 to-transparent border-primary/20"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm",
                              idx === 0 && "bg-yellow-500/20 text-yellow-600",
                              idx === 1 && "bg-gray-400/20 text-gray-600",
                              idx === 2 && "bg-orange-600/20 text-orange-600",
                              idx > 2 && "bg-primary/10 text-primary"
                            )}>
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-sm text-muted-foreground">{customer.quoteCount} quotes</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">${customer.totalRevenue.toFixed(0)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6 mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Performance Metrics</CardTitle>
                    <CardDescription>Key business indicators</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <span className="text-sm font-medium">Average Quote Value</span>
                      <span className="font-bold">
                        ${(analytics.revenueByMonth.reduce((sum, m) => sum + m.revenue, 0) /
                          Math.max(1, analytics.revenueByMonth.reduce((sum, m) => sum + m.quotes, 0))).toFixed(0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
                      <span className="text-sm font-medium text-success">Total Accepted Quotes</span>
                      <span className="font-bold text-success">{analytics.conversionFunnel.accepted}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <span className="text-sm font-medium text-destructive">Total Declined Quotes</span>
                      <span className="font-bold text-destructive">{analytics.conversionFunnel.declined}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <span className="text-sm font-medium text-primary">Pending Quotes</span>
                      <span className="font-bold text-primary">{analytics.conversionFunnel.sent}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Business Health</CardTitle>
                    <CardDescription>Overall performance snapshot</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-success/10 border border-success/20 rounded-lg card-hover-lift">
                      <p className="text-sm font-medium text-success mb-1">Win Rate Trend</p>
                      <p className="text-3xl font-bold text-success">
                        {((analytics.conversionFunnel.accepted / Math.max(1, analytics.conversionFunnel.sent + analytics.conversionFunnel.accepted)) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className={cn(
                      "p-4 border rounded-lg card-hover-lift",
                      analytics.monthOverMonthGrowth >= 0
                        ? "bg-success/10 border-success/20"
                        : "bg-destructive/10 border-destructive/20"
                    )}>
                      <p className={cn(
                        "text-sm font-medium mb-1",
                        analytics.monthOverMonthGrowth >= 0 ? "text-success" : "text-destructive"
                      )}>
                        Revenue Growth
                      </p>
                      <p className={cn(
                        "text-3xl font-bold",
                        analytics.monthOverMonthGrowth >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {analytics.monthOverMonthGrowth >= 0 ? '+' : ''}{analytics.monthOverMonthGrowth.toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg card-hover-lift">
                      <p className="text-sm font-medium mb-1">Active Customers</p>
                      <p className="text-3xl font-bold">{analytics.topCustomers.length}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AIUpgradeDialog
        isOpen={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        featureName="advanced_analytics"
        requiredTier="max"
      />
    </>
  );
}