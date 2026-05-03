const express = require('express');
const { protect, authorise } = require('../middleware/authMiddleware');
const {
  createPrescription, getAllPrescriptions, getMyPrescriptions,
  getPrescription, updatePrescription, refillPrescription, deletePrescription,
} = require('../controllers/prescriptionController');

const router = express.Router();

router.post('/', protect, authorise('doctor', 'admin'), createPrescription);
router.get('/', protect, authorise('admin'), getAllPrescriptions);
router.get('/my', protect, authorise('patient'), getMyPrescriptions);
router.get('/:id', protect, getPrescription);
router.put('/:id', protect, authorise('doctor', 'admin'), updatePrescription);
router.patch('/:id/refill', protect, authorise('doctor', 'admin'), refillPrescription);
router.delete('/:id', protect, authorise('admin', 'doctor'), deletePrescription);

module.exports = router;
