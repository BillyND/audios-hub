import { CACHE_CONFIG } from "../constants";

// Type definitions
type CacheItem<T> = {
  data: T;
  expirationTime: number;
};

/**
 * Cache service to handle localStorage operations with proper error handling
 */
const cacheService = {
  get: <T>(key: string): CacheItem<T> | null => {
    try {
      const cachedData = localStorage.getItem(`${CACHE_CONFIG.PREFIX}${key}`);
      if (!cachedData) return null;

      const parsedData = JSON.parse(cachedData) as CacheItem<T>;

      // Check if cache is valid and not expired
      if (parsedData.expirationTime && parsedData.expirationTime > Date.now()) {
        return parsedData;
      }

      // Cache expired, remove it
      cacheService.remove(key);
      return null;
    } catch (error) {
      console.error("Error reading from cache:", error);
      cacheService.remove(key);
      return null;
    }
  },

  set: <T>(key: string, data: T): boolean => {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        expirationTime: Date.now() + CACHE_CONFIG.TTL,
      };

      localStorage.setItem(
        `${CACHE_CONFIG.PREFIX}${key}`,
        JSON.stringify(cacheItem)
      );
      return true;
    } catch (error) {
      console.error("Error writing to cache:", error);
      return false;
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(`${CACHE_CONFIG.PREFIX}${key}`);
    } catch (error) {
      console.error("Error removing from cache:", error);
    }
  },
};

export default cacheService;
