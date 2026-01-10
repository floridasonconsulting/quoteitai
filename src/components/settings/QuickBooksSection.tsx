import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, RefreshCw, ExternalLink, Unlink, Crown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase as singletonSupabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { SupabaseClient } from "@supabase/supabase-js";
import { CompanySettings } from "@/types";

interface QuickBooksConnection {
  realm_id: string | null;
  company_name: string | null;
  connected_at: string | null;
  token_expires_at: string | null;
}

export function QuickBooksSection({
  supabaseClient,
  isClientReady = true,
  settings
}: {
  supabaseClient?: SupabaseClient;
  isClientReady?: boolean;
  settings?: CompanySettings;
}) {
  const supabase = supabaseClient || singletonSupabase;
  const { user, isProTier, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [localConnection, setLocalConnection] = useState<QuickBooksConnection | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Derived connection state from props or local (after callback)
  const connection = localConnection || (settings ? {
    realm_id: (settings as any)?.quickbooks_realm_id,
    company_name: (settings as any)?.quickbooks_company_name,
    connected_at: (settings as any)?.quickbooks_connected_at,
    token_expires_at: (settings as any)?.quickbooks_token_expires_at,
  } : null);

  // Check for OAuth callback results
  useEffect(() => {
    const qbConnected = searchParams.get("qb_connected");
    const qbError = searchParams.get("qb_error");
    const companyName = searchParams.get("company");
    const realmId = searchParams.get("realm_id");

    if (qbConnected === "true") {
      toast.success(`Connected to QuickBooks: ${companyName || "Success"}`);

      // Update local state immediately to reflect connection
      if (realmId) {
        setLocalConnection({
          realm_id: realmId,
          company_name: companyName,
          connected_at: new Date().toISOString(),
          token_expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() // Approx 180 days
        });
      }

      // Clean up URL params
      searchParams.delete("qb_connected");
      searchParams.delete("company");
      searchParams.delete("realm_id");
      setSearchParams(searchParams);

      // Force reload to sync everything if needed
      setTimeout(() => window.location.reload(), 1500);
    } else if (qbError) {
      toast.error(`QuickBooks connection failed: ${qbError}`);
      searchParams.delete("qb_error");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

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

      setLocalConnection(null);

      // Force reload page to ensure robust state sync
      window.location.reload();
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

  // Handles "Pro Tier" lock screen
  // CRITICAL FIX: Only show lock if we are SURE user is not Pro AND Auth is done loading
  if (!isProTier && !authLoading) {
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
            <Badge variant="outline" className="bg-muted text-muted-foreground border-muted-foreground/20">
              <Crown className="h-3 w-3 mr-1" />
              Pro Feature
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <UpgradePrompt
            title="QuickBooks Integration"
            description="Automatically sync your customers, invoices, and payments between Sellegance and QuickBooks to save hours of manual data entry."
            tier="Pro"
          />
        </CardContent>
      </Card>
    );
  }

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
        {!isConnected ? (
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
