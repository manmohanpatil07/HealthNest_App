const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');
const authenticateToken = require('../middleware/authMiddleware');

// Authenticated hospital routes - available to authenticated users/providers

// GET /api/hospitals/locations - cascading administrative location selectors
router.get('/locations', authenticateToken, hospitalController.getLocations);

// GET /api/hospitals - list and search hospitals
router.get('/', authenticateToken, hospitalController.getHospitals);

// GET /api/hospitals/:id - single hospital details
router.get('/:id', authenticateToken, hospitalController.getHospitalById);

module.exports = router;
