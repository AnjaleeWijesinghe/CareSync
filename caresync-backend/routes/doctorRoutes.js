const express = require('express');
const { protect, authorise } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { cloudinaryUpload } = require('../middleware/uploadMiddleware');
const {
  getAllDoctors,
  getDoctor,
  getMyDoctorProfile,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorSlots,
} = require('../controllers/doctorController');

const router = express.Router();

router.get('/me', protect, authorise('doctor'), getMyDoctorProfile);
router.get('/:doctorId/slots', protect, getDoctorSlots);
router.post('/', protect, authorise('admin'), upload.single('photo'), cloudinaryUpload, createDoctor);
router.get('/', protect, getAllDoctors);
router.get('/:id', protect, getDoctor);
router.put('/:id', protect, authorise('admin', 'doctor'), upload.single('photo'), cloudinaryUpload, updateDoctor);
router.delete('/:id', protect, authorise('admin'), deleteDoctor);

module.exports = router;
