const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');
const authenticateToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// Protect all routes: must be authenticated as 'healthcare_provider'
const providerAuth = [authenticateToken, requireRole('healthcare_provider')];

// GET /api/provider/profile – get authenticated provider's profile
router.get('/profile', providerAuth, providerController.getProfile);

// PUT /api/provider/profile – update authenticated provider's profile
router.put('/profile', providerAuth, providerController.updateProfile);

// POST /api/provider/scan-qr – validate a patient QR access token
router.post('/scan-qr', providerAuth, providerController.scanQR);

// GET /api/provider/history – get patient history accessed by authenticated provider
router.get('/history', providerAuth, providerController.getHistory);

// GET /api/provider/history/:accessId – get authorized patient data by historical accessId
router.get('/history/:accessId', providerAuth, providerController.getHistoryPatientDetails);

// GET /api/provider/patient/:token – get authorized patient data by QR token
router.get('/patient/:token', providerAuth, providerController.getAuthorizedPatient);

module.exports = router;
