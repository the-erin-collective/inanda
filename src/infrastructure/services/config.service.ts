import { Injectable, Inject, PLATFORM_ID, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformServer, isPlatformBrowser } from '@angular/common';
import { StateKey, TransferState, makeStateKey } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Inline AppConfig type since the token file is removed
export interface AppConfig {
  DATA_PATH?: string;
  SHOW_GITHUB_BANNER: boolean;
  GITHUB_BANNER_URL: string;
}

const CONFIG_STATE_KEY = makeStateKey<any>('app-config');

@Injectable({ providedIn: 'root' })
export class ConfigService {

  constructor(
    @Optional() private http: HttpClient,
    @Optional() private transferState: TransferState,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

    public async init(): Promise<void> {
        await this.loadConfig();
    }

  private async loadConfig() {
    try {
      let config: AppConfig | null = null;

      if (isPlatformServer(this.platformId)) {
        // Dynamically require Node.js modules only on the server
        const fs = require('fs');
        const path = require('path');
        const configPath = path.join(
          process.cwd(),
          process.env['NODE_ENV'] === 'production' ? 'config.prod.json' : 'config.dev.json'
        );
        if (fs.existsSync(configPath)) {
          config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          this.transferState?.set(CONFIG_STATE_KEY, config);
        } else {
          throw new Error(`Config file not found: ${configPath}`);
        }
        return;
      }

      if (this.transferState && this.transferState.hasKey(CONFIG_STATE_KEY)) {
        return;
      }

      config = await this.loadBrowserConfig();

      if (!config) {
        throw new Error(`Config failed to load.`);
      }

      this.transferState.set(CONFIG_STATE_KEY, config);
    } catch (err) {
      console.error('[ConfigService] Error loading config:', err);
      // Keep using default config in case of errors
    }
  }

  /**
   * Browser-side config loading via HTTP
   */
  private async loadBrowserConfig(): Promise<AppConfig> {
    try {
      const baseHref = (document.querySelector('base')?.getAttribute('href') || '/').replace(/\/$/, '');
      const configUrl = baseHref + '/presentation/assets/config.json';
      console.log(`[ConfigService] Loading browser config from ${configUrl}`);
      const apiConfig = await firstValueFrom(this.http.get<AppConfig>(configUrl));
    
      console.log('[ConfigService] Browser config loaded via API');

      return apiConfig;
    } catch (err) {
      console.error(`[ConfigService] Error loading browser config:`, err);
    }

    throw new Error(`loadBrowserConfig failed.`);
  }
  /**
   * Get a config value by key. Throws if not found.
   */
  public get<T>(key: string): T {
    if (!this.transferState?.hasKey(CONFIG_STATE_KEY)) {
      throw new Error(`[ConfigService] Config data not available in TransferState`);
    }
    const config = this.transferState.get(CONFIG_STATE_KEY, null);
    if (!config) {
      throw new Error(`[ConfigService] Config data is empty or invalid`);
    }
    const value = key.split('.').reduce((o, i) => (o ? o[i] : undefined), config as any);
    if (value === undefined) {
      throw new Error(`[ConfigService] Config key not found: ${key}`);
    }
    return value;
  }

  /**
   * Get all config. Throws if not found.
   */
  public getAll(): AppConfig {
    if (!this.transferState?.hasKey(CONFIG_STATE_KEY)) {
      throw new Error(`[ConfigService] Config data not available in TransferState`);
    }
    const config = this.transferState.get(CONFIG_STATE_KEY, null);
    if (!config) {
      throw new Error(`[ConfigService] Config data is empty or invalid`);
    }
    return { ...config };
  }
}
