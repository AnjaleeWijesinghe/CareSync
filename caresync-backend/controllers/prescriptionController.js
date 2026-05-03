const Prescription = require('../models/Prescription');
const { validationResult, body } = require('express-validator');

// POST /api/prescriptions
const createPrescription = [
  body('patientName').notEmpty().withMessage('Patient Name is required'),
  body('doctorName').notEmpty().withMessage('Doctor Name is required'),
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
  body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
  body('medications').isArray({ min: 1 }).withMessage('At least one medication is required'),
  body('medications.*.medicineName').notEmpty().withMessage('Medicine Name is required'),
  
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { patientName, doctorName, patientId, doctorId, diagnosis, medications, notes, status } = req.body;
      const prescription = await Prescription.create({
        patientName, doctorName, patientId, doctorId, diagnosis, medications, notes, status
      });
      res.status(201).json(prescription);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
];

// GET /api/prescriptions
const getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find();
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/prescriptions/:id
const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ error: 'Prescription not found' });
    res.json(prescription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/prescriptions/patient/:patientId
const getPrescriptionsByPatient = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.params.patientId });
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/prescriptions/doctor/:doctorId
const getPrescriptionsByDoctor = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctorId: req.params.doctorId });
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/prescriptions/:id
const updatePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!prescription) return res.status(404).json({ error: 'Prescription not found' });
    res.json(prescription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/prescriptions/:id
const deletePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndDelete(req.params.id);
    if (!prescription) return res.status(404).json({ error: 'Prescription not found' });
    res.json({ message: 'Prescription removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  getPrescriptionsByPatient,
  getPrescriptionsByDoctor,
  updatePrescription,
  deletePrescription
};
