import 'core-js/features/async-iterator';
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import { bootstrapApplication } from '@angular/platform-browser';
import { provideServerRendering } from '@angular/platform-server';
import { AppComponent } from '../../presentation/app/app.component';
import { config } from './app.config.server';
import mongoose from 'mongoose';
import { createLevelDB, getLevelDB, closeLevelDB, resetCache } from '../../infrastructure/data/cache/level-db.factory';
import { MONGO_CONNECTION_FACTORY } from '../../infrastructure/data/db/mongo.factory';
import { isPlatformServer } from '@angular/common';

console.log('Starting server bootstrap...');

// Enable debug mode if DEBUG environment variable is set
const DEBUG_MODE = !!process.env['DEBUG'] || !!process.env['MONGOOSE_DEBUG'];
if (DEBUG_MODE) {
  console.log('Debug mode enabled');
  mongoose.set('debug', true);
}

// Set up global error handler to terminate process on unhandled errors
process.on('uncaughtException', (err) => {
  console.error('FATAL: Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('FATAL: Unhandled Promise rejection:', reason);
  process.exit(1);
});

// MongoDB connection check
const checkMongoDBConnectivity = async (): Promise<boolean> => {
  try {
    const MONGO_URI = process.env['MONGO_URI'];
    if (!MONGO_URI) {
      console.warn('No MongoDB URI provided, assuming MongoDB is not needed or will connect later.');
      return false;
    }

    const { URL } = require('url');
    const net = require('net');
    const url = new URL(MONGO_URI);
    const host = url.hostname;
    const port = url.port || 27017;

    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(5000);
      socket.once('connect', () => {
        console.log(`TCP connection to MongoDB at ${host}:${port} successful`);
        socket.end();
        resolve(true);
      });
      socket.once('error', (err) => {
        console.warn(`TCP connection to MongoDB failed: ${err.message}`);
        socket.destroy();
        resolve(false);
      });
      socket.once('timeout', () => {
        console.warn('MongoDB connection timed out');
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, host);
    });
  } catch (err) {
    console.warn('Error checking MongoDB connectivity:', err);
    return false;
  }
};

// MongoDB connection factory
const connectToDatabase = async (): Promise<boolean> => {
  try {
    // Check storage type first - if using file storage, don't try to connect to MongoDB
    const storageType = process.env['PERSISTENT_STORAGE'];
    if (storageType === 'FILE') {
      console.log('Using FILE storage, skipping MongoDB connection');
      return false;
    }
    
    const MONGO_URI = process.env['MONGO_URI'];
    
    if (!MONGO_URI) {
      console.warn('No MongoDB URI provided, will operate with cache only');
      return false;
    }
    
    // Close any existing connection first to avoid connection issues
    try {
      if (mongoose.connection && mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log('Closed existing MongoDB connection');
      }
    } catch (err) {
      console.warn('Error closing existing MongoDB connection:', err.message);
    }
    
    console.log('Connecting to MongoDB...');
    
    // Set up connection options with longer timeouts
    const connectionOptions: mongoose.ConnectOptions = { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4 as 4 // Force IPv4
    };

    // Create a promise that resolves when the connection is ready
    const connectionPromise = new Promise<boolean>((resolve, reject) => {
      let isResolved = false;
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          reject(new Error('MongoDB connection timeout after 30 seconds'));
        }
      }, 30000);

      // Set up connection event handlers
      function onConnected() {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          console.log('Mongoose connected event received');
          // Give a small delay to ensure connection state is updated
          setTimeout(() => {
            if (mongoose.connection.readyState === 1) {
              cleanup();
              resolve(true);
            } else {
              cleanup();
              reject(new Error(`MongoDB connection state invalid after connected event: ${mongoose.connection.readyState}`));
            }
          }, 100);
        }
      }

      function onConnectionError(err: Error) {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          console.error('Mongoose connection error:', err);
          cleanup();
          reject(err);
        }
      }

      function cleanup() {
        mongoose.connection.off('connected', onConnected);
        mongoose.connection.off('error', onConnectionError);
      }

      // Set up event handlers before connecting
      mongoose.connection.once('connected', onConnected);
      mongoose.connection.once('error', onConnectionError);

      // Also handle disconnect events
      mongoose.connection.on('disconnected', () => {
        console.log('Mongoose disconnected');
      });
    });

    // Set up permanent event listeners before connecting
    mongoose.connection.on('connecting', () => {
      console.log('Mongoose connecting...');
    });

    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, connectionOptions);

    // Wait for the connection to be fully established
    await connectionPromise;

    // Final verification
    if (mongoose.connection.readyState !== 1) {
      throw new Error(`MongoDB connection verification failed, current state: ${mongoose.connection.readyState}`);
    }
    
    console.log('Connected to MongoDB successfully');
    return true;
  } catch (err) {
    console.error('MongoDB connection failed with error:', err);
    if (err.name === 'MongooseServerSelectionError') {
      console.warn('MongoDB server selection failed - check if MongoDB server is running and accessible');
    }
    return false;
  }
};

