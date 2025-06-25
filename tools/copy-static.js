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

// Rename index.csr.html to index.html if it exists
const indexCsr = path.join(outputDir, 'index.csr.html');
const indexHtml = path.join(outputDir, 'index.html');
if (fs.existsSync(indexCsr)) {
  fs.renameSync(indexCsr, indexHtml);
  console.log(`Renamed ${indexCsr} to ${indexHtml}`);
} else {
  console.warn(`index.csr.html not found in ${outputDir}`);
}

const source404 = path.join(outputDir, 'presentation', '404.html');
const dest404 = path.join(outputDir, '404.html');

if (fs.existsSync(source404)) {
  fs.copyFileSync(source404, dest404);
  console.log(`Copied 404.html to the root of build output: ${dest404}`);
} else {
  console.warn(`404.html not found at ${source404}`);
}

console.log('Static assets copy complete.');