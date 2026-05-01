const MedicalRecord = require('../models/MedicalRecord');
const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { isValidObjectId } = require('../utils/validators');
const { logAudit } = require('../middleware/auditMiddleware');
const { uploadToCloudinary } = require('../middleware/uploadMiddleware');

const populateRecord = (query) =>
  query.populate([
    { path: 'patientId', populate: { path: 'userId', select: 'name email' } },
    { path: 'doctorId', populate: { path: 'userId', select: 'name email' } },
    { path: 'appointmentId', select: 'date timeSlot status' },
    { path: 'addendums.addedBy', select: 'name role' }
  ]);

const getDoctorProfile = (userId) => Doctor.findOne({ userId, isActive: true });
const getPatientProfile = (userId) => Patient.findOne({ userId });

const parseSymptoms = (symptoms) => {
  if (!symptoms) return [];
  if (Array.isArray(symptoms)) return symptoms.map((s) => String(s).trim()).filter(Boolean);
  return String(symptoms).split(',').map((s) => s.trim()).filter(Boolean);
};

const parseVitals = (vitalSigns) => {
  if (!vitalSigns) return null;
  const v = typeof vitalSigns === 'string' ? JSON.parse(vitalSigns) : vitalSigns;
  const out = {};
  if (v.bloodPressure) out.bloodPressure = String(v.bloodPressure);
  if (v.heartRate) out.heartRate = Number(v.heartRate);
  if (v.temperature) out.temperature = Number(v.temperature);
  if (v.weight) out.weight = Number(v.weight);
  if (v.height) out.height = Number(v.height);
  return Object.keys(out).length ? out : null;
};

const uploadFiles = async (files) => {
  const docs = [];
  const list = Array.isArray(files) ? files : files ? [files] : [];
  for (const file of list) {
    try {
      const result = await uploadToCloudinary(file.buffer, {
        folder: 'caresync/records',
        resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
      });
      docs.push({ fileName: file.originalname, fileUrl: result.secure_url || null, fileType: file.mimetype, uploadedAt: new Date() });
    } catch (e) { console.error('File upload failed:', e.message); }
  }
  return docs;
};

// POST /api/records
const createRecord = async (req, res) => {
  try {
    const { patientId, appointmentId, diagnosis, symptoms, treatment, notes, vitalSigns } = req.body;
    if (!diagnosis || !String(diagnosis).trim()) return res.status(400).json({ success: false, error: 'Diagnosis is required', statusCode: 400 });
    if (!patientId || !isValidObjectId(patientId)) return res.status(400).json({ success: false, error: 'Valid patientId is required', statusCode: 400 });

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found', statusCode: 404 });

    let resolvedDoctorId;
    if (req.user.role === 'doctor') {
      const doc = await getDoctorProfile(req.user.id);
      if (!doc) return res.status(404).json({ success: false, error: 'Doctor profile not found', statusCode: 404 });
      resolvedDoctorId = doc._id;
    } else if (req.user.role === 'admin' && req.body.doctorId && isValidObjectId(req.body.doctorId)) {
      const doc = await Doctor.findById(req.body.doctorId);
      if (!doc) return res.status(404).json({ success: false, error: 'Specified doctor not found', statusCode: 404 });
      resolvedDoctorId = doc._id;
    }
    if (!resolvedDoctorId) return res.status(400).json({ success: false, error: 'doctorId is required', statusCode: 400 });

    const documents = await uploadFiles(req.files || (req.file ? [req.file] : []));
    const vitals = parseVitals(vitalSigns);

    const record = await MedicalRecord.create({
      patientId, doctorId: resolvedDoctorId,
      appointmentId: appointmentId && isValidObjectId(appointmentId) ? appointmentId : undefined,
      diagnosis: String(diagnosis).trim(), symptoms: parseSymptoms(symptoms),
      treatment: treatment ? String(treatment).trim() : undefined,
      notes: notes ? String(notes).trim() : undefined,
      vitalSigns: vitals || undefined, documents,
    });
    await populateRecord(record);
    logAudit(req, { action: 'CREATE', resourceType: 'MedicalRecord', resourceId: record._id, details: `Created record for patient ${patientId}` });
    res.status(201).json({ success: true, data: record, message: 'Medical record created successfully' });
  } catch (err) { res.status(500).json({ success: false, error: err.message, statusCode: 500 }); }
};

