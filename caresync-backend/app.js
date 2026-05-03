require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { authLimiter, apiLimiter } = require('./middleware/rateLimitMiddleware');
const bootstrapAdmin = require('./services/adminBootstrap');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');

const app = express();

// Initialize backing services on cold start.
connectDB().then(() => bootstrapAdmin());

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiLimiter);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/records', medicalRecordRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/audit-logs', auditLogRoutes);

app.get('/', (req, res) => {
  res.json({ success: true, message: 'CareSync API is running' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found', statusCode: 404 });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    statusCode: err.statusCode || 500,
  });
});

module.exports = app;
