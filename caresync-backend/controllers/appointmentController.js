const { validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');

// POST /api/appointments
const bookAppointment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { doctorId, date, timeSlot, reason } = req.body;

    // Resolve patientId from logged-in user
    const patient = await Patient.findOne({ userId: String(req.user.id) });
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient profile not found. Create one first.', statusCode: 404 });
    }

    // Validate and sanitize date/timeSlot to prevent NoSQL injection
    const parsedDate = new Date(String(date));
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format', statusCode: 400 });
    }
    const safeTimeSlot = String(timeSlot);
    const safeDoctorId = String(doctorId);

    // Conflict detection: same doctor, same date, same time slot, not cancelled
    const dayStart = new Date(parsedDate);
    const dayEnd = new Date(parsedDate);
    dayEnd.setDate(dayEnd.getDate() + 1);

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

    await appointment.populate([
      { path: 'patientId', populate: { path: 'userId', select: 'name email' } },
      { path: 'doctorId', populate: { path: 'userId', select: 'name email' } },
    ]);

    res.status(201).json({ success: true, data: appointment, message: 'Appointment booked successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// GET /api/appointments  (admin)
const getAllAppointments = async (req, res) => {
  try {
    const { doctor, date, status } = req.query;
    const filter = {};
    // Cast to string to prevent NoSQL injection via object values
    if (doctor) filter.doctorId = String(doctor);
    if (status) {
      const allowed = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
      if (allowed.includes(String(status))) filter.status = String(status);
    }
    if (date) {
      const parsedDate = new Date(String(date));
      if (!isNaN(parsedDate.getTime())) {
        const dayStart = new Date(parsedDate);
        const dayEnd = new Date(parsedDate);
        dayEnd.setDate(dayEnd.getDate() + 1);
        filter.date = { $gte: dayStart, $lt: dayEnd };
      }
    }

    const appointments = await Appointment.find(filter)
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } })
      .sort({ date: -1 });

    res.json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// GET /api/appointments/my  (patient)
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

// GET /api/appointments/:id
const getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } });

    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found', statusCode: 404 });
    }

    // Ownership check
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user.id });
      if (!patient || appointment.patientId._id.toString() !== patient._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied', statusCode: 403 });
      }
    }

    res.json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// PATCH /api/appointments/:id/status
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
    // Cast to string and validate against allowlist to prevent injection
    const safeStatus = String(status);
    if (!allowed.includes(safeStatus)) {
      return res.status(400).json({ success: false, error: `Status must be one of: ${allowed.join(', ')}`, statusCode: 400 });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: safeStatus },
      { new: true }
    );
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found', statusCode: 404 });
    }

    res.json({ success: true, data: appointment, message: `Appointment status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// DELETE /api/appointments/:id
const cancelAppointment = async (req, res) => {
  try {
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

module.exports = { bookAppointment, getAllAppointments, getMyAppointments, getAppointment, updateStatus, cancelAppointment };
