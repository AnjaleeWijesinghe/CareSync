const mongoose = require('mongoose');

const addendumSchema = new mongoose.Schema({
  text: { type: String, required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  addedAt: { type: Date, default: Date.now },
});

const documentSchema = new mongoose.Schema({
  fileName: { type: String },
  fileUrl: { type: String },
  fileType: { type: String },
  uploadedAt: { type: Date, default: Date.now },
});

const medicalRecordSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  recordDate: { type: Date, default: Date.now },
  diagnosis: { type: String, required: true },
  symptoms: [{ type: String }],
  treatment: { type: String },
  notes: { type: String },
  vitalSigns: {
    bloodPressure: { type: String },
    heartRate: { type: Number },
    temperature: { type: Number },
    weight: { type: Number },
    height: { type: Number },
  },
  documents: [documentSchema],
  addendums: [addendumSchema],
  status: { type: String, enum: ['Active', 'Archived'], default: 'Active' },
}, { timestamps: true });

medicalRecordSchema.index({ patientId: 1, recordDate: -1 });
medicalRecordSchema.index({ doctorId: 1 });
medicalRecordSchema.index({ diagnosis: 'text' });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
