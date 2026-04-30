const express = require('express');
const { protect, authorise } = require('../middleware/authMiddleware');
const { getAuditLogs, getRecordAuditTrail } = require('../controllers/auditLogController');

const router = express.Router();

router.get('/', protect, authorise('admin'), getAuditLogs);
router.get('/record/:recordId', protect, authorise('admin'), getRecordAuditTrail);

module.exports = router;
