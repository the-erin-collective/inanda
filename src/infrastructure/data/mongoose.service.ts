import mongoose from 'mongoose';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MongooseService {
  private dbUri = process.env['MONGO_URI'];

  connect() {
    console.log(this.dbUri);

    if (!this.dbUri) {
        throw new Error('MONGO_URI environment variable is not defined');
      }

    return mongoose.connect(this.dbUri, {
        autoCreate: true,
    });
  }
}