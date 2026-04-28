const express = require('express');
const { protect, authorise } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const {
  getBookableDoctors,
  getDoctorSlots,
  bookAppointment,
  getAllAppointments,
  getMyAppointments,
  getAppointment,
  updateStatus,
  cancelAppointment,
} = require('../controllers/appointmentController');

const router = express.Router();

router.get('/doctors', protect, getBookableDoctors);
router.get('/doctors/:doctorId/slots', protect, getDoctorSlots);

router.post(
  '/',
  protect,
  authorise('patient'),
  [
    body('doctorId').notEmpty().withMessage('doctorId is required'),
    body('date').isISO8601().withMessage('Valid date required'),
    body('timeSlot').notEmpty().withMessage('timeSlot is required'),
  ],
  bookAppointment
);

router.get('/', protect, authorise('admin', 'doctor'), getAllAppointments);
router.get('/my', protect, authorise('patient'), getMyAppointments);
router.get('/:id', protect, getAppointment);
router.patch('/:id/status', protect, authorise('doctor', 'admin'), updateStatus);
router.delete('/:id', protect, authorise('patient', 'admin'), cancelAppointment);

module.exports = router;
