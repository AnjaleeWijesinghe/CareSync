const { validationResult } = require('express-validator');
const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

// POST /api/records
const createRecord = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const data = { ...req.body };

    // Resolve doctorId from logged-in user if doctor
    if (req.user.role === 'doctor' && !data.doctorId) {
      const doctor = await Doctor.findOne({ userId: req.user.id });
      if (!doctor) {
        return res.status(404).json({ success: false, error: 'Doctor profile not found', statusCode: 404 });
      }
      data.doctorId = doctor._id;
    }

    // Handle document upload
    if (req.file) {
      data.documents = [{ fileName: req.file.originalname, fileUrl: req.file.path, uploadedAt: new Date() }];
    }

    const record = await MedicalRecord.create(data);
    await record.populate([
      { path: 'patientId', populate: { path: 'userId', select: 'name email' } },
      { path: 'doctorId', populate: { path: 'userId', select: 'name email' } },
    ]);

    res.status(201).json({ success: true, data: record, message: 'Medical record created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// GET /api/records  (admin)
const getAllRecords = async (req, res) => {
  try {
    const { patient, dateFrom, dateTo } = req.query;
    const filter = {};
    if (patient) filter.patientId = patient;
    if (dateFrom || dateTo) {
      filter.recordDate = {};
      if (dateFrom) filter.recordDate.$gte = new Date(dateFrom);
      if (dateTo) filter.recordDate.$lte = new Date(dateTo);
    }

    const records = await MedicalRecord.find(filter)
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } })
      .sort({ recordDate: -1 });

    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// GET /api/records/patient/:patientId
const getPatientRecords = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const filter = { patientId: req.params.patientId };

    if (dateFrom || dateTo) {
      filter.recordDate = {};
      if (dateFrom) filter.recordDate.$gte = new Date(dateFrom);
      if (dateTo) filter.recordDate.$lte = new Date(dateTo);
    }

    // Ownership check for patient role
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user.id });
      if (!patient || patient._id.toString() !== req.params.patientId) {
        return res.status(403).json({ success: false, error: 'Access denied', statusCode: 403 });
      }
    }

    const records = await MedicalRecord.find(filter)
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } })
      .sort({ recordDate: -1 });

    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// GET /api/records/:id
const getRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } });

    if (!record) {
      return res.status(404).json({ success: false, error: 'Medical record not found', statusCode: 404 });
    }

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user.id });
      if (!patient || record.patientId._id.toString() !== patient._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied', statusCode: 403 });
      }
    }

    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// PUT /api/records/:id
const updateRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Medical record not found', statusCode: 404 });
    }

    const updates = { ...req.body };
    if (req.file) {
      updates.$push = {
        documents: { fileName: req.file.originalname, fileUrl: req.file.path, uploadedAt: new Date() },
      };
    }

    const updated = await MedicalRecord.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } });

    res.json({ success: true, data: updated, message: 'Medical record updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// DELETE /api/records/:id
const deleteRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Medical record not found', statusCode: 404 });
    }
    res.json({ success: true, message: 'Medical record deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

module.exports = { createRecord, getAllRecords, getPatientRecords, getRecord, updateRecord, deleteRecord };
