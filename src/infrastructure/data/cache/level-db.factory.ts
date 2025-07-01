import { Level } from 'level';
import { join } from 'path';
import { mkdir, access, rm, readFile } from 'fs/promises';
import { environment } from '../../environments/environment.server';

// This is a singleton that holds the LevelDB instance
let db: Level<string, any> | null = null;

/**
 * Creates and initializes the LevelDB instance.
 * This should ONLY be called during server bootstrap.
 */
export async function createLevelDB(): Promise<Level<string, any>> {
  // Check if LevelDB is disabled
  if (process.env['USE_LEVEL_DB'] === 'false') {
    console.log('LevelDB is disabled by configuration');
    return null;
  }

  // If already initialized, return existing instance
  if (db) {
    console.log('LevelDB already initialized, reusing existing instance');
    return db;
  }
  
  // Check configuration before initializing

  if (environment.USE_LEVEL_DB === false) {
    console.log('LevelDB initialization skipped - USE_LEVEL_DB=false in config');
    throw new Error('LevelDB is disabled in configuration (USE_LEVEL_DB=false)');
  }

  // Use process.cwd() which is reliable in Node.js environments
  const rootDir = process.cwd();
  const cachePath = join(rootDir, 'cache');
  
  console.log('Initializing LevelDB at:', cachePath);
  
  // Ensure cache directory exists
  try {
    await access(cachePath);
  } catch {
    try {
      await mkdir(cachePath, { recursive: true });
    } catch (err) {
      throw new Error(`Cache directory could not be created at: ${cachePath}`);
    }
  }
  
  // Create LevelDB instance with proper error handling
  try {
    // Close any existing instance to prevent file locking issues
    if (db) {
      await db.close();
      db = null;
    }
    // Create a new LevelDB instance
    db = new Level(join(cachePath, 'db'), { 
      valueEncoding: 'json',
      createIfMissing: true,
      errorIfExists: false
    });
    
    // Test the database by putting and getting a value
    await db.put('__test__', { test: 'test', timestamp: Date.now() });
    const testValue = await db.get('__test__');
    
    console.log('LevelDB initialized successfully');
  } catch (err) {
    console.error('Error initializing LevelDB:', err);
    throw err;
  }
  
  return db;
}

/**
 * Returns the initialized LevelDB instance.
 * This will throw an error if called before createLevelDB() unless LevelDB is disabled.
 */
export function getLevelDB(): Level<string, any> {
  // If LevelDB is disabled, return null without error
  if (process.env['USE_LEVEL_DB'] === 'false') {
    return null;
  }
  
  if (!db) {
    throw new Error('LevelDB not initialized. Call createLevelDB() during server bootstrap.');
  }
  return db;
}

/**
 * Closes the LevelDB instance.
 * This should be called during application shutdown.
 */
export async function closeLevelDB(): Promise<void> {
  if (db) {
    try {
      await db.close();
      db = null;
      console.log('LevelDB closed successfully');
    } catch (err) {
      console.error('Error closing LevelDB:', err);
      throw err;
    }
  }
}

/**
 * Resets the cache by clearing all key-value pairs except system keys.
 * This is useful for debugging and testing.
 */
export async function resetCache(): Promise<void> {
  if (!db) {
    console.warn('Cannot reset cache: LevelDB not initialized');
    return;
  }
  
  console.log('Resetting cache...');
  
  try {
    // Get all keys
    const keys: string[] = [];
    for await (const key of db.keys()) {
      // Skip system keys that start with __
      if (!key.startsWith('__')) {
        keys.push(key);
      }
    }
    
    console.log(`Found ${keys.length} keys to delete`);
    
    // Delete each key
    for (const key of keys) {
      try {
        await db.del(key);
        console.log(`Deleted key: ${key}`);
      } catch (err) {
        console.error(`Error deleting key ${key}:`, err);
      }
    }
    
    console.log('Cache reset successfully');
  } catch (err) {
    console.error('Error resetting cache:', err);
    throw err;
  }
}

/**
 * Completely destroys the cache directory.
 * WARNING: This will delete all data in the cache!
 * This should only be used for cleanup during development.
 */
export async function destroyCache(): Promise<void> {
  // Close the database if it's open
  if (db) {
    try {
      await db.close();
      db = null;
      console.log('Closed LevelDB connection');
    } catch (err) {
      console.error('Error closing LevelDB:', err);
    }
  }
  
  // Delete the cache directory
  try {
    const rootDir = process.cwd();
    const cachePath = join(rootDir, 'cache');
    
    console.log(`Attempting to destroy cache at ${cachePath}`);
    
    // Check if directory exists
    try {
      await access(cachePath);
    } catch {
      console.log('Cache directory does not exist, nothing to destroy');
      return;
    }
    
    // Delete the directory
    await rm(cachePath, { recursive: true, force: true });
    console.log('Cache directory destroyed successfully');
  } catch (err) {
    console.error('Error destroying cache:', err);
    throw err;
  }
}