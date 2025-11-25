import { useState, useCallback } from 'react';
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
  
  // NOTE: We removed the useEffect sync because it was causing infinite loops.
  // The parent component should handle initial data loading by calling setItems directly
  // after fetching data from the server/cache.

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
    // Use functional form to get current items without adding to dependencies
    let originalItem: T | undefined;
    setItems(prev => {
      originalItem = prev.find(item => item.id === updatedItem.id);
      // Optimistic update
      return prev.map(item => item.id === updatedItem.id ? updatedItem : item);
    });
    
    if (!originalItem) return updatedItem;

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
      // Rollback using the captured originalItem
      setItems(prev => prev.map(item => item.id === updatedItem.id ? originalItem : item));
      toast.error(`Failed to update ${entityName}`);
      throw error;
    }
  }, [options, entityName]);

  const remove = useCallback(async (id: string) => {
    // Use functional form to capture original item without adding items to dependencies
    let originalItem: T | undefined;
    setItems(prev => {
      originalItem = prev.find(item => item.id === id);
      // Optimistic update
      return prev.filter(item => item.id !== id);
    });
    
    if (!originalItem) return;

    try {
      if (options.onDelete) {
        await options.onDelete(id);
        toast.success(`${entityName} deleted successfully`);
      }
    } catch (error) {
      // Rollback using the captured originalItem
      if (originalItem) {
        setItems(prev => [...prev, originalItem]);
      }
      toast.error(`Failed to delete ${entityName}`);
      throw error;
    }
  }, [options, entityName]); // Removed items from dependencies

  return {
    items,
    setItems,
    add,
    update,
    remove
  };
}
