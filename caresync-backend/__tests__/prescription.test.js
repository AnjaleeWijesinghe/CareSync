const request = require('supertest');
const express = require('express');
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
const mockPrescription = {
  _id: '6618d7f26d6a5960c6f00001',
  patientId: '6618d7f26d6a5960c6f54321',
  doctorId: '6618d7f26d6a5960c6f12345',
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
  notes: 'Rest well',
  status: 'active',
  createdAt: new Date().toISOString(),
};

Prescription.create = jest.fn().mockResolvedValue(mockPrescription);
Prescription.find = jest.fn().mockReturnValue({
  sort: jest.fn().mockResolvedValue([mockPrescription])
});
Prescription.findById = jest.fn().mockResolvedValue(mockPrescription);
Prescription.findByIdAndDelete = jest.fn().mockResolvedValue(mockPrescription);

const app = express();
app.use(express.json());
app.use('/api/prescriptions', prescriptionRoutes);

describe('Prescription API', () => {
  const samplePrescription = {
    patientId: '6618d7f26d6a5960c6f54321',
    doctorId: '6618d7f26d6a5960c6f12345',
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
    const res = await request(app).get(`/api/prescriptions/${mockPrescription._id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.diagnosis).toBe('Common Cold');
  });

  it('should return 400 for invalid prescription ID format', async () => {
    Prescription.findById.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/prescriptions/invalid-id');
    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
  });

  it('should delete a prescription', async () => {
    const res = await request(app).delete(`/api/prescriptions/${mockPrescription._id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });
});
