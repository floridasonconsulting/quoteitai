
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, RefreshCw, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { QuickBooksClient } from "@/integrations/quickbooks/client";
import { QuickBooksSyncService } from "@/integrations/quickbooks/sync-service";
import { useAuth } from "@/contexts/AuthContext";

export function QuickBooksSection() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [companyName, setCompanyName] = useState<string>("");

  const qbClient = new QuickBooksClient();
  const syncService = new QuickBooksSyncService();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const tokens = qbClient.getStoredTokens();
      if (tokens && user) {
        setIsConnected(true);
        // Fetch company info to display
        const companyInfo = await qbClient.getCompanyInfo();
        setCompanyName(companyInfo.CompanyName);
        
        // Get last sync time from localStorage
        const lastSyncStr = localStorage.getItem(`qb_last_sync_${user.id}`);
        if (lastSyncStr) {
          setLastSync(new Date(lastSyncStr));
        }
      }
    } catch (error) {
      console.error("Failed to check QuickBooks connection:", error);
      setIsConnected(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const authUrl = qbClient.getAuthorizationUrl();
      
      // Open OAuth window
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const authWindow = window.open(
        authUrl,
        "QuickBooks Authorization",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Poll for OAuth callback
      const pollTimer = setInterval(() => {
        try {
          if (authWindow?.closed) {
            clearInterval(pollTimer);
            setIsConnecting(false);
            checkConnection();
          }
        } catch (error) {
          console.error("Error polling auth window:", error);
        }
      }, 500);

      // Listen for OAuth callback message
      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === "quickbooks_oauth_callback") {
          const { code, realmId } = event.data;
          
          try {
            await qbClient.handleCallback(code, realmId);
            setIsConnected(true);
            toast.success("QuickBooks connected successfully!");
            checkConnection();
          } catch (error) {
            console.error("OAuth callback error:", error);
            toast.error("Failed to connect QuickBooks. Please try again.");
          } finally {
            authWindow?.close();
            window.removeEventListener("message", handleMessage);
          }
        }
      };

      window.addEventListener("message", handleMessage);
    } catch (error) {
      console.error("Failed to initiate QuickBooks connection:", error);
      toast.error("Failed to connect to QuickBooks");
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await qbClient.disconnect();
      setIsConnected(false);
      setCompanyName("");
      setLastSync(null);
      toast.success("QuickBooks disconnected");
    } catch (error) {
      console.error("Failed to disconnect QuickBooks:", error);
      toast.error("Failed to disconnect QuickBooks");
    }
  };

  const handleSync = async () => {
    if (!user) return;
    
    setIsSyncing(true);
    try {
      // Sync customers from QuickBooks
      await syncService.syncCustomersFromQuickBooks(user.id);
      
      // Update last sync time
      const now = new Date();
      setLastSync(now);
      localStorage.setItem(`qb_last_sync_${user.id}`, now.toISOString());
      
      toast.success("QuickBooks data synced successfully!");
    } catch (error) {
      console.error("Failed to sync QuickBooks data:", error);
      toast.error("Failed to sync QuickBooks data");
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
              Connect your QuickBooks Online account to sync customers and create invoices automatically
            </CardDescription>
          </div>
          {isConnected && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <>
            <Alert>
              <AlertDescription>
                Connecting QuickBooks enables:
                <ul className="mt-2 ml-4 list-disc space-y-1">
                  <li>Automatic customer sync from QuickBooks to Quote-It AI</li>
                  <li>Create QuickBooks invoices from accepted quotes</li>
                  <li>Track payments in both systems</li>
                  <li>Sync chart of accounts for accurate categorization</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={handleConnect} 
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect QuickBooks Online
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Company:</span>
                <span className="font-medium">{companyName}</span>
              </div>
              {lastSync && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Sync:</span>
                  <span className="font-medium">
                    {lastSync.toLocaleDateString()} at {lastSync.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSync} 
                disabled={isSyncing}
                variant="outline"
                className="flex-1"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Now
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleDisconnect}
                variant="outline"
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                <strong>Note:</strong> Syncing will import all customers from QuickBooks and update existing records. 
                Invoices will be created in QuickBooks when quotes are accepted and paid.
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
}
