import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IndexedDBMigrationService, clearMigrationData } from '../indexed-db-migration';
import { deleteDatabase, isIndexedDBSupported } from '../indexed-db';
import { Customer, Item, Quote, CompanySettings } from '@/types';

describe('IndexedDB Migration', () => {
  const testUserId = 'test-user-migration';
  let migrationService: IndexedDBMigrationService;

  beforeEach(async () => {
    // Initialize service
    migrationService = IndexedDBMigrationService.getInstance();
    migrationService.initialize(testUserId);

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
    it('should return true for needsMigration when data exists and DB is empty', async () => {
      localStorage.setItem(`customers_${testUserId}`, JSON.stringify([{ id: '1' }]));
      const needsMigration = await migrationService.needsMigration();
      expect(needsMigration).toBe(true);
    });

    it('should return false for needsMigration when no data exists', async () => {
      const needsMigration = await migrationService.needsMigration();
      expect(needsMigration).toBe(false);
    });
  });

  describe('Migration Process', () => {
    beforeEach(() => {
      // Add sample data to localStorage
      const mockCustomers: Customer[] = [
        {
          id: 'customer-1',
          userId: testUserId,
          name: 'Test Customer 1',
          email: 'customer1@test.com',
          phone: '555-0001',
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zip: '12345',
          createdAt: new Date().toISOString(),
        },
      ];

      const mockItems: Item[] = [
        {
          id: 'item-1',
          userId: testUserId,
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
      localStorage.setItem('quote-it-settings', JSON.stringify(mockSettings));
    });

    it('should migrate all data successfully', async () => {
      const result = await migrationService.migrateFromLocalStorage();

      expect(result.success).toBe(true);
      expect(result.status.completed).toBe(true);
      expect(result.status.customersCount).toBe(1);
      expect(result.status.itemsCount).toBe(1);
      expect(result.status.settingsMigrated).toBe(true);
      expect(result.status.errors.length).toBe(0);
    });

    it('should create backup before migration', async () => {
      await migrationService.migrateFromLocalStorage();

      const backup = localStorage.getItem('indexeddb_migration_backup');
      expect(backup).toBeTruthy();

      const parsed = JSON.parse(backup!);
      expect(parsed.customers).toBeTruthy();
      expect(parsed.timestamp).toBeTruthy();
    });
  });
});
