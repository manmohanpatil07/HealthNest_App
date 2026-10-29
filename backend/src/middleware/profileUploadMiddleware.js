const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure profiles directory exists
const profilesDir = path.join(__dirname, '../../uploads/profiles');
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}

// Storage engine for profile pictures
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profilesDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const userId = req.user?.id || req.user?.userId || 'anon';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `profile-u${userId}-${uniqueSuffix}${ext}`);
  }
});

// File filter: JPG, JPEG, PNG, WEBP (Images only)
const imageFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp'
  ];

  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only JPG, PNG, and WebP images are allowed.');
    error.statusCode = 400;
    cb(error);
  }
};

// Max 5MB limit for profile avatars
const uploadProfileImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: imageFilter
});

module.exports = uploadProfileImage;

