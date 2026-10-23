require('dotenv').config();
const app = require('./src/app');
const { testConnection } = require('./src/config/database');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Test database connection (informational in development)
  await testConnection();

  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` HealthNest Backend Server running on port ${PORT}`);
    console.log(` Health Check: http://localhost:${PORT}/api/health`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`===============================================`);
  });
};

startServer();
