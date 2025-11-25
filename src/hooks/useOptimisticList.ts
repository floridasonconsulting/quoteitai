import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface OptimisticUpdateOptions<T> {
  onAdd?: (item: T) => Promise<T>;
  onUpdate?: (item: T) => Promise<T>;
  onDelete?: (id: string) => Promise<void>;
  entityName?: string; // For toast messages
}

export function useOptimisticList<T extends { id: string }>(
  initialData: T[],
  options: OptimisticUpdateOptions<T> = {}
) {
  const [items, setItems] = useState<T[]>(initialData);
  const { entityName = 'item' } = options;
  
  // Use a ref to track the previous data to avoid infinite loops
  const prevDataRef = useRef<string>('');

  // Sync with external data changes (e.g. initial load)
  // CRITICAL FIX: Only update if the serialized data actually changed
  // This prevents infinite loops caused by array reference changes
  useEffect(() => {
    const currentDataStr = JSON.stringify(initialData);
    if (currentDataStr !== prevDataRef.current) {
      prevDataRef.current = currentDataStr;
      setItems(initialData);
    }
  }, [initialData]);

  const add = useCallback(async (newItem: T) => {
    // Create a temporary ID if not present
    const tempId = newItem.id || `temp-${crypto.randomUUID()}`;
    const optimisticItem = { ...newItem, id: tempId };
    
    // Optimistic update
    setItems(prev => [optimisticItem, ...prev]);

    try {
      if (options.onAdd) {
        const savedItem = await options.onAdd(newItem);
        // Replace optimistic item with real one
        setItems(prev => prev.map(item => item.id === tempId ? savedItem : item));
        toast.success(`${entityName} created successfully`);
        return savedItem;
      }
      return newItem;
    } catch (error) {
      // Rollback
      setItems(prev => prev.filter(item => item.id !== tempId));
      toast.error(`Failed to create ${entityName}`);
      throw error;
    }
  }, [options, entityName]);

  const update = useCallback(async (updatedItem: T) => {
    const originalItem = items.find(item => item.id === updatedItem.id);
    if (!originalItem) return updatedItem;
    
    // Optimistic update
    setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));

    try {
      if (options.onUpdate) {
        const savedItem = await options.onUpdate(updatedItem);
        // Ensure we have the latest server version
        setItems(prev => prev.map(item => item.id === updatedItem.id ? savedItem : item));
        toast.success(`${entityName} updated successfully`);
        return savedItem;
      }
      return updatedItem;
    } catch (error) {
      // Rollback
      setItems(prev => prev.map(item => item.id === updatedItem.id ? originalItem : item));
      toast.error(`Failed to update ${entityName}`);
      throw error;
    }
  }, [items, options, entityName]);

  const remove = useCallback(async (id: string) => {
    const originalItem = items.find(item => item.id === id);
    if (!originalItem) return;
    
    // Optimistic update
    setItems(prev => prev.filter(item => item.id !== id));

    try {
      if (options.onDelete) {
        await options.onDelete(id);
        toast.success(`${entityName} deleted successfully`);
      }
    } catch (error) {
      // Rollback
      setItems(prev => [...prev, originalItem]);
      toast.error(`Failed to delete ${entityName}`);
      throw error;
    }
  }, [items, options, entityName]);

  return {
    items,
    setItems,
    add,
    update,
    remove
  };
}
