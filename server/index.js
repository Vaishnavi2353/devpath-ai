const app = require('./src/app');
const { connectDB } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
  } catch (error) {
    console.warn('[Server] Warning: Starting server without active MongoDB connection.');
  }

  app.listen(PORT, () => {
    console.log(`DevPath API running at http://localhost:${PORT}`);
  });
}

startServer();
