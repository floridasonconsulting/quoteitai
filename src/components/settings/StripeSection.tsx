import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, CreditCard, ExternalLink, Unlink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase as singletonSupabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import { SupabaseClient } from "@supabase/supabase-js";

interface StripeConnection {
  account_id: string | null;
  connected_at: string | null;
  onboarding_complete: boolean;
}

export function StripeSection({
  supabaseClient,
  isClientReady = true
}: {
  supabaseClient?: SupabaseClient;
  isClientReady?: boolean;
}) {
  const supabase = supabaseClient || singletonSupabase;
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [connection, setConnection] = useState<StripeConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Check for OAuth callback results
  useEffect(() => {
    const stripeConnected = searchParams.get("stripe_connected");
    const stripeRefresh = searchParams.get("stripe_refresh");

    if (stripeConnected === "true") {
      toast.success("Stripe account connected successfully!");
      searchParams.delete("stripe_connected");
      setSearchParams(searchParams);
      loadConnection();
      // Check onboarding status
      checkOnboardingStatus();
    } else if (stripeRefresh === "true") {
      toast.info("Please complete your Stripe account setup");
      searchParams.delete("stripe_refresh");
      setSearchParams(searchParams);
      // Re-initiate onboarding
      handleConnect();
    }
  }, [searchParams, setSearchParams]);

  // Load existing connection on mount
  useEffect(() => {
    if (user?.id && isClientReady) {
      loadConnection();
    }
  }, [user?.id, isClientReady]);

  const loadConnection = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("company_settings")
        .select("stripe_account_id, stripe_connected_at, stripe_onboarding_complete")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data && (data as any).stripe_account_id) {
        const stripeData = data as any;
        setConnection({
          account_id: stripeData.stripe_account_id,
          connected_at: stripeData.stripe_connected_at,
          onboarding_complete: stripeData.stripe_onboarding_complete || false,
        });
      } else {
        setConnection(null);
      }
    } catch (error) {
      console.error("Failed to load Stripe connection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkOnboardingStatus = async () => {
    if (!connection?.account_id || !user?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect", {
        body: {
          action: "check_status",
          accountId: connection.account_id,
          userId: user.id
        },
      });

      if (error) throw error;

      if (data.isComplete) {
        setConnection(prev => prev ? { ...prev, onboarding_complete: true } : prev);
      }
    } catch (error) {
      console.error("Failed to check onboarding status:", error);
    }
  };

  const handleConnect = async () => {
    if (!user?.id) {
      toast.error("You must be signed in to connect Stripe");
      return;
    }

    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect", {
        body: { action: "create_account_link", userId: user.id },
      });

      if (error) throw error;

      // Redirect to Stripe onboarding
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Failed to connect Stripe:", error);
      toast.error(error.message || "Failed to start Stripe connection");
      setIsConnecting(false);
    }
  };

  const handleOpenDashboard = async () => {
    if (!connection?.account_id) return;

    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect", {
        body: { action: "create_dashboard_link", accountId: connection.account_id },
      });

      if (error) throw error;

      window.open(data.url, "_blank");
    } catch (error: any) {
      console.error("Failed to open dashboard:", error);
      toast.error("Failed to open Stripe dashboard");
    }
  };

  const handleDisconnect = async () => {
    if (!user?.id) return;

    setIsDisconnecting(true);
    try {
      const { error } = await supabase.functions.invoke("stripe-connect", {
        body: { action: "disconnect", userId: user.id },
      });

      if (error) throw error;

      setConnection(null);
      toast.success("Disconnected from Stripe");
    } catch (error: any) {
      console.error("Failed to disconnect:", error);
      toast.error("Failed to disconnect from Stripe");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const isConnected = !!connection?.account_id;
  const isOnboardingComplete = connection?.onboarding_complete;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Stripe Payment Processing
            </CardTitle>
            <CardDescription>
              Accept credit card payments directly from your quotes
            </CardDescription>
          </div>
          {isConnected && isOnboardingComplete && (
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
          {isConnected && !isOnboardingComplete && (
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
              <AlertCircle className="h-3 w-3 mr-1" />
              Setup Incomplete
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
              Connect your Stripe account to accept credit card payments directly from accepted quotes. Funds are deposited directly to your bank account.
            </p>
            <Button
              onClick={handleConnect}
              className="w-full"
              variant="secondary"
              disabled={isConnecting}
            >
              {isConnecting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              {isConnecting ? "Connecting..." : "Connect Stripe"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Connection Info */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <span className="text-sm text-muted-foreground">
                  {isOnboardingComplete ? "Active" : "Setup Required"}
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
            {!isOnboardingComplete && (
              <Button onClick={handleConnect} className="w-full" variant="default">
                <ExternalLink className="h-4 w-4 mr-2" />
                Complete Setup
              </Button>
            )}

            {isOnboardingComplete && (
              <Button
                onClick={handleOpenDashboard}
                variant="outline"
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Stripe Dashboard
              </Button>
            )}

            <Button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
            >
              <Unlink className="h-4 w-4 mr-2" />
              {isDisconnecting ? "Disconnecting..." : "Disconnect Stripe"}
            </Button>
          </div>
        )}

        {/* Feature List */}
        <Alert>
          <AlertDescription className="text-xs">
            <strong>Features:</strong> Professional invoices with payment links, secure credit card processing, automatic payment tracking & reminders
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
