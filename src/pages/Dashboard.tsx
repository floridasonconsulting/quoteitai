import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Plus, Users, Package, FileText, Clock, TrendingUp, Target, DollarSign, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getQuotes, getCustomers, getItems } from '@/lib/storage';
import { getAgingSummary, getQuoteAge } from '@/lib/quote-utils';
import { Quote } from '@/types';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
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
    const quotesData = getQuotes();
    const customersData = getCustomers();
    const itemsData = getItems();

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
  }, []);

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

  return (
    <div className="space-y-6">
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
              <span className="text-lg font-bold">${stats.avgQuoteValue.toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Pending</span>
              </div>
              <span className="text-lg font-bold">${stats.pendingValue.toFixed(0)}</span>
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
              <span className="text-lg font-bold text-success">${stats.totalRevenue.toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-sm">Declined</span>
              </div>
              <span className="text-lg font-bold text-muted-foreground">${stats.declinedValue.toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t">
              <span className="text-sm font-medium">Potential</span>
              <span className="text-lg font-bold">${(stats.totalRevenue + stats.pendingValue).toFixed(0)}</span>
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
          <div className="grid gap-4 md:grid-cols-4">
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
                      <p className="font-semibold">${quote.total.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(quote.createdAt).toLocaleDateString()}
                      </p>
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
