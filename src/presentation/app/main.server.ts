import 'core-js/features/async-iterator';
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { config } from '../app/bootstrap/app.config.server';
import { provideRouter } from '@angular/router';
import { routes } from '../app/bootstrap/app.routes';
import { provideHttpClient } from '@angular/common/http';
import { repositoryProviders } from '../../infrastructure/providers/repository.providers';
import mongoose from 'mongoose';

console.log('Starting server...');

// Connect to MongoDB
const MONGO_URI = process.env['MONGO_URI'];

const connectToDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1); // Exit if the connection fails
  }
};

const bootstrapFn = async () => {
  // Wait for the database connection to complete before bootstrapping the app
  await connectToDatabase();

  return bootstrapApplication(AppComponent, {
    ...config,
    providers: [
      ...config.providers,
      repositoryProviders,
      provideClientHydration(),
      provideRouter(routes),
      provideHttpClient(),
    ],
  });
};

export default bootstrapFn;