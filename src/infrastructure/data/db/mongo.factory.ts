import { InjectionToken } from '@angular/core';

// Type definition for MongoDB connection factory
export type MongoConnectionFactory = () => Promise<boolean>;
 
// Injection token for MongoDB connection factory
export const MONGO_CONNECTION_FACTORY = new InjectionToken<MongoConnectionFactory>('MONGO_CONNECTION_FACTORY'); 