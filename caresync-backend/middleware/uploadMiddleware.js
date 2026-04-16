const multer = require('multer');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Store files in memory; stream to Cloudinary in the route handler via uploadToCloudinary()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WEBP, PDF allowed.'));
    }
  },
});

/**
 * Upload a file buffer to Cloudinary.
 * Returns a Promise that resolves with the Cloudinary upload result.
 * @param {Buffer} buffer - File buffer from multer memoryStorage
 * @param {object} options - Optional Cloudinary upload options
 */
const uploadToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const defaults = {
      folder: 'caresync',
      transformation: [{ width: 800, crop: 'limit' }],
    };
    const stream = cloudinary.uploader.upload_stream(
      { ...defaults, ...options },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });

/**
 * Express middleware that, after multer has placed the file in req.file,
 * streams the buffer to Cloudinary and attaches result to req.file.
 * Skips gracefully if no file was uploaded.
 */
const cloudinaryUpload = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const result = await uploadToCloudinary(req.file.buffer, {
      resource_type: req.file.mimetype === 'application/pdf' ? 'raw' : 'image',
    });
    // Attach the Cloudinary URL so controllers can use req.file.path (same interface as before)
    req.file.path = result.secure_url;
    req.file.cloudinaryPublicId = result.public_id;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = upload;
module.exports.cloudinaryUpload = cloudinaryUpload;
module.exports.uploadToCloudinary = uploadToCloudinary;
