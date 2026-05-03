const Prescription = require('../models/Prescription');
const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { isValidObjectId } = require('../utils/validators');
const { logAudit } = require('../middleware/auditMiddleware');

const getDoctorProfile = (userId) => Doctor.findOne({ userId, isActive: true });
const getPatientProfile = (userId) => Patient.findOne({ userId });

const populatePrescription = (query) =>
  query.populate([
    { path: 'patientId', populate: { path: 'userId', select: 'name email' } },
    { path: 'doctorId', populate: { path: 'userId', select: 'name email' } },
    { path: 'recordId', select: 'diagnosis recordDate' }
  ]);

// POST /api/prescriptions
const createPrescription = async (req, res) => {
  try {
    const { recordId, patientId, medicines, notes } = req.body;

    if (!recordId || !isValidObjectId(recordId)) return res.status(400).json({ success: false, error: 'Valid recordId is required', statusCode: 400 });
    if (!patientId || !isValidObjectId(patientId)) return res.status(400).json({ success: false, error: 'Valid patientId is required', statusCode: 400 });

    const record = await MedicalRecord.findById(recordId);
    if (!record) return res.status(404).json({ success: false, error: 'Medical record not found', statusCode: 404 });

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found', statusCode: 404 });

    let resolvedDoctorId;
    if (req.user.role === 'doctor') {
      const doc = await getDoctorProfile(req.user.id);
      if (!doc) return res.status(404).json({ success: false, error: 'Doctor profile not found', statusCode: 404 });
      resolvedDoctorId = doc._id;
    } else if (req.user.role === 'admin' && req.body.doctorId && isValidObjectId(req.body.doctorId)) {
      resolvedDoctorId = req.body.doctorId;
    }
    if (!resolvedDoctorId) return res.status(400).json({ success: false, error: 'doctorId is required', statusCode: 400 });

    let parsedMedicines = medicines;
    if (typeof medicines === 'string') parsedMedicines = JSON.parse(medicines);
    if (!Array.isArray(parsedMedicines) || parsedMedicines.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one medicine is required', statusCode: 400 });
    }

    const prescription = await Prescription.create({
      recordId, patientId, doctorId: resolvedDoctorId,
      medicines: parsedMedicines, notes: notes ? String(notes).trim() : undefined,
    });
    await populatePrescription(prescription);

    logAudit(req, { action: 'CREATE', resourceType: 'Prescription', resourceId: prescription._id, details: `Created prescription for patient ${patientId}` });
    res.status(201).json({ success: true, data: prescription, message: 'Prescription created successfully' });
  } catch (err) { res.status(500).json({ success: false, error: err.message, statusCode: 500 }); }
};

// GET /api/prescriptions
const getAllPrescriptions = async (req, res) => {
  try {
    const { patient, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (patient && isValidObjectId(patient)) filter.patientId = String(patient);
    if (status && ['Active', 'Completed', 'Cancelled'].includes(String(status))) filter.status = String(status);

    const p = Math.max(1, parseInt(String(page), 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const prescriptions = await populatePrescription(Prescription.find(filter)).sort({ prescriptionDate: -1 }).skip((p - 1) * l).limit(l);
    const total = await Prescription.countDocuments(filter);
    res.json({ success: true, data: prescriptions, pagination: { page: p, limit: l, total } });
  } catch (err) { res.status(500).json({ success: false, error: err.message, statusCode: 500 }); }
};

// GET /api/prescriptions/my
const getMyPrescriptions = async (req, res) => {
  try {
    const patient = await getPatientProfile(req.user.id);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient profile not found', statusCode: 404 });
    const prescriptions = await populatePrescription(Prescription.find({ patientId: patient._id })).sort({ prescriptionDate: -1 });
    res.json({ success: true, data: prescriptions });
  } catch (err) { res.status(500).json({ success: false, error: err.message, statusCode: 500 }); }
};

// GET /api/prescriptions/:id
const getPrescription = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid prescription ID', statusCode: 400 });
    const prescription = await populatePrescription(Prescription.findById(req.params.id));
    if (!prescription) return res.status(404).json({ success: false, error: 'Prescription not found', statusCode: 404 });

    if (req.user.role === 'patient') {
      const p = await getPatientProfile(req.user.id);
      if (!p || prescription.patientId._id.toString() !== p._id.toString()) return res.status(403).json({ success: false, error: 'Access denied', statusCode: 403 });
    }
    if (req.user.role === 'doctor') {
      const d = await getDoctorProfile(req.user.id);
      if (!d || prescription.doctorId._id.toString() !== d._id.toString()) return res.status(403).json({ success: false, error: 'Access denied', statusCode: 403 });
    }

    logAudit(req, { action: 'READ', resourceType: 'Prescription', resourceId: prescription._id, details: `Viewed prescription ${prescription._id}` });
    res.json({ success: true, data: prescription });
  } catch (err) { res.status(500).json({ success: false, error: err.message, statusCode: 500 }); }
};

// PUT /api/prescriptions/:id
const updatePrescription = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid prescription ID', statusCode: 400 });
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ success: false, error: 'Prescription not found', statusCode: 404 });

    if (req.user.role === 'doctor') {
      const d = await getDoctorProfile(req.user.id);
      if (!d || prescription.doctorId.toString() !== d._id.toString()) return res.status(403).json({ success: false, error: 'Access denied', statusCode: 403 });
    }

    const { medicines, status, notes } = req.body;
    if (medicines) {
      const parsed = typeof medicines === 'string' ? JSON.parse(medicines) : medicines;
      if (Array.isArray(parsed) && parsed.length) prescription.medicines = parsed;
    }
    if (status && ['Active', 'Completed', 'Cancelled'].includes(String(status))) prescription.status = String(status);
    if (notes !== undefined) prescription.notes = String(notes).trim();

    await prescription.save();
    await populatePrescription(prescription);
    logAudit(req, { action: 'UPDATE', resourceType: 'Prescription', resourceId: prescription._id, details: `Updated prescription ${prescription._id}` });
    res.json({ success: true, data: prescription, message: 'Prescription updated successfully' });
  } catch (err) { res.status(500).json({ success: false, error: err.message, statusCode: 500 }); }
};

// PATCH /api/prescriptions/:id/refill
const refillPrescription = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid prescription ID', statusCode: 400 });
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ success: false, error: 'Prescription not found', statusCode: 404 });

    prescription.refillCount += 1;
    prescription.status = 'Active';
    await prescription.save();
    await populatePrescription(prescription);
    logAudit(req, { action: 'UPDATE', resourceType: 'Prescription', resourceId: prescription._id, details: `Refilled prescription (count: ${prescription.refillCount})` });
    res.json({ success: true, data: prescription, message: `Prescription refilled (count: ${prescription.refillCount})` });
  } catch (err) { res.status(500).json({ success: false, error: err.message, statusCode: 500 }); }
};

// DELETE /api/prescriptions/:id
const deletePrescription = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid prescription ID', statusCode: 400 });
    const prescription = await Prescription.findByIdAndDelete(req.params.id);
    if (!prescription) return res.status(404).json({ success: false, error: 'Prescription not found', statusCode: 404 });
    logAudit(req, { action: 'DELETE', resourceType: 'Prescription', resourceId: prescription._id, details: `Deleted prescription ${prescription._id}` });
    res.json({ success: true, message: 'Prescription deleted successfully' });
  } catch (err) { res.status(500).json({ success: false, error: err.message, statusCode: 500 }); }
};

module.exports = { createPrescription, getAllPrescriptions, getMyPrescriptions, getPrescription, updatePrescription, refillPrescription, deletePrescription };
