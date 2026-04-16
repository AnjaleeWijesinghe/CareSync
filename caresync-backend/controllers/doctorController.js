const { validationResult } = require('express-validator');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// POST /api/doctors
const createDoctor = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, email, password, specialisation, qualification, experienceYears, phone,
      availableDays, availableSlots, consultationFee } = req.body;

    // Create user account for doctor
    // Cast to string to prevent NoSQL injection via object values
    const safeEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: safeEmail });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered', statusCode: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || require('crypto').randomBytes(16).toString('hex'), salt);
    const user = await User.create({ name: String(name).trim(), email: safeEmail, passwordHash, role: 'doctor' });

    const doctorData = {
      userId: user._id,
      specialisation,
      qualification,
      experienceYears,
      phone,
      availableDays: availableDays ? (Array.isArray(availableDays) ? availableDays : availableDays.split(',')) : [],
      availableSlots: availableSlots ? (Array.isArray(availableSlots) ? availableSlots : availableSlots.split(',')) : [],
      consultationFee,
    };
    if (req.file) doctorData.photoUrl = req.file.path;

    const doctor = await Doctor.create(doctorData);
    await doctor.populate('userId', 'name email');

    res.status(201).json({ success: true, data: doctor, message: 'Doctor profile created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// GET /api/doctors
const getAllDoctors = async (req, res) => {
  try {
    const { specialisation } = req.query;
    const filter = { isActive: true };
    if (specialisation) filter.specialisation = { $regex: specialisation, $options: 'i' };

    const doctors = await Doctor.find(filter).populate('userId', 'name email');
    res.json({ success: true, data: doctors });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// GET /api/doctors/:id
const getDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('userId', 'name email');
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found', statusCode: 404 });
    }
    res.json({ success: true, data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// PUT /api/doctors/:id
const updateDoctor = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.availableDays && !Array.isArray(updates.availableDays)) {
      updates.availableDays = updates.availableDays.split(',');
    }
    if (updates.availableSlots && !Array.isArray(updates.availableSlots)) {
      updates.availableSlots = updates.availableSlots.split(',');
    }
    if (req.file) updates.photoUrl = req.file.path;

    const doctor = await Doctor.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('userId', 'name email');
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found', statusCode: 404 });
    }
    res.json({ success: true, data: doctor, message: 'Doctor updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// DELETE /api/doctors/:id  (soft delete)
const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found', statusCode: 404 });
    }
    res.json({ success: true, message: 'Doctor deactivated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// GET /api/doctors/:id/slots
const getDoctorSlots = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor || !doctor.isActive) {
      return res.status(404).json({ success: false, error: 'Doctor not found', statusCode: 404 });
    }

    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, error: 'date query parameter required (YYYY-MM-DD)', statusCode: 400 });
    }

    // Validate and sanitize date to prevent NoSQL injection
    const parsedDate = new Date(String(date));
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD.', statusCode: 400 });
    }

    const Appointment = require('../models/Appointment');
    const dayStart = new Date(parsedDate);
    const dayEnd = new Date(parsedDate);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const booked = await Appointment.find({
      doctorId: doctor._id,
      date: { $gte: dayStart, $lt: dayEnd },
      status: { $ne: 'Cancelled' },
    }).select('timeSlot');

    const bookedSlots = booked.map(a => a.timeSlot);
    const available = doctor.availableSlots.filter(s => !bookedSlots.includes(s));

    res.json({ success: true, data: { date: parsedDate.toISOString().split('T')[0], allSlots: doctor.availableSlots, availableSlots: available, bookedSlots } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

module.exports = { createDoctor, getAllDoctors, getDoctor, updateDoctor, deleteDoctor, getDoctorSlots };
