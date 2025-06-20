// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

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
  production: false,
  version: packageInfo.version,
  mongoEnvKey: 'MONGO_URI',
  useLevelDB: getEnvVar('USE_LEVEL_DB') !== 'false' // default to true unless explicitly set to 'false'
};
