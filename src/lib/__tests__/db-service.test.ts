import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as dbService from '@/lib/db-service';
import { supabase } from '@/integrations/supabase/client';
import { Customer } from '@/types';

vi.mock('@/integrations/supabase/client');

const createTestCustomer = (id: string): Customer => ({
  id,
  name: 'Test Customer',
  email: 'test@example.com',
  phone: '555-0100',
  address: '123 Test St',
  city: 'Test City',
  state: 'TS',
  zip: '12345',
  createdAt: new Date().toISOString(),
});

describe('Database Service - Repository Pattern', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  describe('Repository Abstraction', () => {
    it('should abstract direct Supabase access for customers', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);
      await dbService.getCustomers('user-1');
      expect(supabase.from).toHaveBeenCalledWith('customers');
      expect(mockSelect).toHaveBeenCalledWith('*');
    });

    it('should use local DB as single source of truth when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: false });
      const customer = createTestCustomer('cust-1');
      await dbService.addCustomer('user-1', customer);
      const customers = await dbService.getCustomers('user-1');
      expect(customers).toHaveLength(1);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('camelCase <-> snake_case Transformation', () => {
    it('should convert camelCase to snake_case for database', () => {
      const camelCase = { firstName: 'John', emailAddress: 'john@example.com' };
      const snakeCase = dbService.toSnakeCase(camelCase);
      expect(snakeCase).toEqual({ first_name: 'John', email_address: 'john@example.com' });
    });

    it('should convert snake_case to camelCase from database', () => {
      const snakeCase = { first_name: 'John', email_address: 'john@example.com' };
      const camelCase = dbService.toCamelCase(snakeCase);
      expect(camelCase).toEqual({ firstName: 'John', emailAddress: 'john@example.com' });
    });
  });
});
