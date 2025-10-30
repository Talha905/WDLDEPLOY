const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { connectDB } = require('./config/db');
const { loadEnv } = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

loadEnv();
connectDB();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static files (for attachments)
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, 'public', 'uploads');
app.use('/uploads', express.static(path.resolve(uploadDir)));

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => res.json({ ok: true, service: 'mentorhub-backend' }));

// 404 and error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
