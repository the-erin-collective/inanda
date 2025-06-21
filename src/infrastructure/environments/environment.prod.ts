import packageInfo from 'package.json';

export const environment = {
  production: true,
  version: packageInfo.version,
  mongoUri: 'mongodb://localhost:27017/webhomedb',
  SHOW_GITHUB_BANNER: true,
  GITHUB_BANNER_URL: 'https://github.com/the-erin-collective/web-home',
  dataPath: '/assets/data/repository/sites',
  USE_LEVEL_DB: false,
  PERSISTENT_STORAGE: 'FILE',
};
