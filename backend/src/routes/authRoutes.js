const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const providerController = require('../controllers/providerController');
const authenticateToken = require('../middleware/authMiddleware');

// Public routes – User
router.post('/register', authController.register);
router.post('/login', authController.login);

// Public routes – Healthcare Provider
router.post('/provider-register', providerController.register);
router.post('/provider-login', providerController.login);

// Protected routes – User
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
