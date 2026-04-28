const bcrypt = require('bcryptjs');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const User = require('../models/User');

const readConfigValue = (value, fallback = '') => (value ? String(value).trim() : fallback);
const readEmail = (value, fallback = '') => readConfigValue(value, fallback).toLowerCase();

const ensureUser = async ({ name, email, password, role }) => {
  if (!email || !password) {
    return null;
  }

  if (password.length < 6) {
    console.warn(`Seed skipped for ${email}: password must be at least 6 characters.`);
    return null;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return existing;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const created = await User.create({
    name,
    email,
    passwordHash,
    role,
  });

  console.log(`Seed user ready: ${email}`);
  return created;
};

const ensurePatientProfile = async (user, profile) => {
  if (!user) {
    return;
  }

  const existing = await Patient.findOne({ userId: user._id });
  if (existing) {
    return existing;
  }

  return Patient.create({
    userId: user._id,
    ...profile,
  });
};

const ensureDoctorProfile = async (user, profile) => {
  if (!user) {
    return;
  }

  const existing = await Doctor.findOne({ userId: user._id });
  if (existing) {
    return existing;
  }

  return Doctor.create({
    userId: user._id,
    ...profile,
  });
};

const bootstrapAdmin = async () => {
  const adminConfig = {
    name: readConfigValue(process.env.ADMIN_NAME, 'CareSync Admin'),
    email: readEmail(process.env.ADMIN_EMAIL, 'admin@caresync.local'),
    password: readConfigValue(process.env.ADMIN_PASSWORD, 'Admin@123456'),
    role: 'admin',
  };

  const demoPatientConfig = {
    name: readConfigValue(process.env.DEMO_PATIENT_NAME, 'Amanda Perera'),
    email: readEmail(process.env.DEMO_PATIENT_EMAIL, 'patient@caresync.local'),
    password: readConfigValue(process.env.DEMO_PATIENT_PASSWORD, 'Patient@123456'),
    role: 'patient',
  };

  const doctorSeeds = [
    {
      config: {
        name: readConfigValue(process.env.DEMO_DOCTOR_ONE_NAME, 'Dr. Nimal Perera'),
        email: readEmail(process.env.DEMO_DOCTOR_ONE_EMAIL, 'doctor1@caresync.local'),
        password: readConfigValue(process.env.DEMO_DOCTOR_ONE_PASSWORD, 'Doctor@123456'),
        role: 'doctor',
      },
      profile: {
        specialisation: 'Cardiology',
        qualification: 'MBBS, MD Cardiology',
        experienceYears: 11,
        phone: '+94 71 100 1001',
        availableDays: ['Mon', 'Wed', 'Fri'],
        availableSlots: ['09:00 AM', '10:30 AM', '02:00 PM'],
        consultationFee: 4500,
      },
    },
    {
      config: {
        name: readConfigValue(process.env.DEMO_DOCTOR_TWO_NAME, 'Dr. Sahana Fernando'),
        email: readEmail(process.env.DEMO_DOCTOR_TWO_EMAIL, 'doctor2@caresync.local'),
        password: readConfigValue(process.env.DEMO_DOCTOR_TWO_PASSWORD, 'Doctor@123456'),
        role: 'doctor',
      },
      profile: {
        specialisation: 'Pediatrics',
        qualification: 'MBBS, DCH',
        experienceYears: 8,
        phone: '+94 71 100 1002',
        availableDays: ['Tue', 'Thu', 'Sat'],
        availableSlots: ['08:30 AM', '11:00 AM', '03:30 PM'],
        consultationFee: 4200,
      },
    },
    {
      config: {
        name: readConfigValue(process.env.DEMO_DOCTOR_THREE_NAME, 'Dr. Kavindi Silva'),
        email: readEmail(process.env.DEMO_DOCTOR_THREE_EMAIL, 'doctor3@caresync.local'),
        password: readConfigValue(process.env.DEMO_DOCTOR_THREE_PASSWORD, 'Doctor@123456'),
        role: 'doctor',
      },
      profile: {
        specialisation: 'General Practice',
        qualification: 'MBBS',
        experienceYears: 6,
        phone: '+94 71 100 1003',
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        availableSlots: ['09:30 AM', '12:00 PM', '04:00 PM'],
        consultationFee: 3500,
      },
    },
  ];

  try {
    const adminUser = await ensureUser(adminConfig);
    const patientUser = await ensureUser(demoPatientConfig);

    await ensurePatientProfile(patientUser, {
      dateOfBirth: new Date('1994-08-19'),
      gender: 'Female',
      phone: '+94 77 555 0101',
      address: 'Colombo, Sri Lanka',
      bloodGroup: 'A+',
      allergies: ['Penicillin'],
      emergencyContact: {
        name: 'Ruwan Perera',
        phone: '+94 77 555 0102',
        relation: 'Brother',
      },
    });

    for (const seed of doctorSeeds) {
      const doctorUser = await ensureUser(seed.config);
      await ensureDoctorProfile(doctorUser, seed.profile);
    }

    if (adminUser) {
      console.log(`Admin user ready: ${adminUser.email}`);
    }
  } catch (err) {
    console.error(`User bootstrap failed: ${err.message}`);
  }
};

module.exports = bootstrapAdmin;
