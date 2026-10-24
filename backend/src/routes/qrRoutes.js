const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const authenticateToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// All QR endpoints require authenticated user
router.use(authenticateToken);
router.use(requireRole('user'));

router.get('/', qrController.getQRCode);
router.post('/regenerate', qrController.regenerateQR);
router.put('/permissions', qrController.updatePermissions);

module.exports = router;
