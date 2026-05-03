const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  patientId: { 
    type: String, 
    required: true 
  },
  doctorId: { 
    type: String, 
    required: true 
  },
  patientName: { 
    type: String, 
    required: true 
  },
  doctorName: { 
    type: String, 
    required: true 
  },
  medications: [{
    medicineName: { type: String },
    dosage: { type: String },
    frequency: { type: String },
    duration: { type: String },
    instructions: { type: String }
  }],
  diagnosis: { 
    type: String, 
    required: true 
  },
  notes: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'cancelled'], 
    default: 'active' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
