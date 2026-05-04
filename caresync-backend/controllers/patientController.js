const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { isValidObjectId } = require('../utils/validators');

const VALID_GENDERS = ['Male', 'Female', 'Other'];
const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const parseStringList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const extractEmergencyContact = (body) => {
  const nestedContact = body.emergencyContact && typeof body.emergencyContact === 'object'
    ? body.emergencyContact
    : {};

  const name = nestedContact.name ?? body.emergencyName ?? body['emergencyContact[name]'];
  const phone = nestedContact.phone ?? body.emergencyPhone ?? body['emergencyContact[phone]'];
  const relation = nestedContact.relation ?? body.emergencyRelation ?? body['emergencyContact[relation]'];

  const emergencyContact = {};
  if (name !== undefined && String(name).trim()) emergencyContact.name = String(name).trim();
  if (phone !== undefined && String(phone).trim()) emergencyContact.phone = String(phone).trim();
  if (relation !== undefined && String(relation).trim()) emergencyContact.relation = String(relation).trim();

  return Object.keys(emergencyContact).length ? emergencyContact : null;
};

const normaliseEmail = (value) => String(value || '').trim().toLowerCase();

const isEmailLike = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const buildPatientPayload = (body) => {
  const payload = {};

  if (hasOwn(body, 'dateOfBirth')) {
    const parsedDate = new Date(String(body.dateOfBirth));
    if (!isNaN(parsedDate.getTime())) payload.dateOfBirth = parsedDate;
  }

  if (hasOwn(body, 'gender') && VALID_GENDERS.includes(String(body.gender))) {
    payload.gender = String(body.gender);
  }

  if (hasOwn(body, 'phone')) {
    payload.phone = String(body.phone).trim();
  }

  if (hasOwn(body, 'address')) {
    payload.address = String(body.address).trim();
  }

  if (hasOwn(body, 'bloodGroup') && VALID_BLOOD_GROUPS.includes(String(body.bloodGroup))) {
    payload.bloodGroup = String(body.bloodGroup);
  }

  if (hasOwn(body, 'allergies')) {
    payload.allergies = parseStringList(body.allergies);
  }

  const emergencyFieldsProvided = [
    'emergencyContact',
    'emergencyName',
    'emergencyPhone',
    'emergencyRelation',
    'emergencyContact[name]',
    'emergencyContact[phone]',
    'emergencyContact[relation]',
  ].some((key) => hasOwn(body, key));

  if (emergencyFieldsProvided) {
    payload.emergencyContact = extractEmergencyContact(body) || {};
  }

  return payload;
};

// GET /api/patients/me - own patient profile for logged-in patient
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
    if (req.user.role === 'admin') {
      const safeName = String(req.body.name || '').trim();
      const safeEmail = normaliseEmail(req.body.email);
      const password = String(req.body.password || '');

      if (!safeName || !safeEmail || !password) {
        return res.status(400).json({
          success: false,
          error: 'name, email, and password are required when an admin creates a patient account',
          statusCode: 400,
        });
      }

      if (!isEmailLike(safeEmail)) {
        return res.status(400).json({ success: false, error: 'Valid email required', statusCode: 400 });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters',
          statusCode: 400,
        });
      }

      const existingUser = await User.findOne({ email: safeEmail });
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'Email already registered', statusCode: 400 });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const user = await User.create({
        name: safeName,
        email: safeEmail,
        passwordHash,
        role: 'patient',
      });

      try {
        const data = { ...buildPatientPayload(req.body), userId: user._id };
        if (req.file?.path) data.photoUrl = req.file.path;

        const patient = await Patient.create(data);
        await patient.populate('userId', 'name email');

        return res.status(201).json({
          success: true,
          data: patient,
          message: 'Patient account created successfully',
        });
      } catch (err) {
        await User.findByIdAndDelete(user._id);
        throw err;
      }
    }

    const existing = await Patient.findOne({ userId: req.user.id });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Patient profile already exists', statusCode: 400 });
    }

    const data = { ...buildPatientPayload(req.body), userId: req.user.id };
    if (req.file?.path) data.photoUrl = req.file.path;

    const patient = await Patient.create(data);
    res.status(201).json({ success: true, data: patient, message: 'Patient profile created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// GET /api/patients
const getAllPatients = async (req, res) => {
  try {
    const { name, bloodGroup, page = 1, limit = 20, includeInactive } = req.query;
    const filter = {};

    if (String(includeInactive) !== 'true') {
      filter.isActive = true;
    }

    if (bloodGroup && VALID_BLOOD_GROUPS.includes(String(bloodGroup))) {
      filter.bloodGroup = String(bloodGroup);
    }

    const safePage = Math.max(1, parseInt(String(page), 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));

    let query;
    if (name) {
      const safeNameRegex = String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query = Patient.find(filter)
        .populate({ path: 'userId', match: { name: { $regex: safeNameRegex, $options: 'i' } }, select: 'name email' });
    } else {
      query = Patient.find(filter).populate('userId', 'name email');
    }

    const patients = await query
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit);

    const filtered = name ? patients.filter((patient) => patient.userId) : patients;
    res.json({ success: true, data: filtered });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// GET /api/patients/:id
const getPatient = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid patient ID', statusCode: 400 });
    }

    const patient = await Patient.findById(req.params.id).populate('userId', 'name email');
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found', statusCode: 404 });
    }

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

    if (req.user.role === 'admin') {
      const linkedUser = await User.findById(patient.userId);
      if (!linkedUser) {
        return res.status(404).json({ success: false, error: 'Linked user account not found', statusCode: 404 });
      }

      if (req.body.name !== undefined) {
        const safeName = String(req.body.name).trim();
        if (safeName) {
          linkedUser.name = safeName;
        }
      }

      if (req.body.email !== undefined) {
        const safeEmail = normaliseEmail(req.body.email);
        if (!isEmailLike(safeEmail)) {
          return res.status(400).json({ success: false, error: 'Valid email required', statusCode: 400 });
        }

        const duplicate = await User.findOne({ email: safeEmail, _id: { $ne: linkedUser._id } });
        if (duplicate) {
          return res.status(400).json({ success: false, error: 'Email already registered', statusCode: 400 });
        }

        linkedUser.email = safeEmail;
      }

      await linkedUser.save();
    }

    const safeUpdates = buildPatientPayload(req.body);
    if (req.file?.path) safeUpdates.photoUrl = req.file.path;

    Object.assign(patient, safeUpdates);
    const updated = await patient.save();
    await updated.populate('userId', 'name email');

    res.json({ success: true, data: updated, message: 'Patient profile updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// DELETE /api/patients/:id
const deletePatient = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid patient ID', statusCode: 400 });
    }

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
    const { name, bloodGroup, includeInactive } = req.query;
    const filter = {};

    if (String(includeInactive) !== 'true') {
      filter.isActive = true;
    }

    if (bloodGroup && VALID_BLOOD_GROUPS.includes(String(bloodGroup))) {
      filter.bloodGroup = String(bloodGroup);
    }

    let patients = await Patient.find(filter)
      .populate('userId', 'name email')
      .sort({ updatedAt: -1, createdAt: -1 });
    if (name) {
      const safeName = String(name).toLowerCase();
      patients = patients.filter((patient) => patient.userId && patient.userId.name.toLowerCase().includes(safeName));
    }

    res.json({ success: true, data: patients });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

module.exports = {
  createPatient,
  getAllPatients,
  getPatient,
  updatePatient,
  deletePatient,
  searchPatients,
  getMyProfile,
};
