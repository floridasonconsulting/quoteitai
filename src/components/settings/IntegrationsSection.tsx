import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Key, Link as LinkIcon, Check, X } from "lucide-react";
import { toast } from "sonner";

interface IntegrationsSectionProps {
  settings: {
    openaiApiKey?: string;
    enableAI?: boolean;
  };
  onUpdate: (updates: Partial<IntegrationsSectionProps["settings"]>) => Promise<void>;
}

export function IntegrationsSection({ settings, onUpdate }: IntegrationsSectionProps) {
  const [apiKey, setApiKey] = useState(settings.openaiApiKey || "");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSaveApiKey = async () => {
    try {
      await onUpdate({ openaiApiKey: apiKey });
      toast.success("API key saved successfully");
    } catch (error) {
      console.error("Failed to save API key:", error);
      toast.error("Failed to save API key");
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey) {
      toast.error("Please enter an API key first");
      return;
    }

    try {
      setIsTestingConnection(true);
      setConnectionStatus("idle");

      const response = await fetch("https://api.openai.com/v1/models", {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        setConnectionStatus("success");
        toast.success("Connection successful!");
      } else {
        setConnectionStatus("error");
        toast.error("Invalid API key");
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      setConnectionStatus("error");
      toast.error("Connection test failed");
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleToggleAI = async (enabled: boolean) => {
    try {
      await onUpdate({ enableAI: enabled });
      toast.success(enabled ? "AI features enabled" : "AI features disabled");
    } catch (error) {
      console.error("Failed to toggle AI:", error);
      toast.error("Failed to update AI settings");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Integrations
        </CardTitle>
        <CardDescription>
          Connect external services to enhance Quote-It AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable AI Features</Label>
            <div className="text-sm text-muted-foreground">
              Use AI to generate quotes, recommendations, and insights
            </div>
          </div>
          <Switch
            checked={settings.enableAI || false}
            onCheckedChange={handleToggleAI}
          />
        </div>

        {/* OpenAI API Key */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <Label>OpenAI API Key</Label>
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              To use AI features, you need an OpenAI API key. Get yours at{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                platform.openai.com
              </a>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSaveApiKey}
                disabled={!apiKey}
              >
                Save API Key
              </Button>

              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={!apiKey || isTestingConnection}
              >
                {isTestingConnection ? "Testing..." : "Test Connection"}
              </Button>

              {connectionStatus === "success" && (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <Check className="h-4 w-4" />
                  Connected
                </div>
              )}

              {connectionStatus === "error" && (
                <div className="flex items-center gap-1 text-red-600 text-sm">
                  <X className="h-4 w-4" />
                  Failed
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}