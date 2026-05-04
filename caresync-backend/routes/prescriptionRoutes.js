const express = require('express');
const { protect, authorise } = require('../middleware/authMiddleware');
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

// Specific routes MUST come before parameterised /:id route
router.get('/patient/:patientId', protect, getPrescriptionsByPatient);
router.get('/doctor/:doctorId', protect, getPrescriptionsByDoctor);

router.post('/', protect, authorise('doctor', 'admin'), createPrescription);
router.get('/', protect, getPrescriptions);
router.get('/:id', protect, getPrescriptionById);
router.put('/:id', protect, authorise('doctor', 'admin'), updatePrescription);
router.delete('/:id', protect, authorise('doctor', 'admin'), deletePrescription);

module.exports = router;
