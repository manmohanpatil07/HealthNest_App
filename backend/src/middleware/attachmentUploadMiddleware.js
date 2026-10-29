const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure attachments directory exists
const attachmentsDir = path.join(__dirname, '../../uploads/attachments');
if (!fs.existsSync(attachmentsDir)) {
  fs.mkdirSync(attachmentsDir, { recursive: true });
}

// Storage configuration with unique timestamped filenames
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, attachmentsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const userId = req.user?.id || req.user?.userId || 'anon';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `rec-u${userId}-${uniqueSuffix}${ext}`);
  }
});

// File filter: JPG, JPEG, PNG, WEBP, PDF (Max 10MB)
const attachmentFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
    'application/pdf'
  ];

  if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only JPG, PNG, WebP, and PDF attachments are allowed.');
    error.statusCode = 400;
    cb(error);
  }
};

const uploadRecordAttachment = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: attachmentFilter
});

module.exports = uploadRecordAttachment;

