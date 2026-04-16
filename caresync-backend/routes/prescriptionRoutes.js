const express = require('express');
const { protect, authorise } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const {
  createPrescription, getAllPrescriptions, getMyPrescriptions, getPrescription,
  updatePrescription, incrementRefill, deletePrescription,
} = require('../controllers/prescriptionController');

const router = express.Router();

router.post(
  '/',
  protect,
  authorise('doctor', 'admin'),
  [
    body('patientId').notEmpty().withMessage('patientId is required'),
    body('medicines').isArray({ min: 1 }).withMessage('At least one medicine is required'),
    body('medicines.*.name').notEmpty().withMessage('Medicine name is required'),
  ],
  createPrescription
);

router.get('/', protect, authorise('admin'), getAllPrescriptions);
router.get('/my', protect, authorise('patient'), getMyPrescriptions);
router.get('/:id', protect, getPrescription);
router.put('/:id', protect, authorise('doctor', 'admin'), updatePrescription);
router.patch('/:id/refill', protect, authorise('doctor', 'admin'), incrementRefill);
router.delete('/:id', protect, authorise('admin', 'doctor'), deletePrescription);

module.exports = router;
