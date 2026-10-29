const express = require('express');
const router = express.Router();
const healthRecordController = require('../controllers/healthRecordController');
const authenticateToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const uploadRecordAttachment = require('../middleware/attachmentUploadMiddleware');

// All health record routes require valid JWT and user role
router.use(authenticateToken);
router.use(requireRole('user'));

// GET /api/health-records - list all records for current user
router.get('/', healthRecordController.getRecords);

// GET /api/health-records/:id - get single record details with attachments
router.get('/:id', healthRecordController.getRecordById);

// POST /api/health-records - create a record with optional photo attachment
router.post('/', uploadRecordAttachment.single('attachment'), healthRecordController.createRecord);

// DELETE /api/health-records/:id - delete a record (ownership enforced)
router.delete('/:id', healthRecordController.deleteRecord);

module.exports = router;
