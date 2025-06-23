const fs = require('fs');
const path = require('path');

// Usage: node tools/copy-static.js [development|production]
const env = process.argv[2] === 'production' ? 'production' : 'development';
const rootDir = process.cwd();

// Determine dist output directory based on angular.json configurations
const outputDir = path.join(
  rootDir,
  'dist',
  env === 'production' ? 'prod' : 'dev',
  'browser'
);

// Prepare assets directory
const assetsDir = path.join(outputDir, 'presentation', 'assets');

// Copy environment-specific config.json
const configFile = path.join(rootDir, env === 'production' ? 'config.prod.json' : 'config.dev.json');
const configDest = path.join(assetsDir, 'config.json');

if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

if (fs.existsSync(configFile)) {
  fs.copyFileSync(configFile, configDest);
  console.log(`Copied ${configFile} to ${configDest}`);
} else {
  console.warn(`Config file not found: ${configFile}`);
}

console.log('Static assets copy complete.');
