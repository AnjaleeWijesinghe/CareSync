const mongoose = require('mongoose');


const doctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  specialisation: { type: String, required: true },
  qualification: { type: String },
  experienceYears: { type: Number },
  phone: { type: String },
  availableDays: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
  availableSlots: [{ type: String }],
  consultationFee: { type: Number },
  photoUrl: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
