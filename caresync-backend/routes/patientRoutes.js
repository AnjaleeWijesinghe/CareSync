const express = require('express');
const { protect, authorise } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { cloudinaryUpload } = require('../middleware/uploadMiddleware');
const {
  createPatient, getAllPatients, getPatient, updatePatient, deletePatient, searchPatients, getMyProfile,
} = require('../controllers/patientController');

const router = express.Router();

router.get('/search', protect, authorise('admin'), searchPatients);
router.get('/me', protect, authorise('patient'), getMyProfile);
router.post('/', protect, authorise('patient', 'admin'), upload.single('photo'), cloudinaryUpload, createPatient);
router.get('/', protect, authorise('admin'), getAllPatients);
router.get('/:id', protect, authorise('patient', 'admin'), getPatient);
router.put('/:id', protect, authorise('patient', 'admin'), upload.single('photo'), cloudinaryUpload, updatePatient);
router.delete('/:id', protect, authorise('admin'), deletePatient);

module.exports = router;
