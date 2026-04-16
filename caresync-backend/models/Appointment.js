const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  reason: { type: String },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Pending',
  },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Compound index to detect duplicate bookings
appointmentSchema.index({ doctorId: 1, date: 1, timeSlot: 1 }, { unique: false });

module.exports = mongoose.model('Appointment', appointmentSchema);
