const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  recordId: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord' },
  medicines: [
    {
      name: { type: String, required: true },
      dosage: { type: String },
      frequency: { type: String },
      duration: { type: String },
    },
  ],
  instructions: { type: String },
  issueDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  refillsAllowed: { type: Number, default: 0 },
  refillsUsed: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
