import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/playlist-manager';

let connecting = null;

// Cached, idempotent connect. Safe to call on every request: in a long-lived
// server it is a no-op after the first call; on serverless it reuses the
// connection across warm invocations of the same instance.
export async function connectDb() {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!connecting) {
    connecting = mongoose
      .connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000, maxPoolSize: 5 })
      .catch((err) => {
        connecting = null; // allow retry on next request
        throw err;
      });
  }
  await connecting;
  return mongoose;
}

export { MONGODB_URI };
