import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, RefreshCw, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function QuickBooksSection() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      // Safely check localStorage for QuickBooks connection
      const tokens = localStorage.getItem(`qb_tokens_${user?.id}`);
      if (tokens && user) {
        setIsConnected(true);
        
        // Get company name if stored
        const storedCompanyName = localStorage.getItem(`qb_company_name_${user.id}`);
        if (storedCompanyName) {
          setCompanyName(storedCompanyName);
        }
        
        // Get last sync time from localStorage
        const lastSyncStr = localStorage.getItem(`qb_last_sync_${user.id}`);
        if (lastSyncStr) {
          setLastSync(new Date(lastSyncStr));
        }
      }
    } catch (error) {
      console.error("Failed to check QuickBooks connection:", error);
      setError("Failed to load QuickBooks connection status");
      setIsConnected(false);
    }
  };

  const handleConnect = async () => {
    toast.info("QuickBooks integration is currently in development. Check back soon!");
  };

  const handleDisconnect = async () => {
    try {
      if (!user) return;
      
      localStorage.removeItem(`qb_tokens_${user.id}`);
      localStorage.removeItem(`qb_company_name_${user.id}`);
      localStorage.removeItem(`qb_last_sync_${user.id}`);
      
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
    toast.info("QuickBooks sync is currently in development. Check back soon!");
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>QuickBooks Integration</CardTitle>
          <CardDescription>Connection error</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

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
              {companyName && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Company:</span>
                  <span className="font-medium">{companyName}</span>
                </div>
              )}
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
