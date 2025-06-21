import { FactoryProvider } from '@angular/core';
import { MongoConnectionFactory, MONGO_CONNECTION_FACTORY } from '../../data/db/mongo.factory';
import { APP_CONFIG, AppConfig } from '../config/app-config.token';
import mongoose from 'mongoose';

/**
 * Provider for MongoDB connection factory based on configuration
 * When PERSISTENT_STORAGE is 'MONGODB', uses the MONGO_URI from config
 * When PERSISTENT_STORAGE is 'FILE', connection factory returns false
 */
export const mongoConnectionFactoryProvider: FactoryProvider = {
  provide: MONGO_CONNECTION_FACTORY,
  useFactory: (config: AppConfig): MongoConnectionFactory => {
    return async (): Promise<boolean> => {
      // Check if MongoDB is configured
      if (config.PERSISTENT_STORAGE !== 'MONGODB' || !config.MONGO_URI) {
        console.log('MongoDB connection not required based on configuration');
        return false;
      }

      try {
        // Attempt to connect to MongoDB
        console.log('Attempting to connect to MongoDB:', config.MONGO_URI);
        
        if (mongoose.connection.readyState === 1) {
          console.log('MongoDB already connected');
          return true;
        }
        
        await mongoose.connect(config.MONGO_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        
        console.log('Successfully connected to MongoDB');
        return true;
      } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        return false;
      }
    };
  },
  deps: [APP_CONFIG]
};
