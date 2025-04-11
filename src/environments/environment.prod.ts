import packageInfo from 'package.json';

export const environment = {
  production: true,
  version: packageInfo.version,
  mongoEnvKey: 'MONGO_URI'
};
