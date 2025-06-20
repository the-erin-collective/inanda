import * as path from 'path';
import * as fs from 'fs';

export interface FileRepositoryOptions {  siteId: string;
  entityType: 'pages' | 'sites';
}

/**
 * Base class for file-based repository implementations.
 * Provides common functionality for reading/writing JSON files in the configured directory structure.
 */
export abstract class FileRepositoryBase<T> {
  protected readonly basePath: string;
  constructor(options: FileRepositoryOptions) {
    // Construct the base path for file operations
    this.basePath = path.join(
      process.cwd(),
      'data',
      'repository',
      'sites',
      options.siteId,
      options.entityType
    );
    
    console.log(`FileRepositoryBase: Initialized with basePath: ${this.basePath}`);
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.promises.mkdir(this.basePath, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }
  }
  protected async readJson<TData = Record<string, unknown>>(id: string): Promise<TData | null> {
    try {
      const filePath = path.join(this.basePath, `${id}.json`);
      console.log(`FileRepositoryBase: Attempting to read file at path: ${filePath}`);
      
      const content = await fs.promises.readFile(filePath, 'utf-8');
      console.log(`FileRepositoryBase: Successfully read file: ${filePath}`);
      return JSON.parse(content) as TData;
    } catch (err) {
      console.log(`FileRepositoryBase: Error reading file ${path.join(this.basePath, `${id}.json`)}: ${err.code || err.message}`);
      if (err.code === 'ENOENT') return null;
      throw err;
    }
  }

  protected async writeJson(id: string, data: Record<string, unknown>): Promise<void> {
    const filePath = path.join(this.basePath, `${id}.json`);
    await fs.promises.writeFile(
      filePath, 
      JSON.stringify(data, null, 2), 
      'utf-8'
    );
  }

  protected async deleteJson(id: string): Promise<void> {
    const filePath = path.join(this.basePath, `${id}.json`);
    try {
      await fs.promises.unlink(filePath);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  protected async listFiles(): Promise<string[]> {
    const files = await fs.promises.readdir(this.basePath);
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  }
}
