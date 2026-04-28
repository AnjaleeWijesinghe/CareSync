const express = require('express');
const { getOverview } = require('../controllers/adminController');
const { protect, authorise } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/overview', protect, authorise('admin'), getOverview);

module.exports = router;
