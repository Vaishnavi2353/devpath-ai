const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const devpathRoutes = require('./routes/devpath.routes');
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');

const app = express();

// Allowed origins for CORS (supports local development and deployed frontend)
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (such as mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        return callback(null, origin); // Echo origin for credentialed requests
      }
      return callback(new Error('CORS policy: Not allowed by origin'));
    },
    credentials: true, // Allow cookies and authorization headers
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json());
app.use(cookieParser());

// Health check route (preserves existing verified contract)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'DevPath API',
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// DevPath roadmap generation routes
app.use('/api/devpath', devpathRoutes);

// Projects management routes
app.use('/api/projects', projectRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
  });
});

module.exports = app;
