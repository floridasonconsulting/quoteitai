
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  PieChart,
  LineChart,
  AlertCircle
} from 'lucide-react';
import { Quote, Customer } from '@/types';
import { toast } from 'sonner';

interface AdvancedAnalyticsProps {
  quotes: Quote[];
  customers: Customer[];
}

export function AdvancedAnalytics({ quotes, customers }: AdvancedAnalyticsProps) {
  const { userRole } = useAuth();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [timeRange, setTimeRange] = useState<'30' | '90' | '365' | 'all'>('90');
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
    monthOverMonthGrowth: 0
  });

  useEffect(() => {
    if (userRole === 'business' || userRole === 'max' || userRole === 'admin') {
      calculateAnalytics();
    }
  }, [quotes, customers, timeRange, userRole]);

  const calculateAnalytics = () => {
    const now = new Date();
    const daysAgo = timeRange === 'all' ? Infinity : parseInt(timeRange);
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    const filteredQuotes = timeRange === 'all' 
      ? quotes 
      : quotes.filter(q => new Date(q.date) >= cutoffDate);

    // Revenue by Month
    const monthlyData: Record<string, { revenue: number; quotes: number }> = {};
    filteredQuotes.forEach(quote => {
      if (quote.status === 'accepted') {
        const month = new Date(quote.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
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
      .slice(-12); // Last 12 months

    // Win Rate by Customer Segment (by quote value)
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

    // Top Customers by Revenue
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

    // Conversion Funnel
    const conversionFunnel = {
      draft: filteredQuotes.filter(q => q.status === 'draft').length,
      sent: filteredQuotes.filter(q => q.status === 'sent').length,
      accepted: filteredQuotes.filter(q => q.status === 'accepted').length,
      declined: filteredQuotes.filter(q => q.status === 'declined').length
    };

    // Average Time to Close (days)
    const acceptedQuotes = filteredQuotes.filter(q => q.status === 'accepted');
    const avgTimeToClose = acceptedQuotes.length > 0
      ? acceptedQuotes.reduce((sum, q) => {
          const sent = new Date(q.date);
          const accepted = new Date(q.updatedAt || q.date);
          const days = Math.abs((accepted.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / acceptedQuotes.length
      : 0;

    // Customer Lifetime Value
    const customerLifetimeValue = customers.length > 0
      ? filteredQuotes.filter(q => q.status === 'accepted').reduce((sum, q) => sum + q.total, 0) / customers.length
      : 0;

    // Month over Month Growth
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
      monthOverMonthGrowth
    });
  };

  const handleExport = () => {
    if (userRole !== 'business' && userRole !== 'max' && userRole !== 'admin') {
      setShowUpgradeDialog(true);
      return;
    }

    const csvData = [
      ['Advanced Analytics Report'],
      [`Time Range: ${timeRange === 'all' ? 'All Time' : `Last ${timeRange} days`}`],
      [`Generated: ${new Date().toLocaleDateString()}`],
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

  if (userRole !== 'business' && userRole !== 'max' && userRole !== 'admin') {
    return (
      <>
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Advanced Analytics
              <Badge variant="secondary" className="ml-auto">Business</Badge>
            </CardTitle>
            <CardDescription>
              Unlock detailed analytics, revenue trends, and customer insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg mb-4">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm space-y-1">
                <p className="font-medium">Available in Business and Max AI tiers:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Revenue trends over time</li>
                  <li>Customer lifetime value analysis</li>
                  <li>Win rate by customer segment</li>
                  <li>Conversion funnel visualization</li>
                  <li>Top customer reports</li>
                  <li>Export analytics data</li>
                </ul>
              </div>
            </div>
            <Button onClick={() => setShowUpgradeDialog(true)} className="w-full">
              Upgrade to Business
            </Button>
          </CardContent>
        </Card>

        <AIUpgradeDialog
          isOpen={showUpgradeDialog}
          onClose={() => setShowUpgradeDialog(false)}
          featureName="advanced_analytics"
          requiredTier="business"
        />
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Advanced Analytics
              </CardTitle>
              <CardDescription>
                Comprehensive business intelligence and performance metrics
              </CardDescription>
            </div>
            <div className="flex gap-2">
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
              {/* Key Metrics Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">MoM Growth</CardTitle>
                      {analytics.monthOverMonthGrowth >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-success" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${analytics.monthOverMonthGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {analytics.monthOverMonthGrowth >= 0 ? '+' : ''}{analytics.monthOverMonthGrowth.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">vs last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Avg Time to Close</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.averageTimeToClose.toFixed(0)} days</div>
                    <p className="text-xs text-muted-foreground mt-1">average</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Customer LTV</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${analytics.customerLifetimeValue.toFixed(0)}</div>
                    <p className="text-xs text-muted-foreground mt-1">per customer</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {((analytics.conversionFunnel.accepted / Math.max(1, analytics.conversionFunnel.sent)) * 100).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">sent to accepted</p>
                  </CardContent>
                </Card>
              </div>

              {/* Conversion Funnel */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Conversion Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(analytics.conversionFunnel).map(([stage, count], idx) => {
                      const total = Object.values(analytics.conversionFunnel).reduce((sum, v) => sum + v, 0);
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      return (
                        <div key={stage} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium capitalize">{stage}</span>
                            <span>{count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                idx === 0 ? 'bg-muted-foreground' :
                                idx === 1 ? 'bg-primary' :
                                idx === 2 ? 'bg-success' :
                                'bg-destructive'
                              }`}
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
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64 pr-4">
                    <div className="space-y-3">
                      {analytics.revenueByMonth.map((month, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{month.month}</p>
                            <p className="text-sm text-muted-foreground">{month.quotes} quotes</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">${month.revenue.toFixed(0)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Win Rate by Segment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.winRateBySegment.map((segment, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{segment.segment}</span>
                          <span>{segment.winRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all"
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
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96 pr-4">
                    <div className="space-y-3">
                      {analytics.topCustomers.map((customer, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
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
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">Average Quote Value</span>
                      <span className="font-bold">
                        ${(analytics.revenueByMonth.reduce((sum, m) => sum + m.revenue, 0) / 
                           Math.max(1, analytics.revenueByMonth.reduce((sum, m) => sum + m.quotes, 0))).toFixed(0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">Total Accepted Quotes</span>
                      <span className="font-bold">{analytics.conversionFunnel.accepted}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">Total Declined Quotes</span>
                      <span className="font-bold">{analytics.conversionFunnel.declined}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">Pending Quotes</span>
                      <span className="font-bold">{analytics.conversionFunnel.sent}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Business Health</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                      <p className="text-sm font-medium text-success">Win Rate Trend</p>
                      <p className="text-2xl font-bold text-success">
                        {((analytics.conversionFunnel.accepted / Math.max(1, analytics.conversionFunnel.sent + analytics.conversionFunnel.accepted)) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <p className="text-sm font-medium text-primary">Revenue Growth</p>
                      <p className="text-2xl font-bold text-primary">
                        {analytics.monthOverMonthGrowth >= 0 ? '+' : ''}{analytics.monthOverMonthGrowth.toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Active Customers</p>
                      <p className="text-2xl font-bold">{analytics.topCustomers.length}</p>
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
        requiredTier="business"
      />
    </>
  );
}
