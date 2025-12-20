/**
 * Sync Storage Utility
 * Provides a centralized way to access and modify the offline sync queue
 * that can be used by both React hooks and standard service modules.
 */

import { QueueChange } from '@/types';

const QUEUE_KEY = 'offline-changes-queue';

export const syncStorage = {
    /**
     * Get all pending changes from the queue
     */
    getQueue(): QueueChange[] {
        try {
            const stored = localStorage.getItem(QUEUE_KEY);
            if (!stored) return [];

            const queue = JSON.parse(stored);
            return Array.isArray(queue) ? queue : [];
        } catch (error) {
            console.error('[SyncStorage] Error reading queue:', error);
            return [];
        }
    },

    /**
     * Save the entire queue to storage
     */
    saveQueue(queue: QueueChange[]): void {
        try {
            localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
            // Dispatch a storage event so other tabs/hooks can react
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            console.error('[SyncStorage] Error saving queue:', error);
        }
    },

    /**
     * Add a single change to the queue
     */
    addChange(change: QueueChange): void {
        const queue = this.getQueue();

        // Simple deduplication: if we're deleting something that was just created, remove both
        const existingCreateIndex = queue.findIndex(
            q => q.type === 'create' &&
                q.table === change.table &&
                (q.data as any).id === (change.data as any).id
        );

        if (change.type === 'delete' && existingCreateIndex >= 0) {
            console.log('[SyncStorage] Removing create operation for deleted item:', (change.data as any).id);
            queue.splice(existingCreateIndex, 1);
            this.saveQueue(queue);
            return;
        }

        queue.push(change);
        this.saveQueue(queue);
    },

    /**
     * Check if an entity has a pending change in the queue
     */
    hasPendingChange(table: string, id: string): boolean {
        const queue = this.getQueue();
        return queue.some(q => q.table === table && (q.data as any).id === id);
    },

    /**
     * Get pending changes for a specific table
     */
    getPendingChanges(table: string): QueueChange[] {
        const queue = this.getQueue();
        return queue.filter(q => q.table === table);
    },

    /**
     * Apply pending changes from sync queue to a list of entities
     */
    applyPendingChanges<T extends { id: string }>(
        entities: T[],
        table: string
    ): T[] {
        const pending = this.getPendingChanges(table);
        if (pending.length === 0) return entities;

        console.log(`[SyncStorage] Applying ${pending.length} pending changes for ${table}`);
        const entityMap = new Map<string, T>(entities.map(e => [e.id, e]));

        for (const change of pending) {
            const id = change.data.id as string;
            if (!id) continue;

            switch (change.type) {
                case 'delete':
                    entityMap.delete(id);
                    break;
                case 'update':
                case 'create':
                    // For both update and create, use the local data as the source of truth
                    const existing = entityMap.get(id) || {} as T;
                    entityMap.set(id, { ...existing, ...change.data } as T);
                    break;
            }
        }

        return Array.from(entityMap.values());
    }
};
