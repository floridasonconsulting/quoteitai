import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  migrateToIndexedDB,
  isMigrationCompleted,
  getMigrationStatus,
  clearMigrationData,
  isIndexedDBSupported,
} from '../indexed-db-migration';
import { deleteDatabase } from '../indexed-db';
import { Customer, Item, Quote, CompanySettings } from '@/types';

describe('IndexedDB Migration', () => {
  const testUserId = 'test-user-migration';

  beforeEach(async () => {
    // Clear migration data and database before each test
    clearMigrationData();
    try {
      await deleteDatabase();
    } catch (error) {
      console.log('Database cleanup failed (may not exist yet)');
    }
    
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(async () => {
    // Clean up after each test
    clearMigrationData();
    try {
      await deleteDatabase();
    } catch (error) {
      console.log('Database cleanup failed');
    }
    localStorage.clear();
  });

  describe('Browser Support Check', () => {
    it('should check if IndexedDB is supported', () => {
      const supported = isIndexedDBSupported();
      expect(typeof supported).toBe('boolean');
    });
  });

  describe('Migration Status', () => {
    it('should return false if migration not completed', () => {
      const completed = isMigrationCompleted();
      expect(completed).toBe(false);
    });

    it('should return null if no migration status exists', () => {
      const status = getMigrationStatus();
      expect(status).toBeNull();
    });

    it('should clear migration data', () => {
      localStorage.setItem('indexeddb_migration_status', JSON.stringify({
        completed: true,
        timestamp: new Date().toISOString(),
        version: 1,
        customersCount: 0,
        itemsCount: 0,
        quotesCount: 0,
        settingsMigrated: false,
        errors: [],
      }));

      clearMigrationData();
      
      const status = getMigrationStatus();
      expect(status).toBeNull();
    });
  });

  describe('Migration with No Data', () => {
    it('should complete migration successfully when no data exists', async () => {
      const result = await migrateToIndexedDB(testUserId, {
        skipIfCompleted: false,
        clearLocalStorageAfter: false,
      });

      expect(result.success).toBe(true);
      expect(result.status.completed).toBe(true);
      expect(result.status.customersCount).toBe(0);
      expect(result.status.itemsCount).toBe(0);
      expect(result.status.quotesCount).toBe(0);
      expect(result.message).toContain('No data to migrate');
    });
  });

  describe('Migration with Sample Data', () => {
    beforeEach(() => {
      // Add sample data to localStorage
      const mockCustomers: Customer[] = [
        {
          id: 'customer-1',
          name: 'Test Customer 1',
          email: 'customer1@test.com',
          phone: '555-0001',
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zip: '12345',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'customer-2',
          name: 'Test Customer 2',
          email: 'customer2@test.com',
          phone: '555-0002',
          address: '456 Test Ave',
          city: 'Test City',
          state: 'TS',
          zip: '12345',
          createdAt: new Date().toISOString(),
        },
      ];

      const mockItems: Item[] = [
        {
          id: 'item-1',
          name: 'Test Item 1',
          description: 'Test Description 1',
          category: 'Category A',
          basePrice: 100,
          markupType: 'percentage',
          markup: 20,
          finalPrice: 120,
          units: 'each',
          createdAt: new Date().toISOString(),
        },
      ];

      const mockQuotes: Quote[] = [
        {
          id: 'quote-1',
          quoteNumber: 'Q-001',
          customerId: 'customer-1',
          customerName: 'Test Customer 1',
          title: 'Test Quote',
          items: [],
          subtotal: 1000,
          tax: 80,
          total: 1080,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const mockSettings: CompanySettings = {
        name: 'Test Company',
        address: '123 Company St',
        city: 'Company City',
        state: 'CS',
        zip: '54321',
        phone: '555-1234',
        email: 'info@testcompany.com',
        website: 'https://testcompany.com',
        terms: 'Net 30',
        proposalTemplate: 'modern',
      };

      localStorage.setItem(`customers_${testUserId}`, JSON.stringify(mockCustomers));
      localStorage.setItem(`items_${testUserId}`, JSON.stringify(mockItems));
      localStorage.setItem(`quotes_${testUserId}`, JSON.stringify(mockQuotes));
      localStorage.setItem('quote-it-settings', JSON.stringify(mockSettings));
    });

    it('should migrate all data successfully', async () => {
      const result = await migrateToIndexedDB(testUserId, {
        skipIfCompleted: false,
        clearLocalStorageAfter: false,
        timeoutMs: 30000,
      });

      expect(result.success).toBe(true);
      expect(result.status.completed).toBe(true);
      expect(result.status.customersCount).toBe(2);
      expect(result.status.itemsCount).toBe(1);
      expect(result.status.quotesCount).toBe(1);
      expect(result.status.settingsMigrated).toBe(true);
      expect(result.status.errors.length).toBe(0);
    });

    it('should skip migration if already completed', async () => {
      // First migration
      await migrateToIndexedDB(testUserId, {
        skipIfCompleted: false,
        clearLocalStorageAfter: false,
      });

      // Second migration with skip flag
      const result = await migrateToIndexedDB(testUserId, {
        skipIfCompleted: true,
        clearLocalStorageAfter: false,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('already completed');
    });

    it('should set migration status after successful migration', async () => {
      await migrateToIndexedDB(testUserId, {
        skipIfCompleted: false,
        clearLocalStorageAfter: false,
      });

      const completed = isMigrationCompleted();
      expect(completed).toBe(true);

      const status = getMigrationStatus();
      expect(status).toBeTruthy();
      expect(status?.completed).toBe(true);
      expect(status?.version).toBe(1);
    });
  });

  describe('Migration Error Handling', () => {
    it('should handle timeout gracefully', async () => {
      // Add large dataset to localStorage
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `customer-${i}`,
        name: `Customer ${i}`,
        email: `customer${i}@test.com`,
        phone: `555-${String(i).padStart(4, '0')}`,
        address: `${i} Test St`,
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        createdAt: new Date().toISOString(),
      }));

      localStorage.setItem(`customers_${testUserId}`, JSON.stringify(largeDataset));

      const result = await migrateToIndexedDB(testUserId, {
        skipIfCompleted: false,
        clearLocalStorageAfter: false,
        timeoutMs: 10, // Very short timeout to force error
      });

      // Migration should fail due to timeout
      expect(result.success).toBe(false);
      expect(result.message).toContain('timeout');
    });
  });

  describe('Backup and Rollback', () => {
    beforeEach(() => {
      // Add sample data
      const mockCustomers: Customer[] = [
        {
          id: 'customer-1',
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '555-0123',
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zip: '12345',
          createdAt: new Date().toISOString(),
        },
      ];

      localStorage.setItem(`customers_${testUserId}`, JSON.stringify(mockCustomers));
    });

    it('should create backup before migration', async () => {
      await migrateToIndexedDB(testUserId, {
        skipIfCompleted: false,
        clearLocalStorageAfter: false,
      });

      const backup = localStorage.getItem('indexeddb_migration_backup');
      expect(backup).toBeTruthy();

      const parsed = JSON.parse(backup!);
      expect(parsed.customers).toBeTruthy();
      expect(parsed.timestamp).toBeTruthy();
    });
  });
});
