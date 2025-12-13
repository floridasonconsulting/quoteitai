import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CustomerDB,
  ItemDB,
  QuoteDB,
  SettingsDB,
  SyncQueueDB,
  deleteDatabase,
  getStorageStats,
  isIndexedDBSupported,
} from '../indexed-db';
import { Customer, Item, Quote, CompanySettings } from '@/types';

// Mock IndexedDB for testing
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};

describe('IndexedDB Wrapper', () => {
  beforeEach(async () => {
    // Clean up database before each test
    try {
      await deleteDatabase();
    } catch (error) {
      console.log('Database cleanup failed (may not exist yet)');
    }
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      await deleteDatabase();
    } catch (error) {
      console.log('Database cleanup failed');
    }
  });

  describe('Browser Support', () => {
    it('should detect IndexedDB support', () => {
      const supported = isIndexedDBSupported();
      expect(typeof supported).toBe('boolean');
    });
  });

  describe('Customer Operations', () => {
    const mockCustomer: Customer = {
      id: 'test-customer-1',
      userId: 'test-user', // Changed from passed in args to property
      name: 'Test Customer',
      email: 'test@example.com',
      phone: '555-0123',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zip: '12345',
      createdAt: new Date().toISOString(),
    };

    it('should add a customer', async () => {
      const result = await CustomerDB.add(mockCustomer as never);
      expect(result.id).toBe(mockCustomer.id);
    });

    it('should retrieve a customer by ID', async () => {
      await CustomerDB.add(mockCustomer as never);
      const result = await CustomerDB.getById(mockCustomer.id);
      expect(result).toBeTruthy();
      expect(result?.id).toBe(mockCustomer.id);
    });

    it('should retrieve all customers for a user', async () => {
      const customer2 = { ...mockCustomer, id: 'test-customer-2' };
      await CustomerDB.add(mockCustomer as never);
      await CustomerDB.add(customer2 as never);
      
      const results = await CustomerDB.getAll('test-user');
      expect(results.length).toBe(2);
    });

    it('should update a customer', async () => {
      await CustomerDB.add(mockCustomer as never);
      const updated = { ...mockCustomer, name: 'Updated Name' };
      await CustomerDB.update(updated as never);
      
      const result = await CustomerDB.getById(mockCustomer.id);
      expect(result?.name).toBe('Updated Name');
    });

    it('should delete a customer', async () => {
      await CustomerDB.add(mockCustomer as never);
      await CustomerDB.delete(mockCustomer.id);
      
      const result = await CustomerDB.getById(mockCustomer.id);
      expect(result).toBeNull();
    });

    it('should clear all customers for a user', async () => {
      await CustomerDB.add(mockCustomer as never);
      await CustomerDB.add({ ...mockCustomer, id: 'test-customer-2' } as never);
      
      await CustomerDB.clear('test-user');
      
      const results = await CustomerDB.getAll('test-user');
      expect(results.length).toBe(0);
    });
  });

  describe('add', () => {
    it('should add a new record', async () => {
      const customer = {
        id: `test-customer-${Date.now()}`,
        userId: 'user-123',
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '123-456-7890',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        createdAt: new Date().toISOString(),
      };

      const result = await CustomerDB.add(customer);
      expect(result).toEqual(customer);

      const stored = await CustomerDB.getById(customer.id);
      // Stored record has user_id added, so we use objectContaining or expect specific fields
      expect(stored).toEqual(expect.objectContaining(customer));
    });

    it('should fail when adding record with same ID', async () => {
      const customer = {
        id: 'duplicate-id',
        userId: 'user-123',
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '123-456-7890',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        createdAt: new Date().toISOString(),
      };

      await CustomerDB.add(customer);
      
      await expect(CustomerDB.add(customer)).rejects.toThrow();
    });
  });

  describe('Item Operations', () => {
    const mockItem: Item = {
      id: 'test-item-1',
      name: 'Test Item',
      description: 'Test Description',
      category: 'Test Category',
      basePrice: 100,
      markupType: 'percentage',
      markup: 20,
      finalPrice: 120,
      units: 'each',
      createdAt: new Date().toISOString(),
    };

    it('should add an item', async () => {
      const result = await ItemDB.add({ ...mockItem, user_id: 'test-user' } as never);
      expect(result.id).toBe(mockItem.id);
    });

    it('should retrieve an item by ID', async () => {
      await ItemDB.add({ ...mockItem, user_id: 'test-user' } as never);
      const result = await ItemDB.getById(mockItem.id);
      expect(result).toBeTruthy();
      expect(result?.id).toBe(mockItem.id);
    });

    it('should update an item', async () => {
      await ItemDB.add({ ...mockItem, user_id: 'test-user' } as never);
      const updated = { ...mockItem, name: 'Updated Item', user_id: 'test-user' };
      await ItemDB.update(updated as never);
      
      const result = await ItemDB.getById(mockItem.id);
      expect(result?.name).toBe('Updated Item');
    });

    it('should delete an item', async () => {
      await ItemDB.add({ ...mockItem, user_id: 'test-user' } as never);
      await ItemDB.delete(mockItem.id);
      
      const result = await ItemDB.getById(mockItem.id);
      expect(result).toBeNull();
    });
  });

  describe('Quote Operations', () => {
    const mockQuote: Quote = {
      id: 'test-quote-1',
      quoteNumber: 'Q-001',
      customerId: 'test-customer-1',
      customerName: 'Test Customer',
      title: 'Test Quote',
      items: [],
      subtotal: 1000,
      tax: 80,
      total: 1080,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should add a quote', async () => {
      const result = await QuoteDB.add({ ...mockQuote, user_id: 'test-user' } as never);
      expect(result.id).toBe(mockQuote.id);
    });

    it('should retrieve a quote by ID', async () => {
      await QuoteDB.add({ ...mockQuote, user_id: 'test-user' } as never);
      const result = await QuoteDB.getById(mockQuote.id);
      expect(result).toBeTruthy();
      expect(result?.id).toBe(mockQuote.id);
    });

    it('should update quote status', async () => {
      await QuoteDB.add({ ...mockQuote, user_id: 'test-user' } as never);
      const updated = { ...mockQuote, status: 'sent' as const, user_id: 'test-user' };
      await QuoteDB.update(updated as never);
      
      const result = await QuoteDB.getById(mockQuote.id);
      expect(result?.status).toBe('sent');
    });

    it('should delete a quote', async () => {
      await QuoteDB.add({ ...mockQuote, user_id: 'test-user' } as never);
      await QuoteDB.delete(mockQuote.id);
      
      const result = await QuoteDB.getById(mockQuote.id);
      expect(result).toBeNull();
    });
  });

  describe('Company Settings Operations', () => {
    const mockSettings: CompanySettings = {
      name: 'Test Company',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zip: '12345',
      phone: '555-0123',
      email: 'test@company.com',
      website: 'https://test.com',
      terms: 'Test terms',
      proposalTemplate: 'classic',
    };

    it('should save company settings', async () => {
      await SettingsDB.set('test-user', mockSettings);
      const result = await SettingsDB.get('test-user');
      expect(result?.name).toBe(mockSettings.name);
    });

    it('should update company settings', async () => {
      await SettingsDB.set('test-user', mockSettings);
      const updated = { ...mockSettings, name: 'Updated Company' };
      await SettingsDB.set('test-user', updated);
      
      const result = await SettingsDB.get('test-user');
      expect(result?.name).toBe('Updated Company');
    });
  });

  describe('Storage Statistics', () => {
    it('should get storage statistics', async () => {
      const stats = await getStorageStats();
      expect(stats).toBeTruthy();
      expect(typeof stats.usage).toBe('number');
      expect(typeof stats.quota).toBe('number');
      expect(typeof stats.percentage).toBe('number');
    });
  });
});
