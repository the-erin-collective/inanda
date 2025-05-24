import { Level } from 'level';
import { join } from 'path';
import { mkdir, access } from 'fs/promises';

let dbInstance: Level<string, any> | null = null;

async function ensureCacheDirectory(path: string): Promise<void> {
  try {
    await access(path);
  } catch {
    try {
      await mkdir(path, { recursive: true });
      console.log(`Created cache directory at: ${path}`);
    } catch (err) {
      console.error(`Failed to create cache directory at: ${path}`, err);
      throw new Error(`Cache directory could not be created at: ${path}. Please ensure the application has write permissions.`);
    }
  }
}

export async function initializeLevelDB(): Promise<void> {
  if (dbInstance) {
    return;
  }

  const rootDir = process.cwd();
  const cachePath = join(rootDir, 'data', 'cache');

  console.log('Initializing LevelDB at:', cachePath);

  try {
    await ensureCacheDirectory(cachePath);
    
    // Use a relative path to avoid __dirname issues
    dbInstance = new Level(cachePath, { valueEncoding: 'json' });
    console.log('LevelDB initialized successfully');
  } catch (err) {
    console.error('Failed to initialize LevelDB:', err);
    throw new Error(`Failed to initialize LevelDB at ${cachePath}: ${err.message}`);
  }
}

export function getLevelDB(): Level<string, any> {
  if (!dbInstance) {
    throw new Error('LevelDB has not been initialized. Make sure to call initializeLevelDB() during server bootstrap.');
  }
  return dbInstance;
} 