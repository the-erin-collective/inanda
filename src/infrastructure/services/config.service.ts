import { Injectable, Inject, PLATFORM_ID, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformServer, isPlatformBrowser } from '@angular/common';
import { StateKey, TransferState, makeStateKey } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfig } from '../providers/config/app-config.token';

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

    private async loadConfig(){
try 
        {
            if(isPlatformServer(this.platformId)){
              return;
            }
            if (this.transferState && this.transferState.hasKey(CONFIG_STATE_KEY)) {
               return;
            } 
            let config: AppConfig;
             
            config = await this.loadBrowserConfig();

            if(!config){
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
    
      const configUrl = '/presentation/assets/config.json';
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
