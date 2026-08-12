const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const env = require('../config/env');
const AppError = require('../utils/AppError');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.zip`;
    cb(null, uniqueName);
  },
});

// Only accept ZIP files, validated both by mimetype and extension.
function fileFilter(req, file, cb) {
  const allowedMimeTypes = [
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream',
  ];
  const ext = path.extname(file.originalname).toLowerCase();

  if (ext !== '.zip' || !allowedMimeTypes.includes(file.mimetype)) {
    return cb(new AppError('Only .zip files are allowed', 400));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
  },
});

module.exports = { upload, UPLOAD_DIR };
