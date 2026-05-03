const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Prescription = require('../models/Prescription');

const STATUS_TEMPLATE = {
  Pending: 0,
  Confirmed: 0,
  Completed: 0,
  Cancelled: 0,
};

const buildDayWindow = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

const getOverview = async (req, res) => {
  try {
    const { start, end } = buildDayWindow();
    const statusSummaryPromise = Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const [
      activePatients,
      inactivePatients,
      doctorsAvailable,
      patientsWithEmergencyContact,
      totalAppointments,
      todayAppointments,
      upcomingAppointmentsCount,
      statusSummary,
      recentPatients,
      upcomingAppointments,
      totalPrescriptions,
    ] = await Promise.all([
      Patient.countDocuments({ isActive: true }),
      Patient.countDocuments({ isActive: false }),
      Doctor.countDocuments({ isActive: true }),
      Patient.countDocuments({
        isActive: true,
        'emergencyContact.name': { $exists: true, $ne: '' },
      }),
      Appointment.countDocuments(),
      Appointment.countDocuments({
        date: { $gte: start, $lt: end },
        status: { $ne: 'Cancelled' },
      }),
      Appointment.countDocuments({
        date: { $gte: start },
        status: { $in: ['Pending', 'Confirmed'] },
      }),
      statusSummaryPromise,
      Patient.find({ isActive: true })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(4),
      Appointment.find({
        date: { $gte: start },
        status: { $in: ['Pending', 'Confirmed'] },
      })
        .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } })
        .sort({ date: 1, timeSlot: 1 })
        .limit(5),
      Prescription.countDocuments(),
    ]);

    const appointmentStatus = statusSummary.reduce((summary, item) => {
      if (item?._id && Object.prototype.hasOwnProperty.call(summary, item._id)) {
        summary[item._id] = item.count;
      }
      return summary;
    }, { ...STATUS_TEMPLATE });

    res.json({
      success: true,
      data: {
        summary: {
          activePatients,
          inactivePatients,
          doctorsAvailable,
          totalAppointments,
          todayAppointments,
          upcomingAppointments: upcomingAppointmentsCount,
          totalPrescriptions,
        },
        patientSignals: {
          withEmergencyContact: patientsWithEmergencyContact,
          missingEmergencyContact: Math.max(activePatients - patientsWithEmergencyContact, 0),
        },
        appointmentStatus,
        recentPatients,
        upcomingAppointments,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

module.exports = { getOverview };
