import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSyncManager } from '@/hooks/useSyncManager';

export const SyncIndicator = () => {
  const { isOnline, isSyncing, pendingCount } = useSyncManager();

  if (!isOnline) {
    return (
      <Badge variant="outline" className="gap-2">
        <CloudOff className="h-3 w-3" />
        Offline
        {pendingCount > 0 && ` (${pendingCount} pending)`}
      </Badge>
    );
  }

  if (isSyncing) {
    return (
      <Badge variant="outline" className="gap-2">
        <Loader2 className="h-3 w-3 animate-spin" />
        Syncing...
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-2">
      <Cloud className="h-3 w-3" />
      Synced
    </Badge>
  );
};
