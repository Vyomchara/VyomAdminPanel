/**
 * Storage utility functions for client-side data persistence
 */

/**
 * Safely get an item from localStorage with JSON parsing
 * @param key The storage key
 * @returns The parsed value or null if not found
 */
export const getStorageItem = <T = any>(key: string): T | null => {
  if (typeof window !== 'undefined') {
    const item = localStorage.getItem(key);
    try {
      return item ? JSON.parse(item) : null;
    } catch (err) {
      console.error(`Error parsing localStorage item ${key}:`, err);
      return null;
    }
  }
  return null;
};

/**
 * Safely set an item in localStorage with JSON stringification
 * @param key The storage key
 * @param value The value to store
 */
export const setStorageItem = (key: string, value: any): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`Error storing localStorage item ${key}:`, err);
    }
  }
};

/**
 * Safely remove an item from localStorage
 * @param key The storage key to remove
 */
export const removeStorageItem = (key: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
  }
};

/**
 * Check if an item exists in localStorage
 * @param key The storage key to check
 * @returns Boolean indicating if the item exists
 */
export const hasStorageItem = (key: string): boolean => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key) !== null;
  }
  return false;
};