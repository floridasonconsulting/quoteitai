import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSyncManager } from '@/hooks/useSyncManager';

import { useNavigate } from 'react-router-dom';

export const SyncIndicator = () => {
  const navigate = useNavigate();
  const { isOnline, isSyncing, pendingCount, failedCount } = useSyncManager();

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

  if (failedCount > 0) {
    return (
      <Badge
        variant="destructive"
        className="gap-2 cursor-pointer hover:bg-destructive/90"
        onClick={() => navigate('/settings')}
        title={`${failedCount} items failed to sync. Click to view details.`}
      >
        <CloudOff className="h-3 w-3" />
        {failedCount} Failed
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
