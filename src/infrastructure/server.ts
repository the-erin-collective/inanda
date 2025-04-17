import dotenv from 'dotenv';
dotenv.config();

import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBootstrap } from './bootstrap/bootstrap';
import { MongooseService } from './data/mongoose.service';
import { repositoryProviders } from './providers/repository/server-repository.providers';

const bootstrap = () => runBootstrap();

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');

const app = express();
const commonEngine = new CommonEngine();

const mongooseService = new MongooseService();
mongooseService
  .connect()
  .then(() => {
    console.log('Connected to MongoDB');

    // Start your server or application logic here
    const port = process.env['PORT'] || 4000;
    app.listen(port, () => {
      console.log(`Node Express server listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1); // Exit if the connection fails
  });

/**
 * Delegate the /site/:id? route to Angular's CommonEngine for SSR.
 */
app.get('/site/:id?', (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers } = req;

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      ...repositoryProviders,
    })
    .then((html) => res.send(html))
    .catch((err) => next(err));
});

/**
 * Serve static files from /browser
 */
app.get(
  '**',
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.get('**', (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers } = req;

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: [
        { provide: APP_BASE_HREF, useValue: baseUrl },
        ...repositoryProviders, // Register repository providers here
      ],
    })
    .then((html) => res.send(html))
    .catch((err) => next(err));
});

export default app;
