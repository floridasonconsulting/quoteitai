
import { Users, Package, FileText, Target, DollarSign, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface BasicStatsProps {
  stats: {
    totalQuotes: number;
    totalCustomers: number;
    totalItems: number;
    pendingValue: number;
    acceptanceRate: number;
    avgQuoteValue: number;
    totalRevenue: number;
    declinedValue: number;
  };
}

export function BasicStatCards({ stats }: BasicStatsProps) {
  return (
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
              <span className="text-sm">Total Quotes</span>
            </div>
            <span className="text-lg font-bold">{stats.totalQuotes}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Active Customers</span>
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
              <Target className="h-4 w-4 text-success" />
              <span className="text-sm">Acceptance Rate</span>
            </div>
            <span className="text-lg font-bold text-success">{stats.acceptanceRate.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Avg Quote Value</span>
            </div>
            <span className="text-lg font-bold">{formatCurrency(stats.avgQuoteValue)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <span className="text-sm">Pending Value</span>
            </div>
            <span className="text-lg font-bold text-warning">{formatCurrency(stats.pendingValue)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Group */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Revenue Summary</CardTitle>
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
              <span className="text-sm">Declined Value</span>
            </div>
            <span className="text-lg font-bold text-muted-foreground">{formatCurrency(stats.declinedValue)}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t">
            <span className="text-sm font-medium">Potential Total</span>
            <span className="text-lg font-bold">{formatCurrency(stats.totalRevenue + stats.pendingValue)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
