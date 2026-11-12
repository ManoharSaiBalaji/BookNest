import mongoose from 'mongoose';

/**
 * Connect to MongoDB Atlas using the MONGODB_URI environment variable.
 */
export async function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables.');
  }

  const conn = await mongoose.connect(uri);
  return conn;
}
