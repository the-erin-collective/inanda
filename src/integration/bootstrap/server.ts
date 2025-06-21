import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import * as fs from 'fs';
import * as path from 'path';
// The manifest will be loaded automatically from angular-app-engine-manifest.mjs
// by the AngularNodeAppEngine during initialization

const browserDistFolder = join(import.meta.dirname, '../browser');

// Load configuration to pass to client
function loadConfig() {
  try {
    const isProd = process.env['NODE_ENV'] === 'production';
    const configPath = isProd 
      ? path.join(process.cwd(), 'config.prod.json')
      : path.join(process.cwd(), 'config.dev.json');
    
    console.log(`Loading config from ${configPath} for client hydration`);
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (err) {
    console.error(`Error loading config for client hydration:`, err);
    return {};
  }
}

const app = express();
// Create Angular Node App Engine - it will use the manifest automatically
const angularApp = new AngularNodeAppEngine();

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  // Load config for client hydration
  const config = loadConfig();
    angularApp
    .handle(req)
    .then((response) => {
      if (response) {
        // Inject the configuration into the rendered HTML
        const html = response.body.toString();
        const configScript = `<script>window.__APP_CONFIG__ = ${JSON.stringify(config)};</script>`;
        const htmlWithConfig = html.replace('</head>', `${configScript}</head>`);
        
        // Write the modified HTML directly to the response
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Length', Buffer.byteLength(htmlWithConfig));
        res.status(response.status || 200).send(htmlWithConfig);
      } else {
        next();
      }
    })
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
