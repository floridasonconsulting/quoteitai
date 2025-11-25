/**
 * Database Service (Main Entry Point)
 * 
 * This file maintains backward compatibility by re-exporting functions from
 * the new modular service layer. All implementation details have been moved
 * to focused service modules for better maintainability.
 * 
 * Service Modules:
 * - cache-service.ts: Cache management
 * - request-pool-service.ts: Request pooling and deduplication
 * - transformation-utils.ts: Data transformation
 * - customer-service.ts: Customer CRUD operations
 * - item-service.ts: Item CRUD operations
 * - quote-service.ts: Quote CRUD operations
 */

// Re-export everything from the specialized services
export * from './services/quote-service';
export * from './services/customer-service';
export * from './services/item-service';
    
// Re-export the clearInFlightRequests from the request pool service
export { clearInFlightRequests } from './services/request-pool-service';

// Re-export getSettings from storage for backward compatibility
export { getSettings } from './storage';
