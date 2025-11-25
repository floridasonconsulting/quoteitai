import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as dbService from '@/lib/db-service';
import { Customer, Item, Quote } from '@/types';
import * as indexedDB from '@/lib/indexed-db';

// Mock Supabase to simulate offline state
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.reject(new Error('Network error'))),
      insert: vi.fn(() => Promise.reject(new Error('Network error'))),
      update: vi.fn(() => Promise.reject(new Error('Network error'))),
      delete: vi.fn(() => Promise.reject(new Error('Network error'))),
    })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
  },
}));

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: false, // Start offline
});

const createTestCustomer = (id: string): Customer => ({
  id,
  name: 'Offline Customer',
  email: 'offline@example.com',
  phone: '555-0100',
  address: '123 Offline St',
  city: 'Test City',
  state: 'TS',
  zip: '12345',
  createdAt: new Date().toISOString(),
});

const createTestItem = (id: string): Item => ({
  id,
  name: 'Offline Item',
  description: 'Created offline',
  basePrice: 100,
  markupType: 'percentage',
  markup: 50,
  finalPrice: 150,
  category: 'Test',
  units: 'each',
  createdAt: new Date().toISOString(),
});

const createTestQuote = (id: string): Quote => ({
  id,
  quoteNumber: 'Q-001',
  customerId: 'cust-1',
  customerName: 'Test Customer',
  title: 'Test Quote',
  items: [],
  subtotal: 100,
  tax: 10,
  total: 110,
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('Offline CRUD Operations', () => {
  const TEST_USER_ID = 'test-user-123';
  
  beforeEach(async () => {
    // Clear IndexedDB for test user
    const customerDB = indexedDB.getCustomerDB();
    const itemDB = indexedDB.getItemDB();
    const quoteDB = indexedDB.getQuoteDB();
    
    await customerDB.clear();
    await itemDB.clear();
    await quoteDB.clear();
    
    // Clear localStorage cache
    localStorage.clear();
    vi.clearAllMocks();
    
    // Set offline mode
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });
  });
  
  afterEach(async () => {
    // Clean up after each test
    const customerDB = indexedDB.getCustomerDB();
    const itemDB = indexedDB.getItemDB();
    const quoteDB = indexedDB.getQuoteDB();
    
    await customerDB.clear();
    await itemDB.clear();
    await quoteDB.clear();
  });

  describe('Offline Customer Operations', () => {
    it('should create customer offline and store in IndexedDB', async () => {
      const customer = createTestCustomer('cust-1');
      const result = await dbService.addCustomer(TEST_USER_ID, customer);
      
      expect(result).toEqual({ ...customer, user_id: TEST_USER_ID });
      
      // Verify stored in IndexedDB
      const customerDB = indexedDB.getCustomerDB();
      const stored = await customerDB.getById('cust-1', TEST_USER_ID);
      expect(stored).toBeTruthy();
      expect(stored?.id).toBe('cust-1');
    });

    it('should read customer offline from IndexedDB', async () => {
      const customer = createTestCustomer('cust-1');
      await dbService.addCustomer(TEST_USER_ID, customer);
      
      const customers = await dbService.getCustomers(TEST_USER_ID);
      
      expect(customers).toHaveLength(1);
      expect(customers[0].id).toBe(customer.id);
      expect(customers[0].name).toBe(customer.name);
    });

    it('should update customer offline', async () => {
      const customer = createTestCustomer('cust-1');
      await dbService.addCustomer('user-1', customer);
      const updated = await dbService.updateCustomer('user-1', 'cust-1', {
        name: 'Updated Offline Customer',
      });
      expect(updated.name).toBe('Updated Offline Customer');
      expect(updated.email).toBe('offline@example.com');
    });

    it('should delete customer offline', async () => {
      const customer = createTestCustomer('cust-1');
      await dbService.addCustomer('user-1', customer);
      await dbService.deleteCustomer('user-1', 'cust-1');
      const customers = await dbService.getCustomers('user-1');
      expect(customers).toHaveLength(0);
    });
  });

  describe('Offline Item Operations', () => {
    it('should create item offline', async () => {
      const item = createTestItem('item-1');
      const result = await dbService.addItem('user-1', item);
      expect(result).toEqual({ ...item, user_id: 'user-1' });
    });

    it('should read item offline', async () => {
      const item = createTestItem('item-1');
      await dbService.addItem('user-1', item);
      const items = await dbService.getItems('user-1');
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(item.id);
      expect(items[0].name).toBe(item.name);
    });

    it('should update item offline', async () => {
      const item = createTestItem('item-1');
      await dbService.addItem('user-1', item);
      const updated = await dbService.updateItem('user-1', 'item-1', {
        finalPrice: 200,
      });
      expect(updated.finalPrice).toBe(200);
    });

    it('should delete item offline', async () => {
      const item = createTestItem('item-1');
      await dbService.addItem('user-1', item);
      await dbService.deleteItem('user-1', 'item-1');
      const items = await dbService.getItems('user-1');
      expect(items).toHaveLength(0);
    });
  });

  describe('Offline Quote Operations', () => {
    it('should create quote offline', async () => {
      const quote = createTestQuote('quote-1');
      const result = await dbService.addQuote('user-1', quote);
      expect(result).toEqual({ ...quote, user_id: 'user-1' });
    });

    it('should read quote offline', async () => {
      const quote = createTestQuote('quote-1');
      await dbService.addQuote('user-1', quote);
      const quotes = await dbService.getQuotes('user-1');
      expect(quotes).toHaveLength(1);
    });

    it('should update quote offline', async () => {
      const quote = createTestQuote('quote-1');
      await dbService.addQuote('user-1', quote);
      const updated = await dbService.updateQuote('user-1', 'quote-1', {
        status: 'sent',
      });
      expect(updated.status).toBe('sent');
    });

    it('should delete quote offline', async () => {
      const quote = createTestQuote('quote-1');
      await dbService.addQuote('user-1', quote);
      await dbService.deleteQuote('user-1', 'quote-1');
      const quotes = await dbService.getQuotes('user-1');
      expect(quotes).toHaveLength(0);
    });
  });

  describe('UI Instant Updates', () => {
    it('should provide instant feedback for offline operations', async () => {
      const customer = createTestCustomer('cust-1');
      const startTime = Date.now();
      const result = await dbService.addCustomer('user-1', customer);
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100);
      expect(result).toEqual({ ...customer, user_id: 'user-1' });
    });
  });
});
