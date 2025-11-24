/**
 * Background Sync Service
 * Handles background synchronization using the Background Sync API
 * with fallback to periodic sync for browsers that don't support it
 */

interface SyncTask {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'customers' | 'items' | 'quotes';
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

const SYNC_TAG = 'quote-it-sync';
const SYNC_TASKS_KEY = 'background-sync-tasks';
const MAX_RETRIES = 5;
const RETRY_DELAY = 1000 * 60; // 1 minute

/**
 * Background Sync Manager
 */
export class BackgroundSyncManager {
  private isSupported: boolean;
  private syncTasks: SyncTask[] = [];

  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype;
    this.loadTasks();
    
    if (!this.isSupported) {
      console.log('[BackgroundSync] Background Sync API not supported, using fallback');
      this.setupFallbackSync();
    }
  }

  /**
   * Register a sync task
   */
  async registerSync(task: Omit<SyncTask, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const newTask: SyncTask = {
      ...task,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.syncTasks.push(newTask);
    this.saveTasks();

    if (this.isSupported) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(SYNC_TAG);
        console.log('[BackgroundSync] Sync registered:', newTask.id);
      } catch (error) {
        console.error('[BackgroundSync] Failed to register sync:', error);
        this.fallbackSync(newTask);
      }
    } else {
      this.fallbackSync(newTask);
    }
  }

  /**
   * Get pending tasks
   */
  getPendingTasks(): SyncTask[] {
    return [...this.syncTasks];
  }

  /**
   * Clear completed task
   */
  clearTask(taskId: string): void {
    this.syncTasks = this.syncTasks.filter(t => t.id !== taskId);
    this.saveTasks();
  }

  /**
   * Retry failed task
   */
  async retryTask(taskId: string): Promise<void> {
    const taskIndex = this.syncTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = this.syncTasks[taskIndex];

    // Check max retries BEFORE incrementing
    if (task.retryCount >= MAX_RETRIES) {
      console.error('[BackgroundSync] Max retries reached for task:', taskId);
      // Keep task in queue but don't retry
      return;
    }

    // Increment retry count BEFORE execution
    task.retryCount++;
    this.saveTasks();

    // Try to execute the task
    const success = await this.executeTask(task);
    
    // If failed and still under max retries, schedule another retry
    if (!success && task.retryCount < MAX_RETRIES) {
      setTimeout(() => this.retryTask(task.id), RETRY_DELAY * task.retryCount);
    }
  }

  /**
   * Execute a sync task
   */
  private async executeTask(task: SyncTask): Promise<boolean> {
    try {
      console.log('[BackgroundSync] Executing task:', task.id, task.type, task.entityType);
      
      // This would connect to your actual API/database calls
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Only clear task on success
      this.clearTask(task.id);
      return true;
    } catch (error) {
      console.error('[BackgroundSync] Task execution failed:', error);
      // Don't clear task on failure - keep it in queue
      return false;
    }
  }

  /**
   * Fallback sync for browsers without Background Sync API
   */
  private fallbackSync(task: SyncTask): void {
    setTimeout(() => this.executeTask(task), RETRY_DELAY);
  }

  /**
   * Setup periodic sync fallback
   */
  private setupFallbackSync(): void {
    // Check for pending tasks every minute
    setInterval(() => {
      if (this.syncTasks.length > 0 && navigator.onLine) {
        console.log('[BackgroundSync] Running fallback sync for', this.syncTasks.length, 'tasks');
        this.syncTasks.forEach(task => this.executeTask(task));
      }
    }, 60000);
  }

  /**
   * Load tasks from storage
   */
  private loadTasks(): void {
    try {
      const stored = localStorage.getItem(SYNC_TASKS_KEY);
      if (stored) {
        this.syncTasks = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[BackgroundSync] Error loading tasks:', error);
    }
  }

  /**
   * Save tasks to storage
   */
  private saveTasks(): void {
    try {
      localStorage.setItem(SYNC_TASKS_KEY, JSON.stringify(this.syncTasks));
    } catch (error) {
      console.error('[BackgroundSync] Error saving tasks:', error);
    }
  }

  /**
   * Clear all tasks
   */
  clearAll(): void {
    this.syncTasks = [];
    this.saveTasks();
    console.log('[BackgroundSync] All tasks cleared');
  }
}

// Export singleton instance
export const backgroundSync = new BackgroundSyncManager();
