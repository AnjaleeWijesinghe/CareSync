const AuditLog = require('../models/AuditLog');
const { isValidObjectId } = require('../utils/validators');

// GET /api/audit-logs
const getAuditLogs = async (req, res) => {
  try {
    const { userId, resourceType, action, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (userId && isValidObjectId(userId)) filter.userId = String(userId);
    if (resourceType && ['MedicalRecord', 'Prescription', 'Attachment'].includes(String(resourceType))) {
      filter.resourceType = String(resourceType);
    }
    if (action && ['CREATE', 'READ', 'UPDATE', 'DELETE', 'UPLOAD', 'DOWNLOAD'].includes(String(action))) {
      filter.action = String(action);
    }
    if (dateFrom || dateTo) {
      filter.timestamp = {};
      if (dateFrom) { const f = new Date(String(dateFrom)); if (!isNaN(f.getTime())) filter.timestamp.$gte = f; }
      if (dateTo) { const t = new Date(String(dateTo)); if (!isNaN(t.getTime())) { t.setHours(23, 59, 59, 999); filter.timestamp.$lte = t; } }
    }

    const p = Math.max(1, parseInt(String(page), 10) || 1);
    const l = Math.min(200, Math.max(1, parseInt(String(limit), 10) || 50));
    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .skip((p - 1) * l)
      .limit(l);
    const total = await AuditLog.countDocuments(filter);

    res.json({ success: true, data: logs, pagination: { page: p, limit: l, total } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// GET /api/audit-logs/record/:recordId
const getRecordAuditTrail = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.recordId)) {
      return res.status(400).json({ success: false, error: 'Invalid record ID', statusCode: 400 });
    }
    const logs = await AuditLog.find({ resourceId: req.params.recordId })
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 });
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

module.exports = { getAuditLogs, getRecordAuditTrail };
