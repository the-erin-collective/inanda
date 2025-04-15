import mongoose from 'mongoose';

export class MongooseService {
  async connect(): Promise<void> {
    const connectionString = process.env['MONGO_URI'];
    console.log('Attempting to connect to MongoDB:', connectionString);

    try {
      await mongoose.connect(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Successfully connected to MongoDB');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw error; // Ensure the error propagates
    }
  }
}