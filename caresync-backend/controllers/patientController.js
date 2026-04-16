const { validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const { isValidObjectId } = require('../utils/validators');

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
    // Cast to string to prevent NoSQL injection; validate bloodGroup against enum
    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    if (bloodGroup && validBloodGroups.includes(String(bloodGroup))) {
      filter.bloodGroup = String(bloodGroup);
    }

    // Use safe integer bounds for pagination
    const safePage = Math.max(1, parseInt(String(page), 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));

    let query = Patient.find(filter).populate('userId', 'name email');
    if (name) {
      // Escape regex special chars to prevent ReDoS
      const safeNameRegex = String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query = Patient.find(filter)
        .populate({ path: 'userId', match: { name: { $regex: safeNameRegex, $options: 'i' } }, select: 'name email' });
    }

    const patients = await query
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit);

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
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid patient ID', statusCode: 400 });
    }
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found', statusCode: 404 });
    }

    if (req.user.role === 'patient' && patient.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied', statusCode: 403 });
    }

    // Explicitly extract known fields to prevent mass-assignment injection
    const {
      dateOfBirth, gender, phone, address, bloodGroup, allergies, emergencyContact,
    } = req.body;

    const safeUpdates = {};
    if (dateOfBirth !== undefined) {
      const d = new Date(String(dateOfBirth));
      if (!isNaN(d.getTime())) safeUpdates.dateOfBirth = d;
    }
    const validGenders = ['Male', 'Female', 'Other'];
    if (gender !== undefined && validGenders.includes(String(gender))) safeUpdates.gender = String(gender);
    if (phone !== undefined) safeUpdates.phone = String(phone);
    if (address !== undefined) safeUpdates.address = String(address);
    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    if (bloodGroup !== undefined && validBloodGroups.includes(String(bloodGroup))) safeUpdates.bloodGroup = String(bloodGroup);
    if (allergies !== undefined) {
      safeUpdates.allergies = Array.isArray(allergies) ? allergies.map(String) : String(allergies).split(',').map(a => a.trim()).filter(Boolean);
    }
    if (emergencyContact !== undefined && typeof emergencyContact === 'object') {
      safeUpdates.emergencyContact = {
        name: emergencyContact.name ? String(emergencyContact.name) : undefined,
        phone: emergencyContact.phone ? String(emergencyContact.phone) : undefined,
        relation: emergencyContact.relation ? String(emergencyContact.relation) : undefined,
      };
    }
    if (req.file) safeUpdates.photoUrl = req.file.path;

    const updated = await Patient.findByIdAndUpdate(req.params.id, safeUpdates, { new: true, runValidators: true });
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
    // Validate bloodGroup against enum to prevent injection
    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    if (bloodGroup && validBloodGroups.includes(String(bloodGroup))) {
      filter.bloodGroup = String(bloodGroup);
    }

    let patients = await Patient.find(filter).populate('userId', 'name email');
    if (name) {
      const safeName = String(name).toLowerCase();
      patients = patients.filter(p => p.userId && p.userId.name.toLowerCase().includes(safeName));
    }

    res.json({ success: true, data: patients });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

module.exports = { createPatient, getAllPatients, getPatient, updatePatient, deletePatient, searchPatients, getMyProfile };
