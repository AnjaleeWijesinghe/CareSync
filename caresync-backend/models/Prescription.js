const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String },
  instructions: { type: String },
});

const prescriptionSchema = new mongoose.Schema({
  recordId: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  medicines: { type: [medicineSchema], required: true, validate: [arr => arr.length > 0, 'At least one medicine is required'] },
  prescriptionDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'Completed', 'Cancelled'], default: 'Active' },
  refillCount: { type: Number, default: 0 },
  notes: { type: String },
}, { timestamps: true });

prescriptionSchema.index({ patientId: 1, prescriptionDate: -1 });
prescriptionSchema.index({ recordId: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
