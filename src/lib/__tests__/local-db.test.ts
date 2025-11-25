import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as LocalDB from '@/lib/local-db';
import { Customer, Item, Quote } from '@/types';

// Mock localStorage with user-specific key support
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    // Add method to clear user-specific keys
    clearUserData: (userId: string) => {
      Object.keys(store).forEach(key => {
        if (key.includes(userId) || !key.includes('user-')) {
          delete store[key];
        }
      });
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Local Database Operations', () => {
  const TEST_USER_ID = 'test-user-123';
  
  beforeEach(() => {
    // Clear all storage including user-specific keys
    localStorage.clear();
    // Also clear any test user data
    (localStorage as any).clearUserData?.(TEST_USER_ID);
    vi.clearAllMocks();
  });

  describe('Customer Operations', () => {
    it('should add a customer to local storage', () => {
      const customer: Customer = {
        id: 'cust-1',
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '555-0100',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        createdAt: new Date().toISOString(),
      };

      const result = LocalDB.addLocalCustomer(customer);

      expect(result).toEqual(customer);
      const stored = LocalDB.getLocalCustomers();
      expect(stored).toHaveLength(1);
      expect(stored[0]).toEqual(customer);
    });

    it('should update a customer in local storage', () => {
      const customer: Customer = {
        id: 'cust-1',
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '555-0100',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        createdAt: new Date().toISOString(),
      };

      LocalDB.addLocalCustomer(customer);

      const updated = LocalDB.updateLocalCustomer('cust-1', {
        name: 'Updated Customer',
      });

      expect(updated?.name).toBe('Updated Customer');
      expect(updated?.email).toBe('test@example.com');
    });

    it('should delete a customer from local storage', () => {
      const customer: Customer = {
        id: 'cust-1',
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '555-0100',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        createdAt: new Date().toISOString(),
      };

      LocalDB.addLocalCustomer(customer);
      const deleted = LocalDB.deleteLocalCustomer('cust-1');

      expect(deleted).toBe(true);
      expect(LocalDB.getLocalCustomers()).toHaveLength(0);
    });

    it('should mark customer as pending sync after modification', () => {
      const customer: Customer = {
        id: 'cust-1',
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '555-0100',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        createdAt: new Date().toISOString(),
      };

      LocalDB.addLocalCustomer(customer);

      const syncStatus = LocalDB.getSyncStatus('cust-1');
      expect(syncStatus?.status).toBe('pending');
    });
  });

  describe('Item Operations', () => {
    it('should add an item to local storage', () => {
      const item: Item = {
        id: 'item-1',
        name: 'Test Item',
        description: 'Test Description',
        basePrice: 100,
        markupType: 'percentage',
        markup: 50,
        finalPrice: 150,
        category: 'Test Category',
        units: 'each',
        createdAt: new Date().toISOString(),
      };

      const result = LocalDB.addLocalItem(item);

      expect(result).toEqual(item);
      const stored = LocalDB.getLocalItems();
      expect(stored).toHaveLength(1);
    });

    it('should update an item in local storage', () => {
      const item: Item = {
        id: 'item-1',
        name: 'Test Item',
        description: 'Test Description',
        basePrice: 100,
        markupType: 'percentage',
        markup: 50,
        finalPrice: 150,
        category: 'Test Category',
        units: 'each',
        createdAt: new Date().toISOString(),
      };

      LocalDB.addLocalItem(item);

      const updated = LocalDB.updateLocalItem('item-1', {
        finalPrice: 200,
      });

      expect(updated?.finalPrice).toBe(200);
      expect(updated?.basePrice).toBe(100);
    });

    it('should delete an item from local storage', () => {
      const item: Item = {
        id: 'item-1',
        name: 'Test Item',
        description: 'Test Description',
        basePrice: 100,
        markupType: 'percentage',
        markup: 50,
        finalPrice: 150,
        category: 'Test Category',
        units: 'each',
        createdAt: new Date().toISOString(),
      };

      LocalDB.addLocalItem(item);
      const deleted = LocalDB.deleteLocalItem('item-1');

      expect(deleted).toBe(true);
      expect(LocalDB.getLocalItems()).toHaveLength(0);
    });
  });

  describe('Quote Operations', () => {
    it('should add a quote to local storage', () => {
      const quote: Quote = {
        id: 'quote-1',
        quoteNumber: 'Q-001',
        customerId: 'cust-1',
        customerName: 'Test Customer',
        title: 'Test Quote',
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = LocalDB.addLocalQuote(quote);

      expect(result).toEqual(quote);
      const stored = LocalDB.getLocalQuotes();
      expect(stored).toHaveLength(1);
    });

    it('should update a quote in local storage', () => {
      const quote: Quote = {
        id: 'quote-1',
        quoteNumber: 'Q-001',
        customerId: 'cust-1',
        customerName: 'Test Customer',
        title: 'Test Quote',
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      LocalDB.addLocalQuote(quote);

      const updated = LocalDB.updateLocalQuote('quote-1', {
        status: 'sent',
      });

      expect(updated?.status).toBe('sent');
    });

    it('should delete a quote from local storage', () => {
      const quote: Quote = {
        id: 'quote-1',
        quoteNumber: 'Q-001',
        customerId: 'cust-1',
        customerName: 'Test Customer',
        title: 'Test Quote',
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      LocalDB.addLocalQuote(quote);
      const deleted = LocalDB.deleteLocalQuote('quote-1');

      expect(deleted).toBe(true);
      expect(LocalDB.getLocalQuotes()).toHaveLength(0);
    });
  });

  describe('Sync Status Management', () => {
    it('should set sync status to pending after create', () => {
      const customer: Customer = {
        id: 'cust-1',
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '555-0100',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        createdAt: new Date().toISOString(),
      };

      LocalDB.addLocalCustomer(customer);
      const status = LocalDB.getSyncStatus('cust-1');

      expect(status?.status).toBe('pending');
    });

    it('should update sync status to synced', () => {
      const customer: Customer = {
        id: 'cust-1',
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '555-0100',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        createdAt: new Date().toISOString(),
      };

      LocalDB.addLocalCustomer(customer);
      LocalDB.setSyncStatus('cust-1', 'synced');

      const status = LocalDB.getSyncStatus('cust-1');
      expect(status?.status).toBe('synced');
    });

    it('should update sync status to failed with error message', () => {
      const customer: Customer = {
        id: 'cust-1',
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '555-0100',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        createdAt: new Date().toISOString(),
      };

      LocalDB.addLocalCustomer(customer);
      LocalDB.setSyncStatus('cust-1', 'failed', 'Network error');

      const status = LocalDB.getSyncStatus('cust-1');
      expect(status?.status).toBe('failed');
      expect(status?.error).toBe('Network error');
    });

    it('should get all pending sync IDs', () => {
      const customer: Customer = {
        id: 'cust-1',
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '555-0100',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        createdAt: new Date().toISOString(),
      };

      LocalDB.addLocalCustomer(customer);
      LocalDB.addLocalCustomer({ ...customer, id: 'cust-2' });
      LocalDB.setSyncStatus('cust-1', 'synced');

      const pendingIds = LocalDB.getAllPendingSyncIds();
      expect(pendingIds).toContain('cust-2');
      expect(pendingIds).not.toContain('cust-1');
    });

    it('should clear sync status', () => {
      const customer: Customer = {
        id: 'cust-1',
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '555-0100',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        createdAt: new Date().toISOString(),
      };

      LocalDB.addLocalCustomer(customer);
      LocalDB.clearSyncStatus('cust-1');

      const status = LocalDB.getSyncStatus('cust-1');
      expect(status).toBeNull();
    });
  });

  describe('Data Persistence', () => {
    it('should persist data across page reloads', () => {
      const customer: Customer = {
        id: 'cust-1',
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '555-0100',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        createdAt: new Date().toISOString(),
      };

      LocalDB.addLocalCustomer(customer);

      // Simulate page reload by reading directly from localStorage
      const stored = JSON.parse(localStorage.getItem('customers-local-v1') || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe('cust-1');
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('customers', 'invalid-json');

      const customers = LocalDB.getLocalCustomers();
      expect(customers).toEqual([]);
    });
  });
});
