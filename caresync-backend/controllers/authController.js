const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// POST /api/auth/register
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password, role } = req.body;

  try {
    // Cast to string to prevent NoSQL injection via object values
    const safeEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: safeEmail });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered', statusCode: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({ name: String(name).trim(), email: safeEmail, passwordHash, role });

    const userResponse = { _id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt };
    res.status(201).json({ success: true, data: userResponse, message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Cast to string to prevent NoSQL injection via object values
    const safeEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: safeEmail });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials', statusCode: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials', statusCode: 401 });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: { token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } },
      message: 'Login successful',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found', statusCode: 404 });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, statusCode: 500 });
  }
};

// POST /api/auth/logout
const logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully (client must discard token)' });
};

module.exports = { register, login, getMe, logout };
