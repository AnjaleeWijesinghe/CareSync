const Prescription = require('../models/Prescription');
const { validationResult, body } = require('express-validator');
const { isValidObjectId } = require('../utils/validators');

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
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { patientName, doctorName, patientId, doctorId, diagnosis, medications, notes, status } = req.body;
      const prescription = await Prescription.create({
        patientName: String(patientName).trim(),
        doctorName: String(doctorName).trim(),
        patientId: String(patientId),
        doctorId: String(doctorId),
        diagnosis: String(diagnosis).trim(),
        medications,
        notes: notes ? String(notes).trim() : undefined,
        status: status || undefined,
      });
      res.status(201).json({ success: true, data: prescription, message: 'Prescription created successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message, statusCode: 500 });
    }
  }
];

// GET /api/prescriptions
const getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find().sort({ createdAt: -1 });
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, statusCode: 500 });
  }
};

// GET /api/prescriptions/:id
const getPrescriptionById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid prescription ID', statusCode: 400 });
    }
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ success: false, error: 'Prescription not found', statusCode: 404 });
    res.json({ success: true, data: prescription });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, statusCode: 500 });
  }
};

// GET /api/prescriptions/patient/:patientId
const getPrescriptionsByPatient = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, statusCode: 500 });
  }
};

// GET /api/prescriptions/doctor/:doctorId
const getPrescriptionsByDoctor = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctorId: req.params.doctorId }).sort({ createdAt: -1 });
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, statusCode: 500 });
  }
};

// PUT /api/prescriptions/:id
const updatePrescription = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid prescription ID', statusCode: 400 });
    }

    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ success: false, error: 'Prescription not found', statusCode: 404 });

    // Whitelist allowed fields to prevent mass-assignment
    const { diagnosis, medications, notes, status } = req.body;
    if (diagnosis !== undefined) prescription.diagnosis = String(diagnosis).trim();
    if (medications !== undefined) prescription.medications = medications;
    if (notes !== undefined) prescription.notes = String(notes).trim();
    if (status !== undefined && ['active', 'completed', 'cancelled'].includes(String(status))) {
      prescription.status = String(status);
    }

    await prescription.save();
    res.json({ success: true, data: prescription, message: 'Prescription updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, statusCode: 500 });
  }
};

// DELETE /api/prescriptions/:id
const deletePrescription = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid prescription ID', statusCode: 400 });
    }
    const prescription = await Prescription.findByIdAndDelete(req.params.id);
    if (!prescription) return res.status(404).json({ success: false, error: 'Prescription not found', statusCode: 404 });
    res.json({ success: true, message: 'Prescription deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, statusCode: 500 });
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