// GET /api/records
const getAllRecords = async (req, res) => {
  try {
    const { patient, date, dateFrom, dateTo, diagnosis, status, page = 1, limit = 20 } = req.query;
    const filter = { status: status && ['Active', 'Archived'].includes(String(status)) ? String(status) : 'Active' };

    if (patient && isValidObjectId(patient)) filter.patientId = String(patient);
    if (date) {
      const d = new Date(String(date)); if (!isNaN(d.getTime())) { const s = new Date(d); s.setHours(0,0,0,0); const e = new Date(s); e.setDate(e.getDate()+1); filter.recordDate = { $gte: s, $lt: e }; }
    } else if (dateFrom || dateTo) {
      filter.recordDate = {};
      if (dateFrom) { const f = new Date(String(dateFrom)); if (!isNaN(f.getTime())) filter.recordDate.$gte = f; }
      if (dateTo) { const t = new Date(String(dateTo)); if (!isNaN(t.getTime())) { t.setHours(23,59,59,999); filter.recordDate.$lte = t; } }
    }
    if (diagnosis) { const safe = String(diagnosis).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); filter.diagnosis = { $regex: safe, $options: 'i' }; }

    const p = Math.max(1, parseInt(String(page),10)||1);
    const l = Math.min(100, Math.max(1, parseInt(String(limit),10)||20));
    const records = await populateRecord(MedicalRecord.find(filter)).sort({ recordDate: -1 }).skip((p-1)*l).limit(l);
    const total = await MedicalRecord.countDocuments(filter);
    res.json({ success: true, data: records, pagination: { page: p, limit: l, total } });
  } catch (err) { res.status(500).json({ success: false, error: err.message, statusCode: 500 }); }
};

// GET /api/records/me
const getMyRecords = async (req, res) => {
  try {
    const patient = await getPatientProfile(req.user.id);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient profile not found', statusCode: 404 });
    const filter = { patientId: patient._id, status: 'Active' };
    const { dateFrom, dateTo } = req.query;
    if (dateFrom || dateTo) {
      filter.recordDate = {};
      if (dateFrom) { const f = new Date(String(dateFrom)); if (!isNaN(f.getTime())) filter.recordDate.$gte = f; }
      if (dateTo) { const t = new Date(String(dateTo)); if (!isNaN(t.getTime())) { t.setHours(23,59,59,999); filter.recordDate.$lte = t; } }
    }
    const records = await populateRecord(MedicalRecord.find(filter)).sort({ recordDate: -1 });
    logAudit(req, { action: 'READ', resourceType: 'MedicalRecord', resourceId: patient._id, details: 'Patient viewed own records' });
    res.json({ success: true, data: records });
  } catch (err) { res.status(500).json({ success: false, error: err.message, statusCode: 500 }); }
};

// GET /api/records/patient/:patientId
const getPatientRecords = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.patientId)) return res.status(400).json({ success: false, error: 'Invalid patient ID', statusCode: 400 });
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found', statusCode: 404 });
    if (req.user.role === 'patient' && patient.userId.toString() !== req.user.id) return res.status(403).json({ success: false, error: 'Access denied', statusCode: 403 });
    const records = await populateRecord(MedicalRecord.find({ patientId: patient._id, status: 'Active' })).sort({ recordDate: -1 });
    logAudit(req, { action: 'READ', resourceType: 'MedicalRecord', resourceId: patient._id, details: `Viewed records for patient ${patient._id}` });
    res.json({ success: true, data: records });
  } catch (err) { res.status(500).json({ success: false, error: err.message, statusCode: 500 }); }
};

// GET /api/records/:id
const getRecord = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid record ID', statusCode: 400 });
    const record = await populateRecord(MedicalRecord.findById(req.params.id));
    if (!record) return res.status(404).json({ success: false, error: 'Medical record not found', statusCode: 404 });

    if (req.user.role === 'patient') {
      const p = await getPatientProfile(req.user.id);
      if (!p || record.patientId._id.toString() !== p._id.toString()) return res.status(403).json({ success: false, error: 'Access denied', statusCode: 403 });
    }
    if (req.user.role === 'doctor') {
      const d = await getDoctorProfile(req.user.id);
      if (!d || record.doctorId._id.toString() !== d._id.toString()) return res.status(403).json({ success: false, error: 'Access denied', statusCode: 403 });
    }

    const prescriptions = await Prescription.find({ recordId: record._id }).populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } });
    logAudit(req, { action: 'READ', resourceType: 'MedicalRecord', resourceId: record._id, details: `Viewed record ${record._id}` });
    res.json({ success: true, data: { ...record.toObject(), prescriptions } });
  } catch (err) { res.status(500).json({ success: false, error: err.message, statusCode: 500 }); }
};

