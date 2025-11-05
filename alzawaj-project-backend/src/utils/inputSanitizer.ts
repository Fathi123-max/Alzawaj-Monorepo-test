/**
 * Utility functions for sanitizing user input to prevent NoSQL injection and other vulnerabilities
 */

/**
 * Escapes special regex characters in a string to prevent regex injection
 * @param str - The string to escape
 * @returns The escaped string safe for use in regex patterns
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitizes a search term for use in MongoDB regex operations
 * @param searchTerm - The user-provided search term
 * @returns A sanitized string safe for regex operations
 */
export function sanitizeSearchTerm(searchTerm: string): string {
  if (!searchTerm) return '';
  
  // First escape regex special characters
  const escaped = escapeRegExp(searchTerm);
  
  // Then limit length to prevent ReDoS attacks
  return escaped.substring(0, 100);
}

/**
 * Validates and sanitizes age range values
 */
export function validateAgeRange(min?: number, max?: number): { min?: number | undefined, max?: number | undefined } | null {
  if (min !== undefined && (typeof min !== 'number' || min < 18 || min > 100)) {
    return null;
  }
  
  if (max !== undefined && (typeof max !== 'number' || max < 18 || max > 100)) {
    return null;
  }
  
  if (min !== undefined && max !== undefined && min > max) {
    return null; // Invalid range
  }
  
  return { min, max };
}

/**
 * Validates and sanitizes pagination parameters
 */
export function validatePagination(page?: number, limit?: number): { page: number, limit: number } {
  const validPage = page && Number.isInteger(page) && page >= 1 ? page : 1;
  const validLimit = limit && Number.isInteger(limit) && limit >= 1 && limit <= 100 ? limit : 20;
  
  return { page: validPage, limit: validLimit };
}

/**
 * Validates sort parameters
 */
export function validateSortBy(sortBy?: string): string {
  const validSortOptions = ['compatibility', 'age', 'newest', 'completion'];
  return validSortOptions.includes(sortBy || '') ? (sortBy as string) : 'compatibility';
}