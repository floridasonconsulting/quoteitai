import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getQuotes, getCustomers, getItems } from "@/lib/storage";
import type { Quote, Customer, Item } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, DollarSign, Users, FileText, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import BasicStatCards from "@/components/dashboard/BasicStatCards";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isFetchingRef = useRef(false);

  // Determine if user has access to advanced analytics
  const hasAdvancedTier = user?.subscription_tier === "business" || user?.subscription_tier === "max_ai";

  useEffect(() => {
    if (isFetchingRef.current) return;
    
    const fetchData = async () => {
      isFetchingRef.current = true;
      try {
        const [quotesData, customersData, itemsData] = await Promise.all([
          getQuotes(),
          getCustomers(),
          getItems()
        ]);
        setQuotes(quotesData);
        setCustomers(customersData);
        setItems(itemsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchData();
  }, []);

  // Calculate statistics for all users
  const stats = {
    totalQuotes: quotes.length,
    activeQuotes: quotes.filter(q => q.status === "sent").length,
    totalRevenue: quotes
      .filter(q => q.status === "accepted")
      .reduce((sum, q) => sum + (q.total || 0), 0),
    acceptanceRate: quotes.length > 0
      ? (quotes.filter(q => q.status === "accepted").length / quotes.filter(q => q.status !== "draft").length) * 100
      : 0,
    totalCustomers: customers.length,
    totalItems: items.length
  };

  // Calculate aging summary for Quote Aging Overview
  const agingSummary = {
    fresh: quotes.filter(q => {
      const daysSince = Math.floor((Date.now() - new Date(q.date).getTime()) / (1000 * 60 * 60 * 24));
      return q.status === "sent" && daysSince <= 7;
    }).length,
    warm: quotes.filter(q => {
      const daysSince = Math.floor((Date.now() - new Date(q.date).getTime()) / (1000 * 60 * 60 * 24));
      return q.status === "sent" && daysSince > 7 && daysSince <= 14;
    }).length,
    aging: quotes.filter(q => {
      const daysSince = Math.floor((Date.now() - new Date(q.date).getTime()) / (1000 * 60 * 60 * 24));
      return q.status === "sent" && daysSince > 14 && daysSince <= 30;
    }).length,
    stale: quotes.filter(q => {
      const daysSince = Math.floor((Date.now() - new Date(q.date).getTime()) / (1000 * 60 * 60 * 24));
      return q.status === "sent" && daysSince > 30;
    }).length
  };

  // Get recent quotes for Free/Pro users
  const recentQuotes = quotes
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 pb-20 md:pb-6">
      {/* Header - All Users */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your business overview.
          </p>
        </div>
        <Button onClick={() => navigate("/quotes/new")} size="lg" className="w-full md:w-auto">
          <Plus className="mr-2 h-5 w-5" />
          New Quote
        </Button>
      </div>

      {/* Core Stats - All Users */}
      <BasicStatCards stats={stats} />

      {/* Quote Aging Overview - All Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quote Aging Overview
          </CardTitle>
          <CardDescription>
            Track the status of your sent quotes by age
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-success/5 border-success/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fresh</p>
                    <p className="text-xs text-muted-foreground">0-7 days</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <p className="text-3xl font-bold text-success mt-2">{agingSummary.fresh}</p>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Warm</p>
                    <p className="text-xs text-muted-foreground">8-14 days</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <p className="text-3xl font-bold text-primary mt-2">{agingSummary.warm}</p>
              </CardContent>
            </Card>

            <Card className="bg-warning/5 border-warning/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Aging</p>
                    <p className="text-xs text-muted-foreground">15-30 days</p>
                  </div>
                  <AlertCircle className="h-5 w-5 text-warning" />
                </div>
                <p className="text-3xl font-bold text-warning mt-2">{agingSummary.aging}</p>
              </CardContent>
            </Card>

            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Stale</p>
                    <p className="text-xs text-muted-foreground">30+ days</p>
                  </div>
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <p className="text-3xl font-bold text-destructive mt-2">{agingSummary.stale}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Tiered Content */}
      {hasAdvancedTier ? (
        /* Business/Max Users: Show Enhanced Advanced Analytics */
        <AdvancedAnalytics quotes={quotes} customers={customers} />
      ) : (
        /* Free/Pro Users: Show Recent Quotes */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Quotes</CardTitle>
                <CardDescription>Your latest quote activity</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/quotes")}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentQuotes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No quotes yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first quote to get started
                </p>
                <Button onClick={() => navigate("/quotes/new")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Quote
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentQuotes.map((quote) => {
                  const customer = customers.find(c => c.id === quote.customerId);
                  return (
                    <Card
                      key={quote.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/quotes/${quote.id}`)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{quote.title || "Untitled Quote"}</h4>
                            <p className="text-sm text-muted-foreground">
                              {customer?.name || "Unknown Customer"}
                            </p>
                          </div>
                          <Badge
                            variant={
                              quote.status === "accepted"
                                ? "default"
                                : quote.status === "sent"
                                ? "secondary"
                                : quote.status === "declined"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {quote.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {format(new Date(quote.date), "MMM d, yyyy")}
                          </span>
                          <span className="font-semibold">
                            ${(quote.total || 0).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
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