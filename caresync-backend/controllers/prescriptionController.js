const { validationResult } = require('express-validator');
const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { isValidObjectId } = require('../utils/validators');

// POST /api/prescriptions
const createPrescription = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const data = { ...req.body };

    if (req.user.role === 'doctor' && !data.doctorId) {
      const doctor = await Doctor.findOne({ userId: req.user.id });
      if (!doctor) {
        return res.status(404).json({ success: false, error: 'Doctor profile not found', statusCode: 404 });
      }
      data.doctorId = doctor._id;
    }

    const prescription = await Prescription.create(data);
    await prescription.populate([
      { path: 'patientId', populate: { path: 'userId', select: 'name email' } },
      { path: 'doctorId', populate: { path: 'userId', select: 'name email' } },
    ]);

    res.status(201).json({ success: true, data: prescription, message: 'Prescription issued successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// GET /api/prescriptions  (admin)
const getAllPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } })
      .sort({ issueDate: -1 });

    res.json({ success: true, data: prescriptions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// GET /api/prescriptions/my  (patient)
const getMyPrescriptions = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient profile not found', statusCode: 404 });
    }

    const { status } = req.query;
    const filter = { patientId: patient._id };
    const now = new Date();
    if (status === 'active') filter.$or = [{ expiryDate: { $gte: now } }, { expiryDate: null }];
    if (status === 'expired') filter.expiryDate = { $lt: now };

    const prescriptions = await Prescription.find(filter)
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } })
      .sort({ issueDate: -1 });

    res.json({ success: true, data: prescriptions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// GET /api/prescriptions/:id
const getPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } });

    if (!prescription) {
      return res.status(404).json({ success: false, error: 'Prescription not found', statusCode: 404 });
    }

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user.id });
      if (!patient || prescription.patientId._id.toString() !== patient._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied', statusCode: 403 });
      }
    }

    res.json({ success: true, data: prescription });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// PUT /api/prescriptions/:id
const updatePrescription = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid prescription ID', statusCode: 400 });
    }
    // Extract only known safe fields to prevent mass-assignment injection
    const { medicines, instructions, expiryDate, refillsAllowed } = req.body;
    const safeUpdate = { updatedAt: new Date() };
    if (medicines !== undefined) safeUpdate.medicines = medicines;
    if (instructions !== undefined) safeUpdate.instructions = String(instructions);
    if (expiryDate !== undefined) {
      const d = new Date(String(expiryDate));
      if (!isNaN(d.getTime())) safeUpdate.expiryDate = d;
    }
    if (refillsAllowed !== undefined) safeUpdate.refillsAllowed = Number(refillsAllowed);

    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      safeUpdate,
      { new: true, runValidators: true }
    );
    if (!prescription) {
      return res.status(404).json({ success: false, error: 'Prescription not found', statusCode: 404 });
    }
    res.json({ success: true, data: prescription, message: 'Prescription updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// PATCH /api/prescriptions/:id/refill
const incrementRefill = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ success: false, error: 'Prescription not found', statusCode: 404 });
    }

    if (prescription.refillsUsed >= prescription.refillsAllowed) {
      return res.status(400).json({ success: false, error: 'No refills remaining', statusCode: 400 });
    }

    prescription.refillsUsed += 1;
    await prescription.save();

    res.json({ success: true, data: prescription, message: 'Refill incremented' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// DELETE /api/prescriptions/:id
const deletePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ success: false, error: 'Prescription not found', statusCode: 404 });
    }

    // Doctor can only delete own prescriptions
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user.id });
      if (!doctor || prescription.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied', statusCode: 403 });
      }
    }

    await Prescription.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Prescription deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

module.exports = { createPrescription, getAllPrescriptions, getMyPrescriptions, getPrescription, updatePrescription, incrementRefill, deletePrescription };
