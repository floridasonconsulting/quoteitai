import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, RefreshCw, ExternalLink, Unlink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";

interface QuickBooksConnection {
  realm_id: string | null;
  company_name: string | null;
  connected_at: string | null;
  token_expires_at: string | null;
}

export function QuickBooksSection() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [connection, setConnection] = useState<QuickBooksConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Check for OAuth callback results
  useEffect(() => {
    const qbConnected = searchParams.get("qb_connected");
    const qbError = searchParams.get("qb_error");
    const companyName = searchParams.get("company");

    if (qbConnected === "true") {
      toast.success(`Connected to QuickBooks: ${companyName || "Success"}`);
      // Clean up URL params
      searchParams.delete("qb_connected");
      searchParams.delete("company");
      setSearchParams(searchParams);
      loadConnection();
    } else if (qbError) {
      toast.error(`QuickBooks connection failed: ${qbError}`);
      searchParams.delete("qb_error");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  // Load existing connection on mount
  useEffect(() => {
    if (user?.id) {
      loadConnection();
    }
  }, [user?.id]);

  const loadConnection = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("company_settings")
        .select("quickbooks_realm_id, quickbooks_company_name, quickbooks_connected_at, quickbooks_token_expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data && (data as any).quickbooks_realm_id) {
        const qbData = data as any;
        setConnection({
          realm_id: qbData.quickbooks_realm_id,
          company_name: qbData.quickbooks_company_name,
          connected_at: qbData.quickbooks_connected_at,
          token_expires_at: qbData.quickbooks_token_expires_at,
        });
      } else {
        setConnection(null);
      }
    } catch (error) {
      console.error("Failed to load QuickBooks connection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    if (!user?.id) {
      toast.error("You must be signed in to connect QuickBooks");
      return;
    }

    // Generate state parameter with user ID
    const state = btoa(JSON.stringify({ userId: user.id, timestamp: Date.now() }));

    // QuickBooks OAuth URL
    const clientId = import.meta.env.VITE_QUICKBOOKS_CLIENT_ID;
    // Clean up Supabase URL to ensure no trailing slash (prevents // in redirect_uri)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, "");
    const redirectUri = `${supabaseUrl}/functions/v1/quickbooks-callback`;

    if (!clientId) {
      toast.error("QuickBooks is not configured. Please contact support.");
      return;
    }

    const authUrl = new URL("https://appcenter.intuit.com/connect/oauth2");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "com.intuit.quickbooks.accounting");
    authUrl.searchParams.set("state", state);

    // Open QuickBooks authorization in popup
    window.location.href = authUrl.toString();
  };

  const handleDisconnect = async () => {
    if (!user?.id || !connection?.realm_id) return;

    setIsDisconnecting(true);
    try {
      const { error } = await supabase
        .from("company_settings")
        .update({
          quickbooks_realm_id: null,
          quickbooks_access_token: null,
          quickbooks_refresh_token: null,
          quickbooks_token_expires_at: null,
          quickbooks_company_name: null,
          quickbooks_connected_at: null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setConnection(null);
      toast.success("Disconnected from QuickBooks");
    } catch (error) {
      console.error("Failed to disconnect:", error);
      toast.error("Failed to disconnect from QuickBooks");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSync = async () => {
    if (!user?.id || !connection?.realm_id) return;

    setIsSyncing(true);
    try {
      // Call sync function (to be implemented)
      const { error } = await supabase.functions.invoke("quickbooks-sync", {
        body: { userId: user.id },
      });

      if (error) throw error;

      toast.success("Synced with QuickBooks successfully");
    } catch (error: any) {
      console.error("Sync failed:", error);
      toast.error(error.message || "Failed to sync with QuickBooks");
    } finally {
      setIsSyncing(false);
    }
  };

  const isConnected = !!connection?.realm_id;
  const isTokenExpired = connection?.token_expires_at
    ? new Date(connection.token_expires_at) < new Date()
    : false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <img src="/quickbooks-logo.svg" alt="QuickBooks" className="h-5 w-5" onError={(e) => e.currentTarget.style.display = 'none'} />
              QuickBooks Integration
            </CardTitle>
            <CardDescription>
              Sync customers, invoices, and payments with QuickBooks Online
            </CardDescription>
          </div>
          {isConnected && !isTokenExpired && (
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
          {isConnected && isTokenExpired && (
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
              <AlertCircle className="h-3 w-3 mr-1" />
              Reconnect Required
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !isConnected ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your QuickBooks Online account to automatically sync customer data and create invoices from accepted quotes.
            </p>
            <Button onClick={handleConnect} className="w-full" variant="secondary">
              <ExternalLink className="h-4 w-4 mr-2" />
              Connect QuickBooks
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Connection Info */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Company</span>
                <span className="text-sm text-muted-foreground">
                  {connection.company_name || "Unknown"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Connected</span>
                <span className="text-sm text-muted-foreground">
                  {connection.connected_at
                    ? new Date(connection.connected_at).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <Button
              onClick={handleSync}
              disabled={isSyncing || isTokenExpired}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Now"}
            </Button>

            {isTokenExpired && (
              <Button onClick={handleConnect} className="w-full" variant="secondary">
                <ExternalLink className="h-4 w-4 mr-2" />
                Reconnect QuickBooks
              </Button>
            )}

            <Button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
            >
              <Unlink className="h-4 w-4 mr-2" />
              {isDisconnecting ? "Disconnecting..." : "Disconnect QuickBooks"}
            </Button>
          </div>
        )}

        {/* Feature List */}
        <Alert>
          <AlertDescription className="text-xs">
            <strong>Features:</strong> Two-way customer sync, automatic invoice creation from accepted quotes, real-time payment tracking
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
