const bcrypt = require('bcryptjs');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { isValidObjectId } = require('../utils/validators');
const {
  VALID_DAY_CODES,
  getDoctorAvailability,
} = require('../services/doctorAvailability');

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const normaliseEmail = (value) => String(value || '').trim().toLowerCase();
const isEmailLike = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

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

const parseAvailableDays = (value) =>
  parseStringList(value).filter((day) => VALID_DAY_CODES.includes(day));

const parseNumericValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const assertValidNumericField = (body, field, label) => {
  if (!hasOwn(body, field) || body[field] === '' || body[field] === undefined || body[field] === null) {
    return;
  }

  if (parseNumericValue(body[field]) === undefined) {
    const error = new Error(`${label} must be a valid number`);
    error.statusCode = 400;
    throw error;
  }
};

const buildDoctorPayload = (body) => {
  const payload = {};

  if (hasOwn(body, 'specialisation')) {
    payload.specialisation = String(body.specialisation).trim();
  }

  if (hasOwn(body, 'qualification')) {
    payload.qualification = String(body.qualification).trim();
  }

  if (hasOwn(body, 'phone')) {
    payload.phone = String(body.phone).trim();
  }

  if (hasOwn(body, 'availableDays')) {
    payload.availableDays = parseAvailableDays(body.availableDays);
  }

  if (hasOwn(body, 'availableSlots')) {
    payload.availableSlots = parseStringList(body.availableSlots);
  }

  if (hasOwn(body, 'experienceYears')) {
    payload.experienceYears = parseNumericValue(body.experienceYears);
  }

  if (hasOwn(body, 'consultationFee')) {
    payload.consultationFee = parseNumericValue(body.consultationFee);
  }

  return payload;
};

const populateDoctorQuery = (query) => query.populate('userId', 'name email');

const toSearchRegex = (value) => new RegExp(String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

const resolveDoctor = async (doctorId) => populateDoctorQuery(Doctor.findById(doctorId));

const getAllDoctors = async (req, res) => {
  try {
    const { search, specialisation, includeInactive } = req.query;
    const filter = {};

    if (!(req.user.role === 'admin' && String(includeInactive) === 'true')) {
      filter.isActive = true;
    }

    if (specialisation) {
      filter.specialisation = toSearchRegex(specialisation);
    }

    let doctors = await populateDoctorQuery(Doctor.find(filter))
      .sort({ specialisation: 1, updatedAt: -1, createdAt: -1 });

    if (search) {
      const regex = toSearchRegex(search);
      doctors = doctors.filter((doctor) =>
        regex.test(doctor.specialisation || '')
        || regex.test(doctor.qualification || '')
        || regex.test(doctor.userId?.name || '')
      );
    }

    const specialisations = await Doctor.distinct('specialisation', filter);

    res.json({
      success: true,
      data: doctors,
      meta: {
        specialisations: specialisations.filter(Boolean).sort((left, right) => left.localeCompare(right)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

const getDoctor = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid doctor ID', statusCode: 400 });
    }

    const doctor = await resolveDoctor(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found', statusCode: 404 });
    }

    const isOwner = doctor.userId?._id?.toString() === req.user.id;
    if (doctor.isActive === false && req.user.role !== 'admin' && !isOwner) {
      return res.status(404).json({ success: false, error: 'Doctor not found', statusCode: 404 });
    }

    res.json({ success: true, data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

const getMyDoctorProfile = async (req, res) => {
  try {
    const doctor = await populateDoctorQuery(Doctor.findOne({ userId: req.user.id }));
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor profile not found', statusCode: 404 });
    }

    res.json({ success: true, data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

const createDoctor = async (req, res) => {
  try {
    const safeName = String(req.body.name || '').trim();
    const safeEmail = normaliseEmail(req.body.email);
    const password = String(req.body.password || '');
    const doctorPayload = buildDoctorPayload(req.body);

    if (!safeName || !safeEmail || !password || !doctorPayload.specialisation) {
      return res.status(400).json({
        success: false,
        error: 'name, email, password, and specialisation are required',
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

    assertValidNumericField(req.body, 'experienceYears', 'experienceYears');
    assertValidNumericField(req.body, 'consultationFee', 'consultationFee');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: safeName,
      email: safeEmail,
      passwordHash,
      role: 'doctor',
    });

    try {
      if (req.file?.path) {
        doctorPayload.photoUrl = req.file.path;
      }

      const doctor = await Doctor.create({
        userId: user._id,
        ...doctorPayload,
      });

      const populatedDoctor = await resolveDoctor(doctor._id);
      return res.status(201).json({
        success: true,
        data: populatedDoctor,
        message: 'Doctor account created successfully',
      });
    } catch (err) {
      await User.findByIdAndDelete(user._id);
      throw err;
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

const updateDoctor = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid doctor ID', statusCode: 400 });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found', statusCode: 404 });
    }

    const isOwner = doctor.userId.toString() === req.user.id;
    if (req.user.role === 'doctor' && !isOwner) {
      return res.status(403).json({ success: false, error: 'Access denied', statusCode: 403 });
    }

    if (req.body.specialisation !== undefined && !String(req.body.specialisation).trim()) {
      return res.status(400).json({ success: false, error: 'specialisation cannot be empty', statusCode: 400 });
    }

    assertValidNumericField(req.body, 'experienceYears', 'experienceYears');
    assertValidNumericField(req.body, 'consultationFee', 'consultationFee');

    const linkedUser = await User.findById(doctor.userId);
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

    if (req.user.role === 'admin' && req.body.password !== undefined && String(req.body.password)) {
      const password = String(req.body.password);
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters',
          statusCode: 400,
        });
      }

      const salt = await bcrypt.genSalt(10);
      linkedUser.passwordHash = await bcrypt.hash(password, salt);
    }

    await linkedUser.save();

    const updates = buildDoctorPayload(req.body);
    if (req.file?.path) {
      updates.photoUrl = req.file.path;
    }

    Object.assign(doctor, updates);
    await doctor.save();

    const populatedDoctor = await resolveDoctor(doctor._id);
    res.json({ success: true, data: populatedDoctor, message: 'Doctor profile updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

const deleteDoctor = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid doctor ID', statusCode: 400 });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found', statusCode: 404 });
    }

    res.json({ success: true, message: 'Doctor archived successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

const getDoctorSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!isValidObjectId(doctorId)) {
      return res.status(400).json({ success: false, error: 'Invalid doctor ID', statusCode: 400 });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'date query parameter required (YYYY-MM-DD)',
        statusCode: 400,
      });
    }

    const availability = await getDoctorAvailability(doctorId, date);
    res.json({ success: true, data: availability });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
      statusCode: err.statusCode || 500,
    });
  }
};

module.exports = {
  getAllDoctors,
  getDoctor,
  getMyDoctorProfile,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorSlots,
};
