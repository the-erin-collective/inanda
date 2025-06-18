import packageInfo from 'package.json';

// Helper function to safely check process.env
const getEnvVar = (key: string): string | undefined => {
  try {
    return typeof process !== 'undefined' ? process.env[key] : undefined;
  } catch {
    return undefined;
  }
};

export const environment = {
  production: true,
  version: packageInfo.version,
  mongoEnvKey: 'MONGO_URI',
  useLevelDB: getEnvVar('USE_LEVEL_DB') !== 'false' // default to true unless explicitly set to 'false'
};
