const express = require('express');
const { protect, authorise } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { cloudinaryUpload } = require('../middleware/uploadMiddleware');
const { body } = require('express-validator');
const {
  createRecord, getAllRecords, getMyRecords, getPatientRecords, getRecord, updateRecord, deleteRecord,
} = require('../controllers/medicalRecordController');

const router = express.Router();

router.post(
  '/',
  protect,
  authorise('doctor', 'admin'),
  upload.single('document'),
  cloudinaryUpload,
  [
    body('patientId').notEmpty().withMessage('patientId is required'),
    body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
  ],
  createRecord
);

router.get('/', protect, authorise('admin'), getAllRecords);
router.get('/me', protect, authorise('patient'), getMyRecords);
router.get('/patient/:patientId', protect, authorise('doctor', 'admin'), getPatientRecords);
router.get('/:id', protect, getRecord);
router.put('/:id', protect, authorise('doctor', 'admin'), upload.single('document'), cloudinaryUpload, updateRecord);
router.delete('/:id', protect, authorise('admin'), deleteRecord);

module.exports = router;
