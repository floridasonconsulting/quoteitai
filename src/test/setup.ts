import '@testing-library/jest-dom';
import { beforeAll, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

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
        logo_url: 'https://example.com/logo.png',
        logo_display_option: 'name',
        proposal_template: 'detailed',
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
    const chain = {
      eq: vi.fn(() => ({
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
      })),
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
    // Make it thenable so it can be awaited directly
    Object.assign(chain, Promise.resolve({ 
      data: Array.isArray(mockData) ? mockData : (mockData ? [mockData] : []), 
      error: null 
    }));
    return chain;
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

  const createFromHandler = (tableName: string) => ({
    select: vi.fn(() => createSelectChain(tableName)),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: {}, error: null }),
      })),
    })),
    update: vi.fn(() => createUpdateChain()),
    delete: vi.fn(() => createDeleteChain()),
  });

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
  return {
    checkRateLimit: vi.fn().mockResolvedValue({
      rateLimit: {
        limit: 100,
        remaining: 99,
        reset: 1688256000,
      },
      error: null,
      allowed: true,
      resetIn: 0,
    }),
    RATE_LIMITS: {
      // Define your rate limits here
      // For example:
      // 'some-action': { limit: 10, window: 60 },
    },
  };
});
