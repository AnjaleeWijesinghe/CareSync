const AuditLog = require('../models/AuditLog');

/**
 * Log an auditable action. Fire-and-forget — failures are logged to
 * console but never block the request.
 *
 * @param {import('express').Request} req  – Express request (must have `req.user`)
 * @param {Object} opts
 * @param {'CREATE'|'READ'|'UPDATE'|'DELETE'|'UPLOAD'|'DOWNLOAD'} opts.action
 * @param {'MedicalRecord'|'Prescription'|'Attachment'} opts.resourceType
 * @param {string} opts.resourceId
 * @param {string} [opts.details]
 */
const logAudit = (req, { action, resourceType, resourceId, details }) => {
  AuditLog.create({
    userId: req.user.id,
    userRole: req.user.role,
    action,
    resourceType,
    resourceId,
    details,
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
  }).catch((err) => {
    console.error('Audit log write failed:', err.message);
  });
};

module.exports = { logAudit };
