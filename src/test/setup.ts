// Import fake-indexeddb to polyfill IndexedDB in Node.js test environment
import 'fake-indexeddb/auto';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';

// CRITICAL: Explicitly set global IndexedDB objects to ensure polyfill works
// This is needed because fake-indexeddb/auto might not always work reliably
if (typeof globalThis.indexedDB === 'undefined') {
  globalThis.indexedDB = new IDBFactory();
}
if (typeof globalThis.IDBKeyRange === 'undefined') {
  globalThis.IDBKeyRange = IDBKeyRange;
}

// Verify IndexedDB is available (this should never fail now)
console.log('[Test Setup] IndexedDB polyfill status:', {
  indexedDB: typeof globalThis.indexedDB,
  IDBKeyRange: typeof globalThis.IDBKeyRange,
});

import '@testing-library/jest-dom';
import { beforeAll, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

// ============================================================================
// Cache Storage API Mock
// ============================================================================
const MOCK_ORIGIN = 'https://test.example.com';

class MockCache {
  private storage: Map<string, Response>;

  constructor() {
    this.storage = new Map();
  }

  private normalizeKey(request: RequestInfo | URL): string {
    if (typeof request === 'string') {
      // If it's a relative path, prepend the mock origin
      return request.startsWith('http') ? request : `${MOCK_ORIGIN}${request}`;
    }
    if (request instanceof Request) {
      return request.url;
    }
    return request.toString();
  }

  async match(request: RequestInfo | URL): Promise<Response | undefined> {
    const key = this.normalizeKey(request);
    return this.storage.get(key);
  }

  async matchAll(request?: RequestInfo | URL): Promise<Response[]> {
    if (!request) {
      return Array.from(this.storage.values());
    }
    const key = this.normalizeKey(request);
    const response = this.storage.get(key);
    return response ? [response] : [];
  }

  async put(request: RequestInfo | URL, response: Response): Promise<void> {
    const key = this.normalizeKey(request);
    this.storage.set(key, response);
  }

  async delete(request: RequestInfo | URL): Promise<boolean> {
    const key = this.normalizeKey(request);
    return this.storage.delete(key);
  }

  async keys(): Promise<Request[]> {
    return Array.from(this.storage.keys()).map(key => new Request(key));
  }
}

class MockCacheStorage {
  private caches: Map<string, MockCache>;

  constructor() {
    this.caches = new Map();
  }

  async open(cacheName: string): Promise<Cache> {
    if (!this.caches.has(cacheName)) {
      this.caches.set(cacheName, new MockCache() as unknown as Cache);
    }
    return this.caches.get(cacheName) as unknown as Cache;
  }

  async has(cacheName: string): Promise<boolean> {
    return this.caches.has(cacheName);
  }

  async delete(cacheName: string): Promise<boolean> {
    return this.caches.delete(cacheName);
  }

  async keys(): Promise<string[]> {
    return Array.from(this.caches.keys());
  }

  async match(request: RequestInfo | URL): Promise<Response | undefined> {
    for (const cache of this.caches.values()) {
      const response = await cache.match(request);
      if (response) return response;
    }
    return undefined;
  }
}

// Set up global caches mock
if (typeof globalThis.caches === 'undefined') {
  globalThis.caches = new MockCacheStorage() as unknown as CacheStorage;
}

// Mock StorageEstimate API for quota management
if (typeof navigator !== 'undefined' && !navigator.storage) {
  Object.defineProperty(navigator, 'storage', {
    value: {
      estimate: vi.fn().mockResolvedValue({
        usage: 1024 * 1024 * 10, // 10MB
        quota: 1024 * 1024 * 1024, // 1GB
      }),
    },
    writable: true,
    configurable: true,
  });
}

// Verify Cache Storage API is available
console.log('[Test Setup] Cache Storage API polyfill status:', {
  caches: typeof globalThis.caches,
  navigator_storage: typeof navigator?.storage,
});

// Type-safe declaration for our global test helper
declare global {
  var triggerAuthStateChange: (event: AuthChangeEvent, session: Session | null) => void;
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// CRITICAL: Use vi.hoisted() to hoist factory functions BEFORE module imports
const { createSelectChain, createUpdateChain, createDeleteChain, createFromHandler } = vi.hoisted(() => {
  // Create mock factory functions with table-aware data
  const getMockDataForTable = (tableName: string) => {
    const mockData = {
      company_settings: {
        id: 'settings-1',
        user_id: 'user-123',
        name: 'Test Company',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        phone: '555-1234',
        email: 'test@example.com',
        website: 'https://test.com',
        license: 'LICENSE123',
        insurance: 'INSURANCE123',
        logo: 'https://example.com/logo.png',
        logo_display_option: 'both',
        terms: 'Payment due within 30 days',
        proposal_template: 'classic',
        notify_email_accepted: true,
        notify_email_declined: true,
      },
      user_roles: {
        user_id: 'user-123',
        role: 'max',
      },
      quotes: [],
      customers: [],
      items: [],
    };
    return mockData[tableName as keyof typeof mockData] || null;
  };

  const createSelectChain = (tableName?: string) => {
    const mockData = tableName ? getMockDataForTable(tableName) : null;
    
    // Create a fully chainable select query builder
    const selectBuilder = {
      eq: vi.fn((column: string, value: unknown) => {
        // Filter mock data based on column/value if needed
        // For now, just return the chainable methods
        return {
          single: vi.fn().mockResolvedValue({ 
            data: mockData, 
            error: null 
          }),
          maybeSingle: vi.fn().mockResolvedValue({ 
            data: mockData, 
            error: null 
          }),
          order: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({ 
              data: Array.isArray(mockData) ? mockData : (mockData ? [mockData] : []), 
              error: null 
            }),
          })),
        };
      }),
      order: vi.fn(() => ({
        limit: vi.fn().mockResolvedValue({ 
          data: Array.isArray(mockData) ? mockData : (mockData ? [mockData] : []), 
          error: null 
        }),
      })),
      single: vi.fn().mockResolvedValue({ 
        data: mockData, 
        error: null 
      }),
      maybeSingle: vi.fn().mockResolvedValue({ 
        data: mockData, 
        error: null 
      }),
    };
    
    // Make the selectBuilder itself a thenable promise
    // so it can be awaited directly: await supabase.from('table').select('*')
    return Object.assign(
      Promise.resolve({ 
        data: Array.isArray(mockData) ? mockData : (mockData ? [mockData] : []), 
        error: null 
      }),
      selectBuilder
    );
  };

  const createUpdateChain = () => {
    const chain = {
      eq: vi.fn().mockResolvedValue({ data: {}, error: null }),
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: {}, error: null }),
      })),
    };
    // Make it thenable so it can be awaited directly
    Object.assign(chain, Promise.resolve({ data: {}, error: null }));
    return chain;
  };

  const createDeleteChain = () => ({
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
  });

  const createInsertChain = () => {
    const chain = {
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: {}, error: null }),
      })),
    };
    Object.assign(chain, Promise.resolve({ data: {}, error: null }));
    return chain;
  };

  const createUpsertChain = () => {
    const chain = {
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: {}, error: null }),
      })),
    };
    Object.assign(chain, Promise.resolve({ data: {}, error: null }));
    return chain;
  };

  const createFromHandler = (tableName: string) => {
    const mockData = getMockDataForTable(tableName);
    
    // Helper to return a promise that also has chainable methods
    const createChainable = (mockResult: { data: unknown; error: Error | null; }) => {
      const promise = Promise.resolve(mockResult);
      const chainable = {
        select: vi.fn(() => createChainable({ data: Array.isArray(mockResult?.data) ? mockResult.data : [mockResult?.data], error: null })),
        insert: vi.fn(() => createChainable({ data: null, error: null })),
        upsert: vi.fn(() => createChainable({ data: null, error: null })),
        update: vi.fn(() => createChainable({ data: null, error: null })),
        delete: vi.fn(() => createChainable({ data: null, error: null })),
        eq: vi.fn(() => createChainable(mockResult)),
        single: vi.fn().mockResolvedValue(mockResult),
        maybeSingle: vi.fn().mockResolvedValue(mockResult),
        order: vi.fn(() => createChainable(mockResult)),
        limit: vi.fn(() => createChainable(mockResult)),
        url: new URL('https://example.com'),
        headers: {},
      };
      // Return a proxy to handle any method access
      return new Proxy(promise, {
        get: (target, prop) => {
          if (prop in chainable) {
            return chainable[prop as keyof typeof chainable];
          }
          if (prop === 'then') {
            return target.then.bind(target);
          }
          // Default fallback for unknown methods to return chainable
          return () => createChainable(mockResult);
        }
      });
    };

    return {
      select: vi.fn(() => createChainable({ data: [], error: null })),
      insert: vi.fn(() => createChainable({ data: null, error: null })),
      upsert: vi.fn(() => createChainable({ data: null, error: null })),
      update: vi.fn(() => createChainable({ data: null, error: null })),
      delete: vi.fn(() => createChainable({ data: null, error: null })),
      url: new URL('https://example.com'),
      headers: {},
    };
  };

  return { createSelectChain, createUpdateChain, createDeleteChain, createFromHandler };
});

