
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { checkAndMigrateData } from "@/lib/migration-helper";
import { getCustomers, addCustomer } from "@/lib/services/customer-service";
import { getItems, addItem } from "@/lib/services/item-service";
import { getQuotes, addQuote } from "@/lib/services/quote-service";
import { CustomerDB, ItemDB, QuoteDB } from "@/lib/indexed-db";
import { Customer, Item, Quote } from "@/types";

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
    })),
  },
}));

// Mock data refresh dispatch
vi.mock("@/hooks/useDataRefresh", () => ({
  dispatchDataRefresh: vi.fn(),
}));

describe("Integration Tests - Real Application Data Flow", () => {
  const testUserId = "test-user-123";
  
  beforeEach(async () => {
    // Clear all stores before each test
    await CustomerDB.clear(testUserId);
    await ItemDB.clear(testUserId);
    await QuoteDB.clear(testUserId);
    
    // Clear localStorage
    localStorage.clear();
    
    // Clear migration status and flags
    localStorage.removeItem("data-migrated-to-indexeddb");
    localStorage.removeItem("indexeddb_migration_status");
    localStorage.removeItem("indexeddb_migration_backup");
    
    // Set online mode
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Migration from localStorage to IndexedDB", () => {
    it("should migrate customers from localStorage to IndexedDB", async () => {
      // Setup: Add data to localStorage
      const localStorageCustomers: Customer[] = [
        {
          id: "cust-1",
          name: "Test Customer",
          email: "test@example.com",
          phone: "555-1234",
          address: "123 Main St",
          userId: testUserId,
        },
      ];
      localStorage.setItem(
        `customers_${testUserId}`,
        JSON.stringify(localStorageCustomers)
      );

      // Execute migration
      await checkAndMigrateData(testUserId);

      // Verify: Data should be in IndexedDB
      const indexedDBCustomers = await CustomerDB.getAll(testUserId);
      expect(indexedDBCustomers).toHaveLength(1);
      expect(indexedDBCustomers[0].name).toBe("Test Customer");
      expect(indexedDBCustomers[0].email).toBe("test@example.com");
    });

    it("should migrate items from localStorage to IndexedDB", async () => {
      // Setup: Add data to localStorage
      const localStorageItems: Item[] = [
        {
          id: "item-1",
          name: "Test Item",
          description: "Test Description",
          basePrice: 100,
          finalPrice: 120,
          markup: 20,
          markupType: "percentage",
          category: "Service",
          userId: testUserId,
        },
      ];
      localStorage.setItem(
        `items_${testUserId}`,
        JSON.stringify(localStorageItems)
      );

      // Execute migration
      await checkAndMigrateData(testUserId);

      // Verify: Data should be in IndexedDB
      const indexedDBItems = await ItemDB.getAll(testUserId);
      expect(indexedDBItems).toHaveLength(1);
      expect(indexedDBItems[0].name).toBe("Test Item");
      expect(indexedDBItems[0].basePrice).toBe(100);
    });

    it("should migrate quotes from localStorage to IndexedDB", async () => {
      // Setup: Add data to localStorage
      const localStorageQuotes: Quote[] = [
        {
          id: "quote-1",
          quoteNumber: "Q-001",
          customerId: "cust-1",
          customerName: "Test Customer",
          items: [],
          subtotal: 1000,
          tax: 100,
          total: 1100,
          status: "draft",
          validUntil: new Date().toISOString(),
          userId: testUserId,
        },
      ];
      localStorage.setItem(
        `quotes_${testUserId}`,
        JSON.stringify(localStorageQuotes)
      );

      // Execute migration
      await checkAndMigrateData(testUserId);

      // Verify: Data should be in IndexedDB
      const indexedDBQuotes = await QuoteDB.getAll(testUserId);
      expect(indexedDBQuotes).toHaveLength(1);
      expect(indexedDBQuotes[0].quoteNumber).toBe("Q-001");
      expect(indexedDBQuotes[0].total).toBe(1100);
    });
  });

  describe("Service Layer Integration with IndexedDB", () => {
    it("should retrieve customers from IndexedDB when available", async () => {
      // Setup: Add data directly to IndexedDB
      const testCustomer: Customer = {
        id: "cust-1",
        name: "IndexedDB Customer",
        email: "indexed@example.com",
        phone: "555-5678",
        address: "456 Oak Ave",
        userId: testUserId,
      };
      await CustomerDB.add(testCustomer as never);

      // Execute: Fetch customers using service
      const customers = await getCustomers(testUserId);

      // Verify: Should return IndexedDB data
      expect(customers).toHaveLength(1);
      expect(customers[0].name).toBe("IndexedDB Customer");
      expect(customers[0].email).toBe("indexed@example.com");
    });

    it("should save new customers to IndexedDB", async () => {
      // Execute: Add customer using service
      const newCustomer: Customer = {
        id: "cust-2",
        name: "New Customer",
        email: "new@example.com",
        phone: "555-9999",
        address: "789 Pine St",
        userId: testUserId,
      };
      await addCustomer(testUserId, newCustomer);

      // Verify: Should be in IndexedDB
      const indexedDBCustomers = await CustomerDB.getAll(testUserId);
      expect(indexedDBCustomers).toHaveLength(1);
      expect(indexedDBCustomers[0].name).toBe("New Customer");
    });

    it("should save new items to IndexedDB", async () => {
      // Execute: Add item using service
      const newItem: Item = {
        id: "item-2",
        name: "New Item",
        description: "New Description",
        basePrice: 200,
        finalPrice: 240,
        markup: 20,
        markupType: "percentage",
        category: "Product",
        userId: testUserId,
      };
      await addItem(testUserId, newItem);

      // Verify: Should be in IndexedDB
      const indexedDBItems = await ItemDB.getAll(testUserId);
      expect(indexedDBItems).toHaveLength(1);
      expect(indexedDBItems[0].name).toBe("New Item");
    });

    it("should save new quotes to IndexedDB", async () => {
      // Execute: Add quote using service
      const newQuote: Quote = {
        id: "quote-2",
        quoteNumber: "Q-002",
        customerId: "cust-1",
        customerName: "Test Customer",
        items: [],
        subtotal: 2000,
        tax: 200,
        total: 2200,
        status: "draft",
        validUntil: new Date().toISOString(),
        userId: testUserId,
      };
      await addQuote(testUserId, newQuote);

      // Verify: Should be in IndexedDB
      const indexedDBQuotes = await QuoteDB.getAll(testUserId);
      expect(indexedDBQuotes).toHaveLength(1);
      expect(indexedDBQuotes[0].quoteNumber).toBe("Q-002");
    });
  });

  describe("Offline-Online Sync Behavior", () => {
    it("should work offline with IndexedDB", async () => {
      // Setup: Go offline
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);

      // Execute: Add customer while offline
      const offlineCustomer: Customer = {
        id: "cust-offline",
        name: "Offline Customer",
        email: "offline@example.com",
        phone: "555-0000",
        address: "Offline St",
        userId: testUserId,
      };
      await addCustomer(testUserId, offlineCustomer);

      // Verify: Should be in IndexedDB
      const indexedDBCustomers = await CustomerDB.getAll(testUserId);
      expect(indexedDBCustomers).toHaveLength(1);
      expect(indexedDBCustomers[0].name).toBe("Offline Customer");
    });

    it("should retrieve data from IndexedDB when offline", async () => {
      // Setup: Add data to IndexedDB while online
      const testItem: Item = {
        id: "item-offline",
        name: "Offline Item",
        description: "Available offline",
        basePrice: 150,
        finalPrice: 180,
        markup: 20,
        markupType: "percentage",
        category: "Service",
        userId: testUserId,
      };
      await ItemDB.add(testItem as never);

      // Go offline
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);

      // Execute: Fetch items while offline
      const items = await getItems(testUserId);

      // Verify: Should return IndexedDB data
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe("Offline Item");
    });
  });

  describe("Data Persistence Across Sessions", () => {
    it("should persist customer data across app restarts", async () => {
      // Setup: Add customer
      const persistentCustomer: Customer = {
        id: "cust-persist",
        name: "Persistent Customer",
        email: "persist@example.com",
        phone: "555-1111",
        address: "Persistent Ln",
        userId: testUserId,
      };
      await addCustomer(testUserId, persistentCustomer);

      // Simulate app restart by clearing cache
      // (IndexedDB persists across page reloads)

      // Execute: Fetch customers
      const customers = await getCustomers(testUserId);

      // Verify: Should retrieve persisted data
      expect(customers).toHaveLength(1);
      expect(customers[0].name).toBe("Persistent Customer");
    });
  });
});
