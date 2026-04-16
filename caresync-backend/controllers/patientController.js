const { validationResult } = require('express-validator');
const Patient = require('../models/Patient');

// GET /api/patients/me  – own patient profile for logged-in patient
const getMyProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id }).populate('userId', 'name email');
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient profile not found', statusCode: 404 });
    }
    res.json({ success: true, data: patient });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// POST /api/patients
const createPatient = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const existing = await Patient.findOne({ userId: req.user.id });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Patient profile already exists', statusCode: 400 });
    }

    const data = { ...req.body, userId: req.user.id };
    if (req.file) data.photoUrl = req.file.path;

    const patient = await Patient.create(data);
    res.status(201).json({ success: true, data: patient, message: 'Patient profile created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// GET /api/patients
const getAllPatients = async (req, res) => {
  try {
    const { name, bloodGroup, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    let query = Patient.find(filter).populate('userId', 'name email');
    if (name) {
      query = Patient.find(filter)
        .populate({ path: 'userId', match: { name: { $regex: name, $options: 'i' } }, select: 'name email' });
    }

    const patients = await query
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const filtered = name ? patients.filter(p => p.userId) : patients;
    res.json({ success: true, data: filtered });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// GET /api/patients/:id
const getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('userId', 'name email');
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found', statusCode: 404 });
    }

    // Patient can only view own profile
    if (req.user.role === 'patient' && patient.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied', statusCode: 403 });
    }

    res.json({ success: true, data: patient });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// PUT /api/patients/:id
const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found', statusCode: 404 });
    }

    if (req.user.role === 'patient' && patient.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied', statusCode: 403 });
    }

    const updates = { ...req.body };
    if (req.file) updates.photoUrl = req.file.path;

    const updated = await Patient.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: updated, message: 'Patient profile updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// DELETE /api/patients/:id
const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found', statusCode: 404 });
    }
    res.json({ success: true, message: 'Patient deleted (soft) successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// GET /api/patients/search
const searchPatients = async (req, res) => {
  try {
    const { name, bloodGroup } = req.query;
    const filter = { isActive: true };
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    let patients = await Patient.find(filter).populate('userId', 'name email');
    if (name) {
      patients = patients.filter(p => p.userId && p.userId.name.toLowerCase().includes(name.toLowerCase()));
    }

    res.json({ success: true, data: patients });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

module.exports = { createPatient, getAllPatients, getPatient, updatePatient, deletePatient, searchPatients, getMyProfile };