// Check if we need MongoDB by checking cache for required data
const checkCacheForRequiredData = async (): Promise<boolean> => {
  try {
    // If using FILE storage, we never need MongoDB
    const storageType = process.env['PERSISTENT_STORAGE'];
    if (storageType === 'FILE') {
      console.log('Using FILE storage, no need to check cache for MongoDB requirements');
      return false;
    }
    
    const db = getLevelDB();
    
    // Check if we have the main site content cached
    const siteKey = 'site:site-001';
    const siteContentKey = 'site-content:site-001';
    
    console.log('Checking cache for required data...');
    
    // First, check if the complete site content is in cache
    let hasSiteContent = false;
    try {
      const siteContent = await db.get(siteContentKey);
      hasSiteContent = !!siteContent;
      console.log('Site content found in cache:', hasSiteContent ? 'yes' : 'no');
    } catch (err) {
      console.log('Site content not found in cache');
      hasSiteContent = false;
    }
    
    // If complete site content is in cache, we don't need MongoDB
    if (hasSiteContent) {
      console.log('Complete site content found in cache, no need to connect to MongoDB');
      return false;
    }
    
    // If site content is not in cache, check if site and all its pages are in cache
    console.log('Checking for site data...');
    
    let siteData = null;
    try {
      siteData = await db.get(siteKey);
      console.log('Site data found in cache');
    } catch (err) {
      console.log('Site data not found in cache');
      // No site data - need MongoDB
      return true;
    }
    
    // We have site data but not site content
    if (siteData && siteData.data && siteData.data.pageOrder && Array.isArray(siteData.data.pageOrder)) {
      console.log(`Checking if all ${siteData.data.pageOrder.length} pages exist in cache...`);
      
      // Check if all pages exist in cache
      let allPagesInCache = true;
      const missingPages = [];
      
      for (const pageId of siteData.data.pageOrder) {
        try {
          const pageKey = `page:${pageId}`;
          const pageData = await db.get(pageKey);
          // Check if the value exists and has the correct structure with data
          if (!pageData || typeof pageData !== 'object' || !('data' in pageData) || 
              pageData.data === null || pageData.data === undefined) {
            allPagesInCache = false;
            missingPages.push(pageId);
          }
        } catch (err) {
          allPagesInCache = false;
          missingPages.push(pageId);
        }
      }
      
      if (allPagesInCache) {
        console.log('All pages found in cache, can operate without MongoDB');
        return false; // No need for MongoDB
      } else {
        console.log(`Some pages missing from cache (${missingPages.join(', ') || 'N/A'}), MongoDB connection required`);
        return true; // Need MongoDB to fetch pages
      }
    }
    
    // Default case: need MongoDB
    console.log('Need MongoDB connection to fetch data');
    return true;
  } catch (err) {
    console.error('Error checking cache:', err);
    return true; // On error, better try MongoDB
  }
};

