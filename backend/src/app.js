const express = require('express');
const cors = require('cors');

const app = express();

// Standard middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route (Required by ARCHITECTURE.md & Setup requirements)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HealthNest Backend API is operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

const path = require('path');

// Static file serving for uploads (cloud/file storage)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
const { authRoutes, userRoutes, healthRecordRoutes, documentRoutes, vaccinationRoutes } = require('./routes');
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/health-records', healthRecordRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/vaccinations', vaccinationRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to HealthNest API',
    healthCheck: '/api/health'
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack || err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;
