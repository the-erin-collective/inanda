// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

import packageInfo from 'package.json';

export const environment = {
  production: false,
  version: packageInfo.version,
  mongoEnvKey: 'MONGO_URI',
  SHOW_GITHUB_BANNER: true,
  GITHUB_BANNER_URL: 'https://github.com/the-erin-collective/web-home',
  dataPath: 'data/repository/sites',
  USE_LEVEL_DB: false,
  PERSISTENT_STORAGE: 'FILE',
  MONGO_URI: 'mongodb://localhost:27017/webhomedb',
};
