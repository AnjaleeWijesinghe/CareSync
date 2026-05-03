const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userRole: { type: String, required: true },
  action: {
    type: String,
    enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'UPLOAD', 'DOWNLOAD'],
    required: true,
  },
  resourceType: {
    type: String,
    enum: ['MedicalRecord', 'Prescription', 'Attachment'],
    required: true,
  },
  resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  details: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now },
});

auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
