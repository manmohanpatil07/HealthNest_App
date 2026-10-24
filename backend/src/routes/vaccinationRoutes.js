const express = require('express');
const router = express.Router();
const vaccinationController = require('../controllers/vaccinationController');
const authenticateToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// All vaccination routes require authenticated user
router.use(authenticateToken);
router.use(requireRole('user'));

router.get('/', vaccinationController.getVaccinations);
router.post('/', vaccinationController.createVaccination);
router.delete('/:id', vaccinationController.deleteVaccination);

module.exports = router;
