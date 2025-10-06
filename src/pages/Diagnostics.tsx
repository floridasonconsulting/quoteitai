import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncManager } from '@/hooks/useSyncManager';
import { useLoadingState } from '@/hooks/useLoadingState';
import { AlertCircle, CheckCircle, Clock, Database, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export default function Diagnostics() {
  const { user } = useAuth();
  const { isOnline, isSyncing, pendingCount, failedCount } = useSyncManager();
  const { getActiveOperations } = useLoadingState();
  const [cacheInfo, setCacheInfo] = useState({
    customers: localStorage.getItem('customers-cache')?.length || 0,
    items: localStorage.getItem('items-cache')?.length || 0,
    quotes: localStorage.getItem('quotes-cache')?.length || 0,
    syncQueue: localStorage.getItem('sync-queue')?.length || 0,
    failedQueue: localStorage.getItem('failed-sync-queue')?.length || 0,
  });

  const activeOps = getActiveOperations();
  const lastSync = localStorage.getItem('last-sync-time');

  const handleClearCache = () => {
    localStorage.removeItem('customers-cache');
    localStorage.removeItem('items-cache');
    localStorage.removeItem('quotes-cache');
    setCacheInfo({
      customers: 0,
      items: 0,
      quotes: 0,
      syncQueue: cacheInfo.syncQueue,
      failedQueue: cacheInfo.failedQueue,
    });
    toast({
      title: 'Cache cleared',
      description: 'Data cache has been cleared successfully',
    });
  };

  const handleClearSyncQueues = () => {
    localStorage.removeItem('sync-queue');
    localStorage.removeItem('failed-sync-queue');
    setCacheInfo({
      ...cacheInfo,
      syncQueue: 0,
      failedQueue: 0,
    });
    toast({
      title: 'Sync queues cleared',
      description: 'All pending and failed sync operations have been cleared',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Diagnostics</h2>
        <p className="text-muted-foreground">
          System status and debugging information
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-lg font-bold">Online</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-lg font-bold">Offline</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isSyncing ? (
                <>
                  <Clock className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-lg font-bold">Syncing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-lg font-bold">Idle</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Auth Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-lg font-bold">Authenticated</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <span className="text-lg font-bold">Guest</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Queue</CardTitle>
          <CardDescription>Pending and failed sync operations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Pending Changes</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
            <Badge variant={pendingCount > 0 ? 'default' : 'secondary'}>
              {pendingCount > 0 ? 'Active' : 'Empty'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Failed Changes</p>
              <p className="text-2xl font-bold text-destructive">{failedCount}</p>
            </div>
            <Badge variant={failedCount > 0 ? 'destructive' : 'secondary'}>
              {failedCount > 0 ? 'Needs Attention' : 'None'}
            </Badge>
          </div>

          {lastSync && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Last sync: {new Date(lastSync).toLocaleString()}
              </p>
            </div>
          )}

          {(pendingCount > 0 || failedCount > 0) && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleClearSyncQueues}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Sync Queues
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Cache Status */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Status</CardTitle>
          <CardDescription>Local storage cache information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Customers Cache</span>
            <Badge variant="outline">{(cacheInfo.customers / 1024).toFixed(2)} KB</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Items Cache</span>
            <Badge variant="outline">{(cacheInfo.items / 1024).toFixed(2)} KB</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Quotes Cache</span>
            <Badge variant="outline">{(cacheInfo.quotes / 1024).toFixed(2)} KB</Badge>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={handleClearCache}
          >
            <Database className="mr-2 h-4 w-4" />
            Clear Data Cache
          </Button>
        </CardContent>
      </Card>

      {/* Active Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Active Operations</CardTitle>
          <CardDescription>Currently running operations</CardDescription>
        </CardHeader>
        <CardContent>
          {activeOps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active operations</p>
          ) : (
            <div className="space-y-2">
              {activeOps.map((op) => (
                <div key={op.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{op.description}</span>
                  <Badge variant="outline">
                    {(op.elapsed / 1000).toFixed(1)}s
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
