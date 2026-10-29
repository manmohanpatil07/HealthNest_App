const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const uploadProfileImage = require('../middleware/profileUploadMiddleware');

// All user routes require valid JWT and user role
router.use(authenticateToken);
router.use(requireRole('user'));

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// Profile photo upload and deletion
router.post('/profile/photo', uploadProfileImage.single('photo'), userController.uploadProfilePhoto);
router.delete('/profile/photo', userController.removeProfilePhoto);

router.get('/dashboard', userController.getDashboard);

module.exports = router;
