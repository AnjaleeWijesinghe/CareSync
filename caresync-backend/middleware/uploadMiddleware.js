const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME
  && process.env.CLOUDINARY_API_KEY
  && process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

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

const uploadToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    if (!hasCloudinaryConfig) {
      resolve({ secure_url: null, public_id: null });
      return;
    }

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

const cloudinaryUpload = async (req, res, next) => {
  if (!req.file) return next();

  try {
    if (!hasCloudinaryConfig) {
      req.file.path = null;
      req.file.cloudinaryPublicId = null;
      return next();
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      resource_type: req.file.mimetype === 'application/pdf' ? 'raw' : 'image',
    });

    req.file.path = result.secure_url;
    req.file.cloudinaryPublicId = result.public_id;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = upload;
module.exports.upload = upload;
module.exports.cloudinaryUpload = cloudinaryUpload;
module.exports.uploadToCloudinary = uploadToCloudinary;
