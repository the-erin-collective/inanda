import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';

// Helper function to load configuration
function loadConfig() {
  try {
    const isProd = process.env['NODE_ENV'] === 'production';
    const configPath = isProd 
      ? path.join(process.cwd(), 'config.prod.json')
      : path.join(process.cwd(), 'config.dev.json');
    
    console.log(`Loading config from ${configPath} for MongoDB check`);
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (err) {
    console.error(`Error loading config for MongoDB check:`, err);
    return {};
  }
}

/**
 * Simple TCP port checker that tests if MongoDB port is open
 * This runs before the actual app bootstrap to detect basic connectivity issues
 */
export async function checkMongoDBConnectivity(): Promise<boolean> {
  // Load config first
  const config = loadConfig();
  
  // Check if we're using MongoDB storage
  if (config.PERSISTENT_STORAGE !== 'MONGODB') {
    console.log(`MongoDB connectivity check skipped - using ${config.PERSISTENT_STORAGE} storage`);
    return false;
  }
  
  // Get MongoDB URI from config
  const MONGO_URI = config.MONGO_URI || process.env['MONGO_URI'];
  
  if (!MONGO_URI) {
    console.log('No MONGO_URI found in config or environment, skipping connectivity check');
    return false;
  }
  
  try {
    // Parse MongoDB URI to get host and port
    const url = new URL(MONGO_URI);
    const host = url.hostname;
    const port = parseInt(url.port, 10) || 27017; // Default MongoDB port is 27017
    
    console.log(`Testing MongoDB connectivity at ${host}:${port}...`);
    
    // Promise-based TCP connection test
    return new Promise<boolean>((resolve) => {
      const socket = new net.Socket();
      let resolved = false;
      
      const finalizeCheck = (success: boolean) => {
        if (!resolved) {
          resolved = true;
          if (success) {
            console.log(`MongoDB connection test: SUCCESSFUL`);
          } else {
            console.log(`MongoDB connection test: FAILED`);
          }
          resolve(success);
        }
      };
      
      socket.setTimeout(3000); // 3 second timeout
      
      socket.on('connect', () => {
        socket.end();
        finalizeCheck(true);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        finalizeCheck(false);
      });
      
      socket.on('error', (err) => {
        // Use warning message instead of error for connection issues
        console.warn(`Connection warning: ${err.message}`);
        finalizeCheck(false);
      });
      
      // Attempt to connect
      socket.connect(port, host);
    });
  } catch (err) {
    console.error('Error parsing MongoDB URI:', err);
    return false;
  }
} 