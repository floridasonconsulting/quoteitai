import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";

export function StripeSection() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(true);

  const handleConnect = async () => {
    try {
      setError(null);
      toast.info("Stripe integration coming soon!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect to Stripe";
      setError(message);
      toast.error(message);
    }
  };

  const handleDisconnect = async () => {
    try {
      setError(null);
      setIsConnected(false);
      toast.success("Disconnected from Stripe");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to disconnect";
      setError(message);
      toast.error(message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Stripe Payment Processing</CardTitle>
            <CardDescription>
              Accept credit card payments directly from your quotes
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
              Connect your Stripe account to enable payment processing for your quotes.
            </p>
            <Button onClick={handleConnect} className="w-full">
              <CreditCard className="h-4 w-4 mr-2" />
              Connect Stripe
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Mode</span>
              <Badge variant={testMode ? "secondary" : "default"}>
                {testMode ? "Test" : "Live"}
              </Badge>
            </div>

            <Button 
              onClick={handleDisconnect}
              variant="outline"
              className="w-full"
            >
              Disconnect Stripe
            </Button>
          </div>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Stripe payment processing is currently in development. Full functionality coming soon!
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
