import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BackgroundSyncManager, backgroundSync } from '../background-sync';

describe('BackgroundSyncManager', () => {
  let manager: BackgroundSyncManager;

  beforeEach(() => {
    localStorage.clear();
    manager = new BackgroundSyncManager();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllTimers();
  });

  describe('task registration', () => {
    it('should register a sync task', async () => {
      await manager.registerSync({
        type: 'create',
        entityType: 'customers',
        data: { id: '1', name: 'Test Customer' }
      });

      const tasks = manager.getPendingTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].type).toBe('create');
      expect(tasks[0].entityType).toBe('customers');
    });

    it('should assign unique ID to task', async () => {
      await manager.registerSync({
        type: 'create',
        entityType: 'customers',
        data: { id: '1' }
      });

      await manager.registerSync({
        type: 'update',
        entityType: 'items',
        data: { id: '2' }
      });

      const tasks = manager.getPendingTasks();
      expect(tasks[0].id).not.toBe(tasks[1].id);
    });

    it('should initialize retry count to 0', async () => {
      await manager.registerSync({
        type: 'create',
        entityType: 'customers',
        data: { id: '1' }
      });

      const tasks = manager.getPendingTasks();
      expect(tasks[0].retryCount).toBe(0);
    });

    it('should set timestamp', async () => {
      const before = Date.now();
      
      await manager.registerSync({
        type: 'create',
        entityType: 'customers',
        data: { id: '1' }
      });

      const tasks = manager.getPendingTasks();
      expect(tasks[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(tasks[0].timestamp).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('task management', () => {
    it('should get pending tasks', async () => {
      await manager.registerSync({
        type: 'create',
        entityType: 'customers',
        data: { id: '1' }
      });

      await manager.registerSync({
        type: 'update',
        entityType: 'items',
        data: { id: '2' }
      });

      const tasks = manager.getPendingTasks();
      expect(tasks).toHaveLength(2);
    });

    it('should clear completed task', async () => {
      await manager.registerSync({
        type: 'create',
        entityType: 'customers',
        data: { id: '1' }
      });

      const tasks = manager.getPendingTasks();
      const taskId = tasks[0].id;

      manager.clearTask(taskId);

      const remainingTasks = manager.getPendingTasks();
      expect(remainingTasks).toHaveLength(0);
    });

    it('should clear all tasks', async () => {
      await manager.registerSync({
        type: 'create',
        entityType: 'customers',
        data: { id: '1' }
      });

      await manager.registerSync({
        type: 'update',
        entityType: 'items',
        data: { id: '2' }
      });

      manager.clearAll();

      const tasks = manager.getPendingTasks();
      expect(tasks).toHaveLength(0);
    });
  });

  describe('task persistence', () => {
    it('should persist tasks to localStorage', async () => {
      await manager.registerSync({
        type: 'create',
        entityType: 'customers',
        data: { id: '1' }
      });

      const stored = localStorage.getItem('background-sync-tasks');
      expect(stored).toBeTruthy();
      
      const tasks = JSON.parse(stored!);
      expect(tasks).toHaveLength(1);
    });

    it('should load tasks from localStorage', () => {
      const tasks = [
        {
          id: '1',
          type: 'create' as const,
          entityType: 'customers' as const,
          data: { id: '1' },
          timestamp: Date.now(),
          retryCount: 0
        }
      ];

      localStorage.setItem('background-sync-tasks', JSON.stringify(tasks));

      const newManager = new BackgroundSyncManager();
      const loadedTasks = newManager.getPendingTasks();

      expect(loadedTasks).toHaveLength(1);
      expect(loadedTasks[0].id).toBe('1');
    });
  });

  describe('retry logic', () => {
    it('should increment retry count on retry', async () => {
      await manager.registerSync({
        type: 'create',
        entityType: 'customers',
        data: { id: '1' }
      });

      const tasks = manager.getPendingTasks();
      const taskId = tasks[0].id;

      await manager.retryTask(taskId);

      const updatedTasks = manager.getPendingTasks();
      expect(updatedTasks[0].retryCount).toBe(1);
    });

    it('should not retry beyond max attempts', async () => {
      await manager.registerSync({
        type: 'create',
        entityType: 'customers',
        data: { id: '1' }
      });

      const tasks = manager.getPendingTasks();
      const taskId = tasks[0].id;

      // Mock to force max retries
      for (let i = 0; i < 5; i++) {
        await manager.retryTask(taskId);
      }

      const consoleSpy = vi.spyOn(console, 'error');
      await manager.retryTask(taskId);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Max retries reached'),
        taskId
      );
    });
  });

  describe('entity types', () => {
    it('should support customers entity', async () => {
      await manager.registerSync({
        type: 'create',
        entityType: 'customers',
        data: { id: '1' }
      });

      const tasks = manager.getPendingTasks();
      expect(tasks[0].entityType).toBe('customers');
    });

    it('should support items entity', async () => {
      await manager.registerSync({
        type: 'update',
        entityType: 'items',
        data: { id: '1' }
      });

      const tasks = manager.getPendingTasks();
      expect(tasks[0].entityType).toBe('items');
    });

    it('should support quotes entity', async () => {
      await manager.registerSync({
        type: 'delete',
        entityType: 'quotes',
        data: { id: '1' }
      });

      const tasks = manager.getPendingTasks();
      expect(tasks[0].entityType).toBe('quotes');
    });
  });

  describe('operation types', () => {
    it('should support create operations', async () => {
      await manager.registerSync({
        type: 'create',
        entityType: 'customers',
        data: { id: '1' }
      });

      const tasks = manager.getPendingTasks();
      expect(tasks[0].type).toBe('create');
    });

    it('should support update operations', async () => {
      await manager.registerSync({
        type: 'update',
        entityType: 'customers',
        data: { id: '1' }
      });

      const tasks = manager.getPendingTasks();
      expect(tasks[0].type).toBe('update');
    });

    it('should support delete operations', async () => {
      await manager.registerSync({
        type: 'delete',
        entityType: 'customers',
        data: { id: '1' }
      });

      const tasks = manager.getPendingTasks();
      expect(tasks[0].type).toBe('delete');
    });
  });
});

describe('Singleton backgroundSync', () => {
  it('should export singleton instance', () => {
    expect(backgroundSync).toBeInstanceOf(BackgroundSyncManager);
  });

  it('should maintain state across imports', async () => {
    await backgroundSync.registerSync({
      type: 'create',
      entityType: 'customers',
      data: { id: '1' }
    });

    const tasks = backgroundSync.getPendingTasks();
    expect(tasks).toHaveLength(1);
  });
});