// Now mock Supabase using the hoisted factories
vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        }),
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
        onAuthStateChange: vi.fn((callback) => {
          // Set up global helper for tests to trigger auth state changes
          globalThis.triggerAuthStateChange = (event: AuthChangeEvent, session: Session | null) => {
            callback(event, session);
          };
          return {
            data: { subscription: { unsubscribe: vi.fn() } },
          };
        }),
      },
      from: vi.fn((table) => {
        const handler = createFromHandler(table);
        return handler;
      }),
      rpc: vi.fn().mockResolvedValue({
        data: 'free', // Default to free tier
        error: null,
      }),
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn().mockResolvedValue({ data: null, error: null }),
          remove: vi.fn().mockResolvedValue({ data: null, error: null }),
          getPublicUrl: vi.fn(() => ({
            data: { publicUrl: 'https://example.com/logo.png' },
          })),
        })),
      },
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
    },
  };
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

vi.mock('@/lib/rate-limiter', () => {
  const mockRateLimiter = {
    register: vi.fn(),
    isAllowed: vi.fn().mockReturnValue({ allowed: true }),
    trackRequest: vi.fn().mockImplementation(async (_key, fn) => fn()),
    reset: vi.fn(),
    resetAll: vi.fn(),
    getStatus: vi.fn().mockReturnValue({
      count: 0,
      limit: 10,
      resetAt: Date.now() + 60000,
      isBlocked: false
    }),
  };

  return {
    rateLimiter: mockRateLimiter,
    withRateLimit: vi.fn().mockImplementation(async (_key, fn) => fn()),
  };
});
