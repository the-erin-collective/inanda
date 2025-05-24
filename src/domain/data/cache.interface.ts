export interface CacheData {
  /**
   * Gets data for a key, using the fetchFn if the key doesn't exist in cache
   */
  getData<T>(key: string, fetchFn: () => Promise<T>): Promise<T>;
  
  /**
   * Invalidates a cache entry forcing a fresh fetch on next getData call
   */
  invalidate(key: string): Promise<void>;
  
  /**
   * Checks if a key exists in the cache without fetching data
   */
  exists(key: string): Promise<boolean>;
  
  /**
   * Directly stores a value in the cache with the current version
   */
  put<T>(key: string, data: T): Promise<void>;
}
