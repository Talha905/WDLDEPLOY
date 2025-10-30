const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mentorhub';
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri, {
      autoIndex: true
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error', err);
    process.exit(1);
  }
}

module.exports = { connectDB };