// We'll check cache first, then decide whether to connect to MongoDB
const bootstrapFn = async () => {
  try {
    // Check storage type first
    const storageType = process.env['PERSISTENT_STORAGE'];
    const useFileStorage = storageType === 'FILE';

    // Log storage configuration for debugging
    console.log(`Storage configuration: PERSISTENT_STORAGE=${storageType || 'not set (using MongoDB)'}`);

    // Always initialize LevelDB first, regardless of RESET_CACHE
    await createLevelDB();

    // Reset cache if requested (for development and debugging)
    if (process.env['RESET_CACHE'] === 'true') {
      console.log('RESET_CACHE=true, clearing cache before initialization');
      try {
        await resetCache();
        console.log('Cache reset successfully');
      } catch (err) {
        console.error('Error resetting cache:', err);
      }
    }
    
    // Skip MongoDB checks if using file storage
    if (useFileStorage) {
      console.log('Using file-based storage, skipping MongoDB connection');
      return bootstrapApplication(AppComponent, {
        providers: [
          provideServerRendering(),
          ...config.providers,
          { provide: MONGO_CONNECTION_FACTORY, useValue: async () => false }
        ],
      });
    }

    // MongoDB-specific bootstrap logic
    const mongodbAccessible = await checkMongoDBConnectivity();
    console.log(`MongoDB connectivity: ${mongodbAccessible ? 'ACCESSIBLE' : 'NOT ACCESSIBLE'}`);
    
    const needsMongoDB = await checkCacheForRequiredData();
    
    if (needsMongoDB && !mongodbAccessible) {
      console.error('FATAL ERROR: MongoDB connection required but connectivity test failed.');
      console.error('Please ensure MongoDB server is running and accessible before starting the application.');
      process.exit(1);
    } else if (!mongodbAccessible) {
      console.warn('MongoDB is not accessible, but all required data is available in cache.');
      console.warn('The application will run in offline mode using cached data.');
    }
    
    let mongoConnected = false;
    if (needsMongoDB) {
      console.log('Cache missing required data, attempting MongoDB connection');
      mongoConnected = await connectToDatabase();
      
      if (!mongoConnected) {
        console.error('FATAL ERROR: MongoDB connection required but failed. Required data is missing from cache and MongoDB is unavailable.');
        process.exit(1);
      }
    } else {
      console.log('Cache has required data, skipping MongoDB connection');
    }
    
    console.log(`MongoDB connection status: ${mongoConnected ? 'Connected' : 'Not connected, using cache'}`);
    console.log('Bootstrapping Angular...');

    return bootstrapApplication(AppComponent, {
      providers: [
        provideServerRendering(),
        ...config.providers,
        { provide: MONGO_CONNECTION_FACTORY, useValue: async () => mongoConnected }
      ],
    });
  } catch (err) {
    console.error('FATAL ERROR during bootstrap:', err);
    process.exit(1);
  }
};

// Export but also wrap in error handler
export default async () => {
  try {
    // Clean up any previous resources
    try {
      // Close any existing MongoDB connection
      if (mongoose.connection && mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log('Cleaned up existing MongoDB connection');
      }
    } catch (err) {
      console.error('Error during cleanup:', err);
    }

    const app = await bootstrapFn();
    
    // Register cleanup handler for proper shutdown
    const cleanup = async () => {
      console.log('Application shutting down, cleaning up resources...');
      try {
        // Close MongoDB connection
        if (mongoose.connection && mongoose.connection.readyState !== 0) {
          await mongoose.connection.close()
            .then(() => console.log('MongoDB connection closed during cleanup'))
            .catch(err => console.error('Error closing MongoDB during cleanup:', err));
        }
        
        // Close LevelDB
        await closeLevelDB()
          .then(() => console.log('LevelDB closed during cleanup'))
          .catch(err => console.error('Error closing LevelDB during cleanup:', err));
      } catch (err) {
        console.error('Error in cleanup handler:', err);
      }
    };
    
    // Register cleanup handlers
    process.on('exit', () => {
      console.log('Process exiting, running synchronous cleanup');
      // Note: Only synchronous code works in 'exit' handlers
    });
    
    process.on('SIGINT', async () => {
      console.log('Received SIGINT signal');
      await cleanup();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM signal');
      await cleanup();
      process.exit(0);
    });
    
    return app;
  } catch (err) {
    console.error('FATAL ERROR in bootstrap function:', err);
    process.exit(1);
    // TypeScript needs a return here even though process.exit never returns
    return null;
  }
};