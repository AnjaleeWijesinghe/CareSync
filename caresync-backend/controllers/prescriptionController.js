const Prescription = require('../models/Prescription');
const Doctor = require('../models/Doctor');
const { validationResult } = require('express-validator');

// @desc    Create a new prescription
// @route   POST /api/prescriptions
// @access  Private (Doctor)
const createPrescription = async (req, res) => {
  console.log('=== CREATE PRESCRIPTION REQUEST ===');
  console.log('User:', JSON.stringify(req.user));
  console.log('Body:', JSON.stringify(req.body));

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', JSON.stringify(errors.array()));
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    // Find the doctor record for the logged-in user
    const doctorRecord = await Doctor.findOne({ userId: req.user.id });
    console.log('Doctor record found:', doctorRecord ? doctorRecord._id : 'NONE (using user id as fallback)');
    
    // Use doctorRecord._id if found, otherwise fallback to the logged-in user's id
    const finalDoctorId = doctorRecord ? doctorRecord._id : req.user.id;

    // Filter out empty medications
    const filteredMedications = (req.body.medications || []).filter(med => med.medicineName && med.medicineName.trim() !== '');

    const prescription = new Prescription({
      patientId: req.body.patientId,
      doctorId: String(finalDoctorId),
      patientName: req.body.patientName,
      doctorName: req.body.doctorName,
      medications: filteredMedications,
      diagnosis: req.body.diagnosis,
      notes: req.body.notes || '',
      status: req.body.status || 'active'
    });

    const savedPrescription = await prescription.save();
    console.log('Prescription saved successfully:', savedPrescription._id);
    res.status(201).json({ success: true, data: savedPrescription });
  } catch (err) {
    console.error('Error saving prescription:', err.message);
    console.error('Full error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get all prescriptions
// @route   GET /api/prescriptions
// @access  Private (Admin/Doctor)
const getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find().sort({ createdAt: -1 });
    res.json({ success: true, count: prescriptions.length, data: prescriptions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get prescriptions for a specific patient
// @route   GET /api/prescriptions/patient/:patientId
// @access  Private
const getPrescriptionsByPatient = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.json({ success: true, count: prescriptions.length, data: prescriptions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get prescriptions created by a specific doctor
// @route   GET /api/prescriptions/doctor/:doctorId
// @access  Private
const getPrescriptionsByDoctor = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctorId: req.params.doctorId }).sort({ createdAt: -1 });
    res.json({ success: true, count: prescriptions.length, data: prescriptions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get one prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private
const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ success: false, error: 'Prescription not found' });
    }
    res.json({ success: true, data: prescription });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
// @access  Private (Doctor)
const updatePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!prescription) {
      return res.status(404).json({ success: false, error: 'Prescription not found' });
    }

    res.json({ success: true, data: prescription });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Delete prescription
// @route   DELETE /api/prescriptions/:id
// @access  Private (Admin/Doctor)
const deletePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndDelete(req.params.id);
    if (!prescription) {
      return res.status(404).json({ success: false, error: 'Prescription not found' });
    }
    res.json({ success: true, message: 'Prescription deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  createPrescription,
  getPrescriptions,
  getPrescriptionsByPatient,
  getPrescriptionsByDoctor,
  getPrescriptionById,
  updatePrescription,
  deletePrescription
};
