const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  getPrescriptionsByPatient,
  getPrescriptionsByDoctor,
  updatePrescription,
  deletePrescription
} = require('../controllers/prescriptionController');
const { protect, authorise } = require('../middleware/authMiddleware');

// Validation middleware
const prescriptionValidation = [
  check('patientId', 'Patient ID is required').not().isEmpty(),
  check('patientName', 'Patient name is required').not().isEmpty(),
  check('doctorName', 'Doctor name is required').not().isEmpty(),
  check('diagnosis', 'Diagnosis is required').not().isEmpty(),
  check('medications', 'Medications must be an array').isArray(),
  check('medications.*.medicineName', 'Medicine name is required').optional(),
  check('medications.*.dosage', 'Dosage is required').optional(),
  check('medications.*.frequency', 'Frequency is required').optional(),
  check('medications.*.duration', 'Duration is required').optional(),
];

router.use(protect);

router.route('/')
  .post(authorise('doctor'), prescriptionValidation, createPrescription)
  .get(authorise('admin', 'doctor'), getPrescriptions);

router.get('/patient/:patientId', getPrescriptionsByPatient);
router.get('/doctor/:doctorId', getPrescriptionsByDoctor);

router.route('/:id')
  .get(getPrescriptionById)
  .put(authorise('doctor'), updatePrescription)
  .delete(authorise('admin', 'doctor'), deletePrescription);

module.exports = router;
