/**
 * Express Server Entry Point
 * Responsibility: Configures Express application, registers middleware, mounts routes, and starts server.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const devpathRoutes = require('./routes/devpath.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'DevPath API' });
});

// Mount DevPath routes
app.use('/api/devpath', devpathRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.',
  });
});

// Start server only when run directly (enables testing/importing if needed)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DevPath backend server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
