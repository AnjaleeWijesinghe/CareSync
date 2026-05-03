const express = require('express');
const { protect, authorise } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  createRecord, getAllRecords, getMyRecords, getPatientRecords,
  getRecord, updateRecord, addAddendum, searchRecords, archiveRecord, deleteRecord,
} = require('../controllers/medicalRecordController');

const router = express.Router();

router.get('/search', protect, authorise('doctor', 'admin'), searchRecords);
router.get('/me', protect, authorise('patient'), getMyRecords);
router.post('/', protect, authorise('doctor', 'admin'), upload.array('documents', 5), createRecord);
router.get('/', protect, authorise('admin'), getAllRecords);
router.get('/patient/:patientId', protect, authorise('patient', 'doctor', 'admin'), getPatientRecords);
router.get('/:id', protect, getRecord);
router.put('/:id', protect, authorise('doctor', 'admin'), upload.array('documents', 5), updateRecord);
router.patch('/:id/addendum', protect, authorise('doctor', 'admin'), addAddendum);
router.patch('/:id/archive', protect, authorise('doctor', 'admin'), archiveRecord);
router.delete('/:id', protect, authorise('admin'), deleteRecord);

module.exports = router;
