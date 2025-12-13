import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function QuickBooksSection() {
  const [isConnected] = useState(false);
  const [isSyncing] = useState(false);
  const [error] = useState<string | null>(null);
  const [lastSync] = useState<Date | null>(null);

  const handleConnect = () => {
    toast.info("QuickBooks integration coming soon! This feature is currently in development.");
  };

  const handleDisconnect = () => {
    toast.info("QuickBooks integration coming soon!");
  };

  const handleSync = () => {
    toast.info("QuickBooks integration coming soon!");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>QuickBooks Integration</CardTitle>
            <CardDescription>
              Sync customers, invoices, and payments with QuickBooks Online
            </CardDescription>
          </div>
          {isConnected && (
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isConnected ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your QuickBooks Online account to automatically sync customer data and create invoices.
            </p>
            <Button onClick={handleConnect} className="w-full" variant="secondary">
              Connect QuickBooks
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Last Sync</span>
              <span className="text-sm text-muted-foreground">
                {lastSync ? lastSync.toLocaleString() : "Never"}
              </span>
            </div>

            <Button 
              onClick={handleSync} 
              disabled={isSyncing}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Now"}
            </Button>

            <Button 
              onClick={handleDisconnect}
              variant="outline"
              className="w-full"
            >
              Disconnect QuickBooks
            </Button>
          </div>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Coming Soon:</strong> QuickBooks integration is currently in development. Full functionality will be available in a future update!
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
