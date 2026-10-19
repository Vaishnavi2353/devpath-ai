/**
 * Database Configuration & Connection Manager
 * 
 * Establishes and manages the Mongoose connection to MongoDB.
 * Supports local MongoDB and MongoDB Atlas seamlessly.
 */

const mongoose = require('mongoose');

let isConnected = false;

async function connectDB(uri) {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/devpath';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    return conn.connection;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.error(`[MongoDB] Please ensure MongoDB is running locally or verify MONGODB_URI in server/.env`);
    throw error;
  }
}

async function disconnectDB() {
  if (isConnected || mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
}

module.exports = {
  connectDB,
  disconnectDB,
};

// Allow direct execution to test DB connectivity (e.g. node src/config/db.js)
if (require.main === module) {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
  console.log('[MongoDB] Testing database connection...');
  connectDB()
    .then((conn) => {
      console.log(`[MongoDB] Connection test successful! Host: ${conn.host}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(`[MongoDB] Connection test failed: ${err.message}`);
      process.exit(1);
    });
}
