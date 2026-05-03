const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const prescriptionRoutes = require('../routes/prescriptionRoutes');
const Prescription = require('../models/Prescription');

// Mock Auth Middleware
jest.mock('../middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { id: '6618d7f26d6a5960c6f12345', role: 'doctor' };
    next();
  },
  authorise: (...roles) => (req, res, next) => next()
}));

// Mock Prescription Model
jest.mock('../models/Prescription', () => {
  return jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue({ _id: 'mock_id', ...data })
  }));
});
Prescription.find = jest.fn().mockReturnValue({
  sort: jest.fn().mockResolvedValue([{ _id: 'mock_id', patientName: 'John Doe' }])
});
Prescription.findById = jest.fn().mockResolvedValue({ _id: 'mock_id', diagnosis: 'Common Cold' });

const app = express();
app.use(express.json());
app.use('/api/prescriptions', prescriptionRoutes);

describe('Prescription API', () => {
  let prescriptionId;

  const samplePrescription = {
    patientId: '6618d7f26d6a5960c6f54321',
    patientName: 'John Doe',
    doctorName: 'Dr. Smith',
    diagnosis: 'Common Cold',
    medications: [
      {
        medicineName: 'Paracetamol',
        dosage: '500mg',
        frequency: '3 times a day',
        duration: '5 days',
        instructions: 'After meals'
      }
    ],
    notes: 'Rest well'
  };

  it('should create a new prescription', async () => {
    const res = await request(app)
      .post('/api/prescriptions')
      .send(samplePrescription);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.patientName).toBe('John Doe');
    prescriptionId = res.body.data._id;
  });

  it('should get all prescriptions', async () => {
    const res = await request(app).get('/api/prescriptions');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should get prescriptions by patient ID', async () => {
    const res = await request(app).get(`/api/prescriptions/patient/${samplePrescription.patientId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it('should get a single prescription by ID', async () => {
    const res = await request(app).get(`/api/prescriptions/${prescriptionId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.diagnosis).toBe('Common Cold');
  });
});
