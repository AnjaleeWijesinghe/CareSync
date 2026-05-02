const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

const VALID_DAY_CODES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getDayCode = (date) => VALID_DAY_CODES[new Date(date).getDay()];

const buildDayRange = (date) => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return { dayStart, dayEnd };
};

const getDoctorAvailability = async (doctorId, date) => {
  const parsedDate = new Date(String(date));
  if (isNaN(parsedDate.getTime())) {
    const error = new Error('Invalid date format. Use YYYY-MM-DD.');
    error.statusCode = 400;
    throw error;
  }

  const doctor = await Doctor.findOne({ _id: doctorId, isActive: true }).populate('userId', 'name email');
  if (!doctor) {
    const error = new Error('Doctor not found');
    error.statusCode = 404;
    throw error;
  }

  const scheduledDay = getDayCode(parsedDate);
  const worksThatDay = !doctor.availableDays.length || doctor.availableDays.includes(scheduledDay);
  const configuredSlots = worksThatDay ? doctor.availableSlots : [];
  const { dayStart, dayEnd } = buildDayRange(parsedDate);

  const bookedAppointments = await Appointment.find({
    doctorId: doctor._id,
    date: { $gte: dayStart, $lt: dayEnd },
    status: { $ne: 'Cancelled' },
  }).select('timeSlot');

  const bookedSlots = bookedAppointments.map((appointment) => appointment.timeSlot);
  const availableSlots = configuredSlots.filter((slot) => !bookedSlots.includes(slot));

  return {
    date: dayStart.toISOString().split('T')[0],
    scheduledDay,
    doctor,
    allSlots: configuredSlots,
    availableSlots,
    bookedSlots,
  };
};

module.exports = {
  VALID_DAY_CODES,
  getDayCode,
  buildDayRange,
  getDoctorAvailability,
};
