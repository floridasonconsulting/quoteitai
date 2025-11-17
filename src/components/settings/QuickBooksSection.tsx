import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function QuickBooksSection() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const handleConnect = async () => {
    try {
      setError(null);
      toast.info("QuickBooks integration coming soon!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect to QuickBooks";
      setError(message);
      toast.error(message);
    }
  };

  const handleDisconnect = async () => {
    try {
      setError(null);
      setIsConnected(false);
      setLastSync(null);
      toast.success("Disconnected from QuickBooks");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to disconnect";
      setError(message);
      toast.error(message);
    }
  };

  const handleSync = async () => {
    try {
      setError(null);
      setIsSyncing(true);
      toast.info("Syncing with QuickBooks...");
      
      // Sync logic would go here
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setLastSync(new Date());
      toast.success("QuickBooks sync completed!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sync with QuickBooks";
      setError(message);
      toast.error(message);
    } finally {
      setIsSyncing(false);
    }
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
            <Button onClick={handleConnect} className="w-full">
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
            QuickBooks integration is currently in development. Full functionality coming soon!
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
