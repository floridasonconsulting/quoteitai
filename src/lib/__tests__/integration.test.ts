
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { checkAndMigrateData } from "@/lib/migration-helper";
import { IndexedDBService } from "@/lib/indexed-db";
import { CustomerService } from "@/lib/services/customer-service";
import { ItemService } from "@/lib/services/item-service";
import { QuoteService } from "@/lib/services/quote-service";
import type { Customer, Item, Quote } from "@/types";

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null,
        })),
      })),
      insert: vi.fn(() => ({ data: [], error: null })),
      update: vi.fn(() => ({ data: [], error: null })),
      delete: vi.fn(() => ({ data: [], error: null })),
    })),
    auth: {
      getSession: vi.fn(() => ({
        data: { session: { user: { id: "test-user-id" } } },
        error: null,
      })),
    },
  },
}));

describe("Integration Tests - IndexedDB Migration & Data Flow", () => {
  const testUserId = "test-user-123";
  let customerService: CustomerService;
  let itemService: ItemService;
  let quoteService: QuoteService;

  beforeEach(async () => {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Initialize services
    customerService = new CustomerService();
    itemService = new ItemService();
    quoteService = new QuoteService();

    // Clear IndexedDB
    const db = await IndexedDBService.getInstance();
    await db.clearAllData();
  });

  afterEach(async () => {
    // Cleanup
    localStorage.clear();
    const db = await IndexedDBService.getInstance();
    await db.clearAllData();
  });

  describe("localStorage to IndexedDB Migration", () => {
    it("should migrate customers from localStorage to IndexedDB", async () => {
      // Setup: Add test data to localStorage
      const testCustomers: Customer[] = [
        {
          id: "cust-1",
          user_id: testUserId,
          name: "Test Customer 1",
          email: "test1@example.com",
          phone: "555-0001",
          company: "Test Co 1",
          address: "123 Test St",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "cust-2",
          user_id: testUserId,
          name: "Test Customer 2",
          email: "test2@example.com",
          phone: "555-0002",
          company: "Test Co 2",
          address: "456 Test Ave",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      localStorage.setItem(`customers_${testUserId}`, JSON.stringify(testCustomers));

      // Execute migration
      await checkAndMigrateData(testUserId);

      // Verify: Data should be in IndexedDB
      const db = await IndexedDBService.getInstance();
      const migratedCustomers = await db.getAll<Customer>("customers");
      
      expect(migratedCustomers).toHaveLength(2);
      expect(migratedCustomers[0].name).toBe("Test Customer 1");
      expect(migratedCustomers[1].name).toBe("Test Customer 2");

      // Verify: localStorage should still have the data (backup)
      const localStorageData = localStorage.getItem(`customers_${testUserId}`);
      expect(localStorageData).toBeTruthy();
    });

    it("should migrate items from localStorage to IndexedDB", async () => {
      // Setup: Add test data to localStorage
      const testItems: Item[] = [
        {
          id: "item-1",
          user_id: testUserId,
          name: "Test Item 1",
          description: "Description 1",
          price: 100,
          category: "Category 1",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "item-2",
          user_id: testUserId,
          name: "Test Item 2",
          description: "Description 2",
          price: 200,
          category: "Category 2",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      localStorage.setItem(`items_${testUserId}`, JSON.stringify(testItems));

      // Execute migration
      await checkAndMigrateData(testUserId);

      // Verify: Data should be in IndexedDB
      const db = await IndexedDBService.getInstance();
      const migratedItems = await db.getAll<Item>("items");
      
      expect(migratedItems).toHaveLength(2);
      expect(migratedItems[0].name).toBe("Test Item 1");
      expect(migratedItems[1].price).toBe(200);
    });

    it("should migrate quotes from localStorage to IndexedDB", async () => {
      // Setup: Add test data to localStorage
      const testQuotes: Quote[] = [
        {
          id: "quote-1",
          user_id: testUserId,
          customer_id: "cust-1",
          quote_number: "Q-001",
          date: new Date().toISOString(),
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          items: [],
          subtotal: 1000,
          tax: 100,
          total: 1100,
          status: "draft",
          notes: "Test notes",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      localStorage.setItem(`quotes_${testUserId}`, JSON.stringify(testQuotes));

      // Execute migration
      await checkAndMigrateData(testUserId);

      // Verify: Data should be in IndexedDB
      const db = await IndexedDBService.getInstance();
      const migratedQuotes = await db.getAll<Quote>("quotes");
      
      expect(migratedQuotes).toHaveLength(1);
      expect(migratedQuotes[0].quote_number).toBe("Q-001");
      expect(migratedQuotes[0].total).toBe(1100);
    });

    it("should handle migration when localStorage is empty", async () => {
      // Execute migration with no data
      await checkAndMigrateData(testUserId);

      // Verify: IndexedDB should be empty but initialized
      const db = await IndexedDBService.getInstance();
      const customers = await db.getAll<Customer>("customers");
      const items = await db.getAll<Item>("items");
      const quotes = await db.getAll<Quote>("quotes");
      
      expect(customers).toHaveLength(0);
      expect(items).toHaveLength(0);
      expect(quotes).toHaveLength(0);
    });
  });

  describe("Service Layer Data Flow", () => {
    it("should save customer to IndexedDB first, then sync to Supabase", async () => {
      const newCustomer: Omit<Customer, "id" | "created_at" | "updated_at"> = {
        user_id: testUserId,
        name: "Service Test Customer",
        email: "service@example.com",
        phone: "555-9999",
        company: "Service Test Co",
        address: "789 Service St",
      };

      // Create customer through service
      const createdCustomer = await customerService.createCustomer(newCustomer);

      // Verify: Customer should be in IndexedDB
      const db = await IndexedDBService.getInstance();
      const customersInDB = await db.getAll<Customer>("customers");
      
      expect(customersInDB).toHaveLength(1);
      expect(customersInDB[0].name).toBe("Service Test Customer");
      expect(customersInDB[0].email).toBe("service@example.com");
    });

    it("should update customer in IndexedDB and queue for sync", async () => {
      // First, create a customer
      const newCustomer: Omit<Customer, "id" | "created_at" | "updated_at"> = {
        user_id: testUserId,
        name: "Original Name",
        email: "original@example.com",
        phone: "555-0000",
        company: "Original Co",
        address: "Original St",
      };
      const created = await customerService.createCustomer(newCustomer);

      // Update the customer
      const updates: Partial<Customer> = {
        name: "Updated Name",
        email: "updated@example.com",
      };
      await customerService.updateCustomer(created.id, updates);

      // Verify: Customer should be updated in IndexedDB
      const db = await IndexedDBService.getInstance();
      const customer = await db.get<Customer>("customers", created.id);
      
      expect(customer?.name).toBe("Updated Name");
      expect(customer?.email).toBe("updated@example.com");
    });

    it("should delete customer from IndexedDB and queue for sync", async () => {
      // First, create a customer
      const newCustomer: Omit<Customer, "id" | "created_at" | "updated_at"> = {
        user_id: testUserId,
        name: "To Delete",
        email: "delete@example.com",
        phone: "555-0000",
        company: "Delete Co",
        address: "Delete St",
      };
      const created = await customerService.createCustomer(newCustomer);

      // Delete the customer
      await customerService.deleteCustomer(created.id);

      // Verify: Customer should be removed from IndexedDB
      const db = await IndexedDBService.getInstance();
      const customer = await db.get<Customer>("customers", created.id);
      
      expect(customer).toBeNull();
    });

    it("should handle offline operations and queue for sync", async () => {
      // Simulate offline mode by mocking network error
      const originalFetch = global.fetch;
      global.fetch = vi.fn(() => Promise.reject(new Error("Network error")));

      const newCustomer: Omit<Customer, "id" | "created_at" | "updated_at"> = {
        user_id: testUserId,
        name: "Offline Customer",
        email: "offline@example.com",
        phone: "555-0000",
        company: "Offline Co",
        address: "Offline St",
      };

      // Create customer while offline
      const created = await customerService.createCustomer(newCustomer);

      // Verify: Customer should still be in IndexedDB
      const db = await IndexedDBService.getInstance();
      const customer = await db.get<Customer>("customers", created.id);
      
      expect(customer).toBeTruthy();
      expect(customer?.name).toBe("Offline Customer");

      // Restore fetch
      global.fetch = originalFetch;
    });
  });

  describe("Data Persistence & Retrieval", () => {
    it("should retrieve all customers from IndexedDB", async () => {
      // Add multiple customers
      const customers: Omit<Customer, "id" | "created_at" | "updated_at">[] = [
        {
          user_id: testUserId,
          name: "Customer 1",
          email: "c1@example.com",
          phone: "555-0001",
          company: "Company 1",
          address: "Address 1",
        },
        {
          user_id: testUserId,
          name: "Customer 2",
          email: "c2@example.com",
          phone: "555-0002",
          company: "Company 2",
          address: "Address 2",
        },
        {
          user_id: testUserId,
          name: "Customer 3",
          email: "c3@example.com",
          phone: "555-0003",
          company: "Company 3",
          address: "Address 3",
        },
      ];

      for (const customer of customers) {
        await customerService.createCustomer(customer);
      }

      // Retrieve all customers
      const allCustomers = await customerService.getCustomers();

      expect(allCustomers).toHaveLength(3);
      expect(allCustomers.map(c => c.name)).toContain("Customer 1");
      expect(allCustomers.map(c => c.name)).toContain("Customer 2");
      expect(allCustomers.map(c => c.name)).toContain("Customer 3");
    });

    it("should retrieve a single customer by ID from IndexedDB", async () => {
      // Create a customer
      const newCustomer: Omit<Customer, "id" | "created_at" | "updated_at"> = {
        user_id: testUserId,
        name: "Single Customer",
        email: "single@example.com",
        phone: "555-0000",
        company: "Single Co",
        address: "Single St",
      };
      const created = await customerService.createCustomer(newCustomer);

      // Retrieve the customer by ID
      const customer = await customerService.getCustomer(created.id);

      expect(customer).toBeTruthy();
      expect(customer?.name).toBe("Single Customer");
      expect(customer?.email).toBe("single@example.com");
    });
  });

  describe("Cache Integration", () => {
    it("should use cache for frequently accessed data", async () => {
      // Create a customer
      const newCustomer: Omit<Customer, "id" | "created_at" | "updated_at"> = {
        user_id: testUserId,
        name: "Cached Customer",
        email: "cached@example.com",
        phone: "555-0000",
        company: "Cached Co",
        address: "Cached St",
      };
      const created = await customerService.createCustomer(newCustomer);

      // First retrieval (should cache)
      const customer1 = await customerService.getCustomer(created.id);
      
      // Second retrieval (should use cache)
      const customer2 = await customerService.getCustomer(created.id);

      expect(customer1).toEqual(customer2);
      expect(customer2?.name).toBe("Cached Customer");
    });
  });
});
