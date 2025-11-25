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
// Note: We need to ensure this is exported from request-pool-service first, 
// or we keep a stub here if it was local.
// Looking at dashboard.tsx import: import { ..., clearInFlightRequests } from "@/lib/db-service";
// We should import it from request-pool-service and export it.
export { clearInFlightRequests } from './services/request-pool-service';
    
// If there are any other utility functions that were in db-service, 
// check if they need to be preserved or if they are now in the services.
