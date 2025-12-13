import { create } from 'zustand';

interface LoadingState {
  operations: Map<string, { startTime: number; description: string }>;
  isLoading: (operationId: string) => boolean;
  startLoading: (operationId: string, description: string) => void;
  stopLoading: (operationId: string) => void;
  clearAll: () => void;
  getActiveOperations: () => Array<{ id: string; description: string; elapsed: number }>;
}

export const useLoadingState = create<LoadingState>((set, get) => ({
  operations: new Map(),
  
  isLoading: (operationId: string) => {
    return get().operations.has(operationId);
  },
  
  startLoading: (operationId: string, description: string) => {
    set((state) => {
      const newOps = new Map(state.operations);
      newOps.set(operationId, { startTime: Date.now(), description });
      console.log(`[LoadingState] Started: ${operationId} - ${description}`);
      return { operations: newOps };
    });
  },
  
  stopLoading: (operationId: string) => {
    set((state) => {
      const newOps = new Map(state.operations);
      const op = newOps.get(operationId);
      if (op) {
        const elapsed = Date.now() - op.startTime;
        console.log(`[LoadingState] Completed: ${operationId} in ${elapsed}ms`);
      }
      newOps.delete(operationId);
      return { operations: newOps };
    });
  },
  
  clearAll: () => {
    console.log('[LoadingState] Clearing all operations');
    set({ operations: new Map() });
  },
  
  getActiveOperations: () => {
    const ops = get().operations;
    const now = Date.now();
    return Array.from(ops.entries()).map(([id, op]) => ({
      id,
      description: op.description,
      elapsed: now - op.startTime,
    }));
  },
}));
