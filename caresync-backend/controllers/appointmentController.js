const { validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { isValidObjectId } = require('../utils/validators');
const {
  getDayCode,
  buildDayRange,
  getDoctorAvailability,
} = require('../services/doctorAvailability');

const populateAppointment = (query) =>
  query
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } });

const getBookableDoctors = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { isActive: true };

    if (search) {
      const safeSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.specialisation = { $regex: safeSearch, $options: 'i' };
    }

    const doctors = await Doctor.find(filter)
      .populate('userId', 'name email')
      .sort({ specialisation: 1, createdAt: -1 });

    res.json({ success: true, data: doctors });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

const getDoctorSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!isValidObjectId(doctorId)) {
      return res.status(400).json({ success: false, error: 'Invalid doctor ID', statusCode: 400 });
    }

    if (!date) {
      return res.status(400).json({ success: false, error: 'date query parameter required (YYYY-MM-DD)', statusCode: 400 });
    }

    const availability = await getDoctorAvailability(doctorId, date);

    res.json({
      success: true,
      data: availability,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message, statusCode: err.statusCode || 500 });
  }
};

const bookAppointment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { doctorId, date, timeSlot, reason } = req.body;

    if (!isValidObjectId(doctorId)) {
      return res.status(400).json({ success: false, error: 'Invalid doctor ID', statusCode: 400 });
    }

    const patient = await Patient.findOne({ userId: String(req.user.id) });
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient profile not found. Create one first.', statusCode: 404 });
    }

    const parsedDate = new Date(String(date));
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format', statusCode: 400 });
    }

    const safeDoctorId = String(doctorId);
    const safeTimeSlot = String(timeSlot);
    const doctor = await Doctor.findOne({ _id: safeDoctorId, isActive: true });

    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found', statusCode: 404 });
    }

    const scheduledDay = getDayCode(parsedDate);
    if (doctor.availableDays.length && !doctor.availableDays.includes(scheduledDay)) {
      return res.status(400).json({ success: false, error: 'Doctor is not available on the selected date', statusCode: 400 });
    }

    if (!doctor.availableSlots.includes(safeTimeSlot)) {
      return res.status(400).json({ success: false, error: 'Selected time slot is not available for this doctor', statusCode: 400 });
    }

    const { dayStart, dayEnd } = buildDayRange(parsedDate);
    const conflict = await Appointment.findOne({
      doctorId: safeDoctorId,
      date: { $gte: dayStart, $lt: dayEnd },
      timeSlot: safeTimeSlot,
      status: { $ne: 'Cancelled' },
    });

    if (conflict) {
      return res.status(409).json({ success: false, error: 'This time slot is already booked. Please choose another.', statusCode: 409 });
    }

    const appointment = await Appointment.create({
      patientId: patient._id,
      doctorId: safeDoctorId,
      date: parsedDate,
      timeSlot: safeTimeSlot,
      reason: reason ? String(reason) : undefined,
    });

    await populateAppointment(appointment);

    res.status(201).json({ success: true, data: appointment, message: 'Appointment booked successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

const getAllAppointments = async (req, res) => {
  try {
    const { doctor, date, status } = req.query;
    const filter = {};

    if (req.user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ userId: req.user.id, isActive: true });
      if (!doctorProfile) {
        return res.status(404).json({ success: false, error: 'Doctor profile not found', statusCode: 404 });
      }
      filter.doctorId = doctorProfile._id;
    } else if (doctor && isValidObjectId(doctor)) {
      filter.doctorId = String(doctor);
    }

    if (status) {
      const allowed = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
      if (allowed.includes(String(status))) filter.status = String(status);
    }

    if (date) {
      const parsedDate = new Date(String(date));
      if (!isNaN(parsedDate.getTime())) {
        const { dayStart, dayEnd } = buildDayRange(parsedDate);
        filter.date = { $gte: dayStart, $lt: dayEnd };
      }
    }

    const appointments = await populateAppointment(Appointment.find(filter))
      .sort({ date: -1 });

    res.json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

const getMyAppointments = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient profile not found', statusCode: 404 });
    }

    const appointments = await Appointment.find({ patientId: patient._id })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } })
      .sort({ date: -1 });

    res.json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

const getAppointment = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid appointment ID', statusCode: 400 });
    }

    const appointment = await populateAppointment(Appointment.findById(req.params.id));
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found', statusCode: 404 });
    }

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user.id });
      if (!patient || appointment.patientId._id.toString() !== patient._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied', statusCode: 403 });
      }
    }

    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user.id });
      if (!doctor || appointment.doctorId._id.toString() !== doctor._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied', statusCode: 403 });
      }
    }

    res.json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

const updateStatus = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid appointment ID', statusCode: 400 });
    }

    const { status } = req.body;
    const allowed = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
    const safeStatus = String(status);

    if (!allowed.includes(safeStatus)) {
      return res.status(400).json({ success: false, error: `Status must be one of: ${allowed.join(', ')}`, statusCode: 400 });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found', statusCode: 404 });
    }

    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user.id });
      if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied', statusCode: 403 });
      }
    }

    appointment.status = safeStatus;
    await appointment.save();
    await populateAppointment(appointment);

    res.json({ success: true, data: appointment, message: `Appointment status updated to ${safeStatus}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid appointment ID', statusCode: 400 });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found', statusCode: 404 });
    }

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user.id });
      if (!patient || appointment.patientId.toString() !== patient._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied', statusCode: 403 });
      }

      if (appointment.status !== 'Pending') {
        return res.status(400).json({ success: false, error: 'Only Pending appointments can be cancelled by patient', statusCode: 400 });
      }
    }

    appointment.status = 'Cancelled';
    await appointment.save();

    res.json({ success: true, message: 'Appointment cancelled successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

module.exports = {
  getBookableDoctors,
  getDoctorSlots,
  bookAppointment,
  getAllAppointments,
  getMyAppointments,
  getAppointment,
  updateStatus,
  cancelAppointment,
};
