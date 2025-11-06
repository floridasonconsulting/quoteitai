import '@testing-library/jest-dom';
import { beforeAll, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// CRITICAL: Use vi.hoisted() to hoist factory functions BEFORE module imports
const { createSelectChain, createUpdateChain, createDeleteChain, createFromHandler } = vi.hoisted(() => {
  // Create mock factory functions
  const createSelectChain = () => {
    const chain = {
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
      order: vi.fn(() => ({
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    // Make it thenable so it can be awaited directly
    Object.assign(chain, Promise.resolve({ data: [], error: null }));
    return chain;
  };

  const createUpdateChain = () => {
    const chain = {
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    };
    // Make it thenable so it can be awaited directly
    Object.assign(chain, Promise.resolve({ data: null, error: null }));
    return chain;
  };

  const createDeleteChain = () => ({
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
  });

  const createFromHandler = () => ({
    select: vi.fn(() => createSelectChain()),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
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
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
      },
      from: vi.fn((table) => {
        const handler = createFromHandler();
        return handler;
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
