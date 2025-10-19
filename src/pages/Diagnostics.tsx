import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, XCircle, Clock, Database, Network, RefreshCw, Download, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncManager } from '@/hooks/useSyncManager';
import { useLoadingState } from '@/hooks/useLoadingState';
import { getTemplatePreference } from '@/lib/storage';
import { getSettings } from '@/lib/db-service';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DiagnosticEvent {
  id: string;
  timestamp: number;
  type: 'info' | 'warning' | 'error' | 'critical';
  category: 'template' | 'request' | 'db' | 'sync' | 'storage';
  message: string;
  data?: any;
}

export default function Diagnostics() {
  const { user, userRole } = useAuth();
  const { isOnline, isSyncing, pendingCount, failedCount } = useSyncManager();
  const { getActiveOperations } = useLoadingState();
  const [events, setEvents] = useState<DiagnosticEvent[]>([]);
  const [inFlightRequests, setInFlightRequests] = useState<Record<string, any>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [aiTestResult, setAiTestResult] = useState<any>(null);
  const [aiTesting, setAiTesting] = useState(false);
  const [dbTemplate, setDbTemplate] = useState<string | null>(null);
  
  const lastSyncTime = localStorage.getItem('last-sync-time');

  // Monitor localStorage changes
  useEffect(() => {
    const checkStorage = () => {
      try {
        const templatePref = getTemplatePreference();
        const customersCache = localStorage.getItem('quote-it-customers-cache');
        const itemsCache = localStorage.getItem('quote-it-items-cache');
        const quotesCache = localStorage.getItem('quote-it-quotes-cache');
        
        addEvent('info', 'storage', 'Storage check', {
          templatePreference: templatePref,
          cacheKeys: {
            customers: customersCache ? 'present' : 'missing',
            items: itemsCache ? 'present' : 'missing',
            quotes: quotesCache ? 'present' : 'missing',
          }
        });
      } catch (error) {
        addEvent('error', 'storage', 'Storage check failed', { error });
      }
    };

    checkStorage();
    const interval = setInterval(checkStorage, 5000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  // Monitor in-flight requests
  useEffect(() => {
    const checkRequests = () => {
      // Access global inFlightRequests if exposed
      const requests = (window as any).__inFlightRequests || {};
      setInFlightRequests(requests);
      
      if (Object.keys(requests).length > 0) {
        addEvent('warning', 'request', `${Object.keys(requests).length} in-flight requests detected`, requests);
      }
    };

    checkRequests();
    const interval = setInterval(checkRequests, 2000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  const addEvent = (type: DiagnosticEvent['type'], category: DiagnosticEvent['category'], message: string, data?: any) => {
    const event: DiagnosticEvent = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type,
      category,
      message,
      data
    };
    setEvents(prev => [event, ...prev].slice(0, 100)); // Keep last 100 events
  };

  const handleClearEvents = () => {
    setEvents([]);
    addEvent('info', 'db', 'Event log cleared', null);
  };

  const handleExportEvents = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `diagnostics-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleRefresh = async () => {
    setRefreshKey(prev => prev + 1);
    addEvent('info', 'db', 'Diagnostic refresh triggered', null);
    
    // Fetch current template from DB
    if (user?.id) {
      const settings = await getSettings(user.id);
      setDbTemplate(settings.proposalTemplate);
    }
  };

  const handleTestAIAccess = async () => {
    setAiTesting(true);
    setAiTestResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-assist', {
        body: {
          featureType: 'quote_title',
          prompt: 'Test access',
          context: {}
        }
      });

      if (error) {
        setAiTestResult({
          success: false,
          error: error.message,
          data
        });
        toast.error('AI access test failed: ' + error.message);
      } else if (data?.error) {
        setAiTestResult({
          success: false,
          error: data.error,
          requiresUpgrade: data.requiresUpgrade
        });
        toast.error('AI access denied: ' + data.error);
      } else {
        setAiTestResult({
          success: true,
          message: 'AI access granted',
          content: data?.content
        });
        toast.success('AI access test successful');
      }
    } catch (error) {
      setAiTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      toast.error('AI test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setAiTesting(false);
    }
  };

  // Load template from DB on mount
  useEffect(() => {
    if (user?.id) {
      getSettings(user.id).then(settings => {
        setDbTemplate(settings.proposalTemplate);
      });
    }
  }, [user?.id]);

  const getEventIcon = (type: DiagnosticEvent['type']) => {
    switch (type) {
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-700" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString() + '.' + date.getMilliseconds();
  };

  const activeOps = getActiveOperations();

  return (
    <div className="container max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Diagnostics</h1>
          <p className="text-muted-foreground">Advanced debugging and monitoring</p>
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
                  {userRole || 'Loading...'}
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
                  {isOnline ? 'Connected' : 'Offline'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Syncing</span>
                <Badge variant={isSyncing ? "default" : "outline"}>
                  {isSyncing ? 'Active' : 'Idle'}
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
                <span>{lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Never'}</span>
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
          <CardDescription>Live view of in-flight database requests</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(inFlightRequests).length === 0 ? (
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
                  ⚠️ {Object.keys(inFlightRequests).length} requests are currently in-flight. 
                  If this persists for more than 10 seconds, there may be a deadlock.
                </AlertDescription>
              </Alert>
              <ScrollArea className="h-[200px] border rounded-lg p-4">
                {Object.entries(inFlightRequests).map(([key, value]) => (
                  <div key={key} className="mb-3 p-2 border-l-2 border-yellow-500 bg-muted/50">
                    <div className="font-mono text-xs font-semibold">{key}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Age: {value.age || 'unknown'}ms
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
              <p className="text-sm font-medium">Current Role: <Badge>{userRole || 'Unknown'}</Badge></p>
              <p className="text-xs text-muted-foreground mt-1">
                AI features require Pro or Max tier access
              </p>
            </div>
            <Button onClick={handleTestAIAccess} disabled={aiTesting} size="sm">
              {aiTesting ? 'Testing...' : 'Test AI Access'}
            </Button>
          </div>
          
          {aiTestResult && (
            <Alert variant={aiTestResult.success ? "default" : "destructive"}>
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-semibold">
                    {aiTestResult.success ? '✓ AI Access Granted' : '✗ AI Access Denied'}
                  </div>
                  {aiTestResult.error && (
                    <div className="text-sm">Error: {aiTestResult.error}</div>
                  )}
                  {aiTestResult.requiresUpgrade && (
                    <div className="text-sm">Upgrade to Pro or Max tier required</div>
                  )}
                  {aiTestResult.success && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Content length: {aiTestResult.content?.length || 0} chars
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
          <CardDescription>Current state of cached data and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm font-medium mb-1">Template (localStorage)</div>
                <Badge>{getTemplatePreference()}</Badge>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Template (Database)</div>
                <Badge variant={dbTemplate ? "default" : "outline"}>
                  {dbTemplate || 'Not loaded'}
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Match Status</div>
                <Badge variant={dbTemplate === getTemplatePreference() ? "default" : "destructive"}>
                  {dbTemplate === getTemplatePreference() ? 'Synced' : 'Mismatch'}
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="text-sm font-medium mb-2">Data Caches</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 border rounded">
                <div className="font-medium">Customers</div>
                <Badge variant={localStorage.getItem('quote-it-customers-cache') ? "default" : "outline"} className="mt-1">
                  {localStorage.getItem('quote-it-customers-cache') ? 'Cached' : 'Empty'}
                </Badge>
              </div>
              <div className="p-2 border rounded">
                <div className="font-medium">Items</div>
                <Badge variant={localStorage.getItem('quote-it-items-cache') ? "default" : "outline"} className="mt-1">
                  {localStorage.getItem('quote-it-items-cache') ? 'Cached' : 'Empty'}
                </Badge>
              </div>
              <div className="p-2 border rounded">
                <div className="font-medium">Quotes</div>
                <Badge variant={localStorage.getItem('quote-it-quotes-cache') ? "default" : "outline"} className="mt-1">
                  {localStorage.getItem('quote-it-quotes-cache') ? 'Cached' : 'Empty'}
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
                      event.type === 'critical' ? 'border-red-700 bg-red-50 dark:bg-red-950' :
                      event.type === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-950' :
                      event.type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' :
                      'border-blue-500 bg-blue-50 dark:bg-blue-950'
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
