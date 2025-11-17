
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { StripeService } from "@/lib/stripe-service";
import { useAuth } from "@/contexts/AuthContext";

export function StripeSection() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [accountId, setAccountId] = useState<string>("");
  const [newAccountId, setNewAccountId] = useState<string>("");
  const [isTestMode, setIsTestMode] = useState(false);

  const stripeService = new StripeService();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (!user) return;
    
    // Check if Stripe account is configured
    const storedAccountId = localStorage.getItem(`stripe_account_${user.id}`);
    const storedTestMode = localStorage.getItem(`stripe_test_mode_${user.id}`) === "true";
    
    if (storedAccountId) {
      setIsConnected(true);
      setAccountId(storedAccountId);
      setIsTestMode(storedTestMode);
    }
  };

  const handleConnect = () => {
    if (!user || !newAccountId.trim()) {
      toast.error("Please enter your Stripe account ID");
      return;
    }

    // Validate Stripe account ID format (starts with acct_)
    if (!newAccountId.startsWith("acct_")) {
      toast.error("Invalid Stripe account ID format. It should start with 'acct_'");
      return;
    }

    try {
      // Store Stripe account configuration
      localStorage.setItem(`stripe_account_${user.id}`, newAccountId);
      localStorage.setItem(`stripe_test_mode_${user.id}`, String(isTestMode));
      
      setIsConnected(true);
      setAccountId(newAccountId);
      setNewAccountId("");
      
      toast.success("Stripe connected successfully!");
    } catch (error) {
      console.error("Failed to connect Stripe:", error);
      toast.error("Failed to connect Stripe");
    }
  };

  const handleDisconnect = () => {
    if (!user) return;
    
    try {
      localStorage.removeItem(`stripe_account_${user.id}`);
      localStorage.removeItem(`stripe_test_mode_${user.id}`);
      
      setIsConnected(false);
      setAccountId("");
      setIsTestMode(false);
      
      toast.success("Stripe disconnected");
    } catch (error) {
      console.error("Failed to disconnect Stripe:", error);
      toast.error("Failed to disconnect Stripe");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Stripe Payment Integration</CardTitle>
            <CardDescription>
              Connect Stripe to accept payments and create invoices for your quotes
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
                Connecting Stripe enables:
                <ul className="mt-2 ml-4 list-disc space-y-1">
                  <li>Create professional invoices from accepted quotes</li>
                  <li>Generate secure payment links for customers</li>
                  <li>Track payment status in real-time</li>
                  <li>Send automatic payment reminders</li>
                  <li>Accept credit cards, ACH, and more payment methods</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stripe-account">Stripe Account ID</Label>
                <Input
                  id="stripe-account"
                  placeholder="acct_xxxxxxxxxxxxx"
                  value={newAccountId}
                  onChange={(e) => setNewAccountId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Find your account ID in Stripe Dashboard → Settings → Account Details
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="test-mode"
                  checked={isTestMode}
                  onChange={(e) => setIsTestMode(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="test-mode" className="text-sm font-normal cursor-pointer">
                  Use test mode (for development)
                </Label>
              </div>

              <Button 
                onClick={handleConnect}
                className="w-full"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Connect Stripe Account
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Account ID:</span>
                <span className="font-mono text-xs">{accountId}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Mode:</span>
                <Badge variant={isTestMode ? "secondary" : "default"}>
                  {isTestMode ? "Test Mode" : "Live Mode"}
                </Badge>
              </div>
            </div>

            <Button 
              onClick={handleDisconnect}
              variant="outline"
              className="w-full"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Disconnect Stripe
            </Button>

            <Alert>
              <AlertDescription className="text-xs">
                <strong>Note:</strong> When quotes are accepted, you can create invoices in Stripe with one click. 
                Payment links will be generated automatically and sent to customers.
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
}
