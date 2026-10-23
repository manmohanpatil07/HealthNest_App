const express = require('express');
const router = express.Router();
const healthRecordController = require('../controllers/healthRecordController');
const authenticateToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// All health-record routes require valid JWT + user role
router.use(authenticateToken);
router.use(requireRole('user'));

router.get('/', healthRecordController.getRecords);
router.post('/', healthRecordController.createRecord);
router.delete('/:id', healthRecordController.deleteRecord);

module.exports = router;
