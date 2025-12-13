
/**
 * Transformation Utilities
 * Convert between camelCase (frontend) and snake_case (database)
 */

/**
 * Convert object keys from camelCase to snake_case
 */
export function toSnakeCase(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }
  
  const snakeCaseObj: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      snakeCaseObj[snakeKey] = toSnakeCase((obj as Record<string, unknown>)[key]);
    }
  }
  return snakeCaseObj;
}

/**
 * Convert object keys from snake_case to camelCase
 */
export function toCamelCase(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  const camelCaseObj: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      camelCaseObj[camelKey] = toCamelCase((obj as Record<string, unknown>)[key]);
    }
  }
  return camelCaseObj;
}
