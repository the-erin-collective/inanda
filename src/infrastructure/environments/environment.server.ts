export interface ServerEnvironment {
  PERSISTENT_STORAGE: 'FILE' | 'MONGODB';
  USE_LEVEL_DB: boolean;
  MONGO_URI?: string;
}

export const environment: ServerEnvironment = {
  PERSISTENT_STORAGE: process.env["PERSISTENT_STORAGE"] as 'FILE' | 'MONGODB' || 'FILE',
  USE_LEVEL_DB: process.env["USE_LEVEL_DB"] === 'true',
  MONGO_URI: process.env["MONGO_URI"],
};