// PUT /api/records/:id
const updateRecord = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid record ID', statusCode: 400 });
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, error: 'Medical record not found', statusCode: 404 });

    if (req.user.role === 'doctor') {
      const d = await getDoctorProfile(req.user.id);
      if (!d || record.doctorId.toString() !== d._id.toString()) return res.status(403).json({ success: false, error: 'Access denied', statusCode: 403 });
    }

    const { diagnosis, symptoms, treatment, vitalSigns } = req.body;
    if (diagnosis) record.diagnosis = String(diagnosis).trim();
    if (treatment !== undefined) record.treatment = String(treatment).trim();
    if (symptoms) record.symptoms = parseSymptoms(symptoms);
    if (vitalSigns) { const v = parseVitals(vitalSigns); if (v) record.vitalSigns = { ...record.vitalSigns?.toObject(), ...v }; }

    const newDocs = await uploadFiles(req.files || []);
    if (newDocs.length) record.documents.push(...newDocs);

    await record.save();
    await populateRecord(record);
    logAudit(req, { action: 'UPDATE', resourceType: 'MedicalRecord', resourceId: record._id, details: `Updated record ${record._id}` });
    res.json({ success: true, data: record, message: 'Medical record updated successfully' });
  } catch (err) { res.status(500).json({ success: false, error: err.message, statusCode: 500 }); }
};

// PATCH /api/records/:id/addendum
const addAddendum = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid record ID', statusCode: 400 });
    const { text } = req.body;
    if (!text || !String(text).trim()) return res.status(400).json({ success: false, error: 'Addendum text is required', statusCode: 400 });

    const record = await MedicalRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, error: 'Medical record not found', statusCode: 404 });

    if (req.user.role === 'doctor') {
      const d = await getDoctorProfile(req.user.id);
      if (!d || record.doctorId.toString() !== d._id.toString()) return res.status(403).json({ success: false, error: 'Access denied', statusCode: 403 });
    }

    record.addendums.push({ text: String(text).trim(), addedBy: req.user.id, addedAt: new Date() });
    await record.save();
    await populateRecord(record);
    logAudit(req, { action: 'UPDATE', resourceType: 'MedicalRecord', resourceId: record._id, details: 'Added follow-up addendum' });
    res.json({ success: true, data: record, message: 'Addendum added successfully' });
  } catch (err) { res.status(500).json({ success: false, error: err.message, statusCode: 500 }); }
};

// GET /api/records/search
const searchRecords = async (req, res) => {
  try {
    const { name, diagnosis, dateFrom, dateTo, doctorName } = req.query;
    const filter = { status: 'Active' };
    if (diagnosis) { const s = String(diagnosis).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); filter.diagnosis = { $regex: s, $options: 'i' }; }
    if (dateFrom || dateTo) {
      filter.recordDate = {};
      if (dateFrom) { const f = new Date(String(dateFrom)); if (!isNaN(f.getTime())) filter.recordDate.$gte = f; }
      if (dateTo) { const t = new Date(String(dateTo)); if (!isNaN(t.getTime())) { t.setHours(23,59,59,999); filter.recordDate.$lte = t; } }
    }
    let records = await populateRecord(MedicalRecord.find(filter)).sort({ recordDate: -1 });
    if (name) { const n = String(name).toLowerCase(); records = records.filter((r) => r.patientId?.userId?.name?.toLowerCase().includes(n)); }
    if (doctorName) { const d = String(doctorName).toLowerCase(); records = records.filter((r) => r.doctorId?.userId?.name?.toLowerCase().includes(d)); }
    res.json({ success: true, data: records });
  } catch (err) { res.status(500).json({ success: false, error: err.message, statusCode: 500 }); }
};

// DELETE /api/records/:id
const deleteRecord = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid record ID', statusCode: 400 });
    const record = await MedicalRecord.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, error: 'Medical record not found', statusCode: 404 });
    await Prescription.deleteMany({ recordId: record._id });
    logAudit(req, { action: 'DELETE', resourceType: 'MedicalRecord', resourceId: record._id, details: `Deleted record ${record._id}` });
    res.json({ success: true, message: 'Medical record deleted permanently' });
  } catch (err) { res.status(500).json({ success: false, error: err.message, statusCode: 500 }); }
};

// PATCH /api/records/:id/archive
const archiveRecord = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid record ID', statusCode: 400 });
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, error: 'Medical record not found', statusCode: 404 });

    if (req.user.role === 'doctor') {
      const d = await getDoctorProfile(req.user.id);
      if (!d || record.doctorId.toString() !== d._id.toString()) return res.status(403).json({ success: false, error: 'Access denied', statusCode: 403 });
    }

    record.status = 'Archived';
    await record.save();
    logAudit(req, { action: 'UPDATE', resourceType: 'MedicalRecord', resourceId: record._id, details: `Archived record ${record._id}` });
    res.json({ success: true, data: record, message: 'Medical record archived successfully' });
  } catch (err) { res.status(500).json({ success: false, error: err.message, statusCode: 500 }); }
};

module.exports = { createRecord, getAllRecords, getMyRecords, getPatientRecords, getRecord, updateRecord, addAddendum, searchRecords, archiveRecord, deleteRecord };
