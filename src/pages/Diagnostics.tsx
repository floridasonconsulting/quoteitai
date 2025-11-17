import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, XCircle, Clock, Database, Network, RefreshCw, Download, Shield, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSyncManager } from "@/hooks/useSyncManager";
import { useLoadingState } from "@/hooks/useLoadingState";
import { getTemplatePreference } from "@/lib/storage";
import { getSettings } from "@/lib/db-service";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StorageCache } from "@/lib/storage-cache";

interface DiagnosticEvent {
  id: string;
  timestamp: number;
  type: "info" | "warning" | "error" | "critical";
  category: "template" | "request" | "db" | "sync" | "storage";
  message: string;
  data?: unknown;
}

interface SystemState {
  templatePref: string;
  dbTemplate: string | null;
  cacheStatus: {
    customers: boolean;
    items: boolean;
    quotes: boolean;
  };
  inFlightRequests: Record<string, unknown>;
}

export default function Diagnostics() {
  const { user, userRole } = useAuth();
  const { isOnline, isSyncing, pendingCount, failedCount } = useSyncManager();
  const { getActiveOperations } = useLoadingState();
  const [events, setEvents] = useState<DiagnosticEvent[]>([]);
  const [systemState, setSystemState] = useState<SystemState>({
    templatePref: "",
    dbTemplate: null,
    cacheStatus: {
      customers: false,
      items: false,
      quotes: false
    },
    inFlightRequests: {}
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [aiTestResult, setAiTestResult] = useState<unknown>(null);
  const [aiTesting, setAiTesting] = useState(false);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTime = StorageCache.get("last-sync-time");

  // Redirect non-admin users
  useEffect(() => {
    if (userRole && userRole !== "admin") {
      window.location.href = "/dashboard";
    }
  }, [userRole]);

  // Add diagnostic event
  const addEvent = useCallback((
    type: DiagnosticEvent["type"],
    category: DiagnosticEvent["category"],
    message: string,
    data?: unknown
  ) => {
    const event: DiagnosticEvent = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type,
      category,
      message,
      data
    };
    setEvents(prev => [event, ...prev].slice(0, 100)); // Keep last 100 events
  }, []);

  // Consolidated polling function - runs ALL checks in a single interval
  const performSystemCheck = useCallback(async () => {
    try {
      // Check 1: Storage state (using cached reads)
      const templatePref = StorageCache.get("proposalTemplate") || getTemplatePreference();
      const customersCache = StorageCache.get("quote-it-customers-cache");
      const itemsCache = StorageCache.get("quote-it-items-cache");
      const quotesCache = StorageCache.get("quote-it-quotes-cache");

      // Check 2: In-flight requests
      const requests = (window as { __inFlightRequests?: Map<string, unknown> }).__inFlightRequests;
      const inFlightRequests = requests ? Object.fromEntries(requests.entries()) : {};

      // Check 3: Database template (only if user exists and it's been >10s since last check)
      let dbTemplate = systemState.dbTemplate;
      if (user?.id && (!systemState.dbTemplate || refreshKey > 0)) {
        const settings = await getSettings(user.id);
        dbTemplate = settings.proposalTemplate;
      }

      // Update system state in a single setState
      setSystemState({
        templatePref,
        dbTemplate,
        cacheStatus: {
          customers: !!customersCache,
          items: !!itemsCache,
          quotes: !!quotesCache
        },
        inFlightRequests
      });

      // Log warnings only if issues detected
      if (Object.keys(inFlightRequests).length > 0) {
        addEvent(
          "warning",
          "request",
          `${Object.keys(inFlightRequests).length} in-flight requests detected`,
          inFlightRequests
        );
      }

      if (dbTemplate && templatePref !== dbTemplate) {
        addEvent(
          "warning",
          "template",
          "Template mismatch detected between localStorage and database",
          { localStorage: templatePref, database: dbTemplate }
        );
      }
    } catch (error) {
      addEvent("error", "db", "System check failed", { error });
    }
  }, [user?.id, systemState.dbTemplate, refreshKey, addEvent]);

  // Single optimized polling interval - runs every 5 seconds (reduced from 3 separate intervals)
  useEffect(() => {
    // Initial check on mount
    performSystemCheck();

    // Set up consolidated polling
    pollingIntervalRef.current = setInterval(performSystemCheck, 5000);

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [performSystemCheck]);

  const handleClearEvents = () => {
    setEvents([]);
    addEvent("info", "db", "Event log cleared", null);
  };

  const handleExportEvents = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `diagnostics-${Date.now()}.json`;
    
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
    
    addEvent("info", "db", "Events exported", { count: events.length });
  };

  const handleRefresh = async () => {
    setRefreshKey(prev => prev + 1);
    addEvent("info", "db", "Diagnostic refresh triggered", null);
    
    // Force immediate system check
    await performSystemCheck();
  };

  const handleTestAIAccess = async () => {
    setAiTesting(true);
    setAiTestResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("ai-assist", {
        body: {
          featureType: "quote_title",
          prompt: "Test access",
          context: {}
        }
      });

      if (error) {
        setAiTestResult({
          success: false,
          error: error.message,
          data
        });
        addEvent("error", "request", "AI access test failed", { error: error.message });
        toast.error("AI access test failed: " + error.message);
      } else if (data?.error) {
        setAiTestResult({
          success: false,
          error: data.error,
          requiresUpgrade: data.requiresUpgrade
        });
        addEvent("warning", "request", "AI access denied", data);
        toast.error("AI access denied: " + data.error);
      } else {
        setAiTestResult({
          success: true,
          message: "AI access granted",
          content: data?.content
        });
        addEvent("info", "request", "AI access test successful", data);
        toast.success("AI access test successful");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setAiTestResult({
        success: false,
        error: errorMessage
      });
      addEvent("error", "request", "AI test exception", { error: errorMessage });
      toast.error("AI test failed: " + errorMessage);
    } finally {
      setAiTesting(false);
    }
  };

  const getEventIcon = (type: DiagnosticEvent["type"]) => {
    switch (type) {
      case "info":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "critical":
        return <XCircle className="h-4 w-4 text-red-700" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString() + "." + date.getMilliseconds();
  };

  const activeOps = getActiveOperations();
  const inFlightCount = Object.keys(systemState.inFlightRequests).length;

  return (
    <div className="container max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Diagnostics</h1>
          <p className="text-muted-foreground">Advanced debugging and monitoring (optimized polling)</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportEvents} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              User Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Role</span>
                <Badge variant="default">
                  {userRole || "Loading..."}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">User ID</span>
                <code className="text-xs">{user?.id?.slice(0, 8)}...</code>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Network className="h-4 w-4" />
              Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Online</span>
                <Badge variant={isOnline ? "default" : "destructive"}>
                  {isOnline ? "Connected" : "Offline"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Syncing</span>
                <Badge variant={isSyncing ? "default" : "outline"}>
                  {isSyncing ? "Active" : "Idle"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Sync Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending</span>
                <Badge variant={pendingCount > 0 ? "default" : "outline"}>
                  {pendingCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Failed</span>
                <Badge variant={failedCount > 0 ? "destructive" : "outline"}>
                  {failedCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Last Sync</span>
                <span>{lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : "Never"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Active Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeOps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active operations</p>
            ) : (
              <div className="space-y-2">
                {activeOps.slice(0, 3).map(op => (
                  <div key={op.id} className="text-xs">
                    <div className="font-medium truncate">{op.description}</div>
                    <div className="text-muted-foreground">{Math.round(op.elapsed / 1000)}s</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* In-Flight Requests Monitor */}
      <Card>
        <CardHeader>
          <CardTitle>Request Deduplication Monitor</CardTitle>
          <CardDescription>Live view of in-flight database requests (polling every 5s)</CardDescription>
        </CardHeader>
        <CardContent>
          {inFlightCount === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                No in-flight requests. All requests completed successfully.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  ⚠️ {inFlightCount} requests are currently in-flight. 
                  If this persists for more than 10 seconds, there may be a deadlock.
                </AlertDescription>
              </Alert>
              <ScrollArea className="h-[200px] border rounded-lg p-4">
                {Object.entries(systemState.inFlightRequests).map(([key, value]) => (
                  <div key={key} className="mb-3 p-2 border-l-2 border-yellow-500 bg-muted/50">
                    <div className="font-mono text-xs font-semibold">{key}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Age: {typeof value === "object" && value && "startTime" in value ? `${Date.now() - (value as {startTime: number}).startTime}ms` : "unknown"}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Access Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Feature Access
          </CardTitle>
          <CardDescription>Test AI feature access and permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Current Role: <Badge>{userRole || "Unknown"}</Badge></p>
              <p className="text-xs text-muted-foreground mt-1">
                AI features require Pro or Max tier access
              </p>
            </div>
            <Button onClick={handleTestAIAccess} disabled={aiTesting} size="sm">
              {aiTesting ? "Testing..." : "Test AI Access"}
            </Button>
          </div>
          
          {aiTestResult && (
            <Alert variant={
              typeof aiTestResult === "object" && aiTestResult && "success" in aiTestResult && (aiTestResult as {success: boolean}).success
                ? "default"
                : "destructive"
            }>
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-semibold">
                    {typeof aiTestResult === "object" && aiTestResult && "success" in aiTestResult && (aiTestResult as {success: boolean}).success
                      ? "✓ AI Access Granted"
                      : "✗ AI Access Denied"}
                  </div>
                  {typeof aiTestResult === "object" && aiTestResult && "error" in aiTestResult && (
                    <div className="text-sm">Error: {String((aiTestResult as {error: unknown}).error)}</div>
                  )}
                  {typeof aiTestResult === "object" && aiTestResult && "requiresUpgrade" in aiTestResult && (
                    <div className="text-sm">Upgrade to Pro or Max tier required</div>
                  )}
                  {typeof aiTestResult === "object" && aiTestResult && "success" in aiTestResult && (aiTestResult as {success: boolean}).success && "content" in aiTestResult && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Content length: {String((aiTestResult as {content?: string}).content)?.length || 0} chars
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Storage State */}
      <Card>
        <CardHeader>
          <CardTitle>LocalStorage & Settings State</CardTitle>
          <CardDescription>Current state of cached data and preferences (using cached reads)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm font-medium mb-1">Template (localStorage)</div>
                <Badge>{systemState.templatePref || "Not set"}</Badge>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Template (Database)</div>
                <Badge variant={systemState.dbTemplate ? "default" : "outline"}>
                  {systemState.dbTemplate || "Not loaded"}
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Match Status</div>
                <Badge variant={systemState.dbTemplate === systemState.templatePref ? "default" : "destructive"}>
                  {systemState.dbTemplate === systemState.templatePref ? "Synced" : "Mismatch"}
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="text-sm font-medium mb-2">Data Caches</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 border rounded">
                <div className="font-medium">Customers</div>
                <Badge variant={systemState.cacheStatus.customers ? "default" : "outline"} className="mt-1">
                  {systemState.cacheStatus.customers ? "Cached" : "Empty"}
                </Badge>
              </div>
              <div className="p-2 border rounded">
                <div className="font-medium">Items</div>
                <Badge variant={systemState.cacheStatus.items ? "default" : "outline"} className="mt-1">
                  {systemState.cacheStatus.items ? "Cached" : "Empty"}
                </Badge>
              </div>
              <div className="p-2 border rounded">
                <div className="font-medium">Quotes</div>
                <Badge variant={systemState.cacheStatus.quotes ? "default" : "outline"} className="mt-1">
                  {systemState.cacheStatus.quotes ? "Cached" : "Empty"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Event Log</CardTitle>
              <CardDescription>Chronological system events (last 100)</CardDescription>
            </div>
            <Button onClick={handleClearEvents} variant="outline" size="sm">
              Clear Log
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No events logged yet. Events will appear here as the system operates.
              </p>
            ) : (
              <div className="space-y-2">
                {events.map(event => (
                  <div 
                    key={event.id} 
                    className={`p-3 border-l-4 rounded ${
                      event.type === "critical" ? "border-red-700 bg-red-50 dark:bg-red-950" :
                      event.type === "error" ? "border-red-500 bg-red-50 dark:bg-red-950" :
                      event.type === "warning" ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950" :
                      "border-blue-500 bg-blue-50 dark:bg-blue-950"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {getEventIcon(event.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{event.category}</Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            {formatTime(event.timestamp)}
                          </span>
                        </div>
                        <div className="text-sm font-medium">{event.message}</div>
                        {event.data && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer">View details</summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                              {JSON.stringify(event.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
