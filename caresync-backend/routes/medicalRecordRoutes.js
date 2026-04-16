const express = require('express');
const { protect, authorise } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { body } = require('express-validator');
const {
  createRecord, getAllRecords, getPatientRecords, getRecord, updateRecord, deleteRecord,
} = require('../controllers/medicalRecordController');

const router = express.Router();

router.post(
  '/',
  protect,
  authorise('doctor', 'admin'),
  upload.single('document'),
  [
    body('patientId').notEmpty().withMessage('patientId is required'),
    body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
  ],
  createRecord
);

router.get('/', protect, authorise('admin'), getAllRecords);
router.get('/patient/:patientId', protect, getPatientRecords);
router.get('/:id', protect, getRecord);
router.put('/:id', protect, authorise('doctor', 'admin'), upload.single('document'), updateRecord);
router.delete('/:id', protect, authorise('admin'), deleteRecord);

module.exports = router;
