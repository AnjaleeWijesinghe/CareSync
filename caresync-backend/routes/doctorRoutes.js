const express = require('express');
const { protect, authorise } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  createDoctor, getAllDoctors, getDoctor, updateDoctor, deleteDoctor, getDoctorSlots,
} = require('../controllers/doctorController');

const router = express.Router();

router.post('/', protect, authorise('admin'), upload.single('photo'), createDoctor);
router.get('/', getAllDoctors); // public
router.get('/:id/slots', protect, getDoctorSlots);
router.get('/:id', getDoctor);
router.put('/:id', protect, authorise('admin'), upload.single('photo'), updateDoctor);
router.delete('/:id', protect, authorise('admin'), deleteDoctor);

module.exports = router;
