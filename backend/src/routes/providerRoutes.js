const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');
const authenticateToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// Protect all routes: must be authenticated as 'healthcare_provider'
const providerAuth = [authenticateToken, requireRole('healthcare_provider')];

// GET /api/provider/profile – get authenticated provider's profile
router.get('/profile', providerAuth, providerController.getProfile);

// POST /api/provider/scan-qr – validate a patient QR access token
router.post('/scan-qr', providerAuth, providerController.scanQR);

module.exports = router;
