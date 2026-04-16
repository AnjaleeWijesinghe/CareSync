const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  diagnosis: { type: String, required: true },
  symptoms: [{ type: String }],
  treatment: { type: String },
  notes: { type: String },
  documents: [
    {
      fileName: { type: String },
      fileUrl: { type: String },
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  recordDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
