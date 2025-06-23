import { FactoryProvider } from '@angular/core';
import { MONGO_CONNECTION_FACTORY } from './mongo.factory';
import mongoose from 'mongoose';
import { environment } from '../../environments/environment.server';

/**
 * Factory provider for MongoDB connection
 * Uses the configuration to determine if MongoDB should be used and how to connect
 */
export const mongoConnectionProvider: FactoryProvider = {
  provide: MONGO_CONNECTION_FACTORY,
  useFactory: () => {
    // Store connection status
    let connectionStatus: boolean = false;

    // Return a factory function that handles connecting to MongoDB
    return async (): Promise<boolean> => {
      // If we've already tried to connect, return the stored status
      if (connectionStatus) {
        return connectionStatus;
      }

      // If MongoDB is not the configured storage type, return false
      if (environment.PERSISTENT_STORAGE !== 'MONGODB') {
        console.log('MongoDB connection not needed based on configuration - using FILE storage');
        connectionStatus = false;
        return false;
      }

      // Ensure we have a MongoDB URI
      if (!environment.MONGO_URI) {
        console.error('MongoDB URI not provided in configuration');
        connectionStatus = false;
        return false;
      }

      try {
        console.log('Attempting to connect to MongoDB:', environment.MONGO_URI);
        
        // Attempt to connect to MongoDB
        await mongoose.connect(environment.MONGO_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        
        console.log('Successfully connected to MongoDB');
        connectionStatus = true;
        return true;
      } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        connectionStatus = false;
        return false;
      }
    };
  },
  deps: []
};
