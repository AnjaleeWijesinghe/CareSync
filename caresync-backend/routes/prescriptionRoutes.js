const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  getPrescriptionsByPatient,
  getPrescriptionsByDoctor,
  updatePrescription,
  deletePrescription
} = require('../controllers/prescriptionController');

const router = express.Router();

router.post('/', protect, createPrescription);
router.get('/', protect, getPrescriptions);
router.get('/:id', protect, getPrescriptionById);
router.get('/patient/:patientId', protect, getPrescriptionsByPatient);
router.get('/doctor/:doctorId', protect, getPrescriptionsByDoctor);
router.put('/:id', protect, updatePrescription);
router.delete('/:id', protect, deletePrescription);

module.exports = router;
