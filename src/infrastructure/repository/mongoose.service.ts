import mongoose from 'mongoose';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MongooseService {
  private dbUri = process.env['MONGO_URI'] || 'mongodb://localhost:27017/webhomedb';

  connect() {
    return mongoose.connect(this.dbUri, {
        autoCreate: true,
    });
  }
}