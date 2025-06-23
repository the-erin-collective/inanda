import { InjectionToken } from '@angular/core';

// Type definition for MongoDB connection factory
export type FileConnectionFactory = () => Promise<boolean>;
 
// Injection token for MongoDB connection factory
export const FILE_CONNECTION_FACTORY = new InjectionToken<FileConnectionFactory>('FILE_DATA_PATH'); 