const asyncHandler = require('express-async-handler');
const Teacher = require('../models/teacherModel');
const generateToken = require('../utils/generateToken');

// @desc    Auth teacher & get token
// @route   POST /api/auth/login
// @access  Public
const authTeacher = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const teacher = await Teacher.findOne({ email });

  if (!teacher) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (teacher.status !== 'approved') {
    res.status(401);
    throw new Error(
      teacher.status === 'pending'
        ? 'Your account is pending approval'
        : 'Your registration has been rejected'
    );
  }

  if (await teacher.matchPassword(password)) {
    res.json({
      _id: teacher._id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      subject: teacher.subject,
      status: teacher.status,
      isFirstLogin: teacher.isFirstLogin,
      token: generateToken(teacher._id, 'teacher'),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Check auth status
// @route   GET /api/auth/status
// @access  Private
const checkAuthStatus = asyncHandler(async (req, res) => {
  if (req.user) {
    res.json({ 
      isAuthenticated: true, 
      role: req.userRole,
      user: req.user 
    });
  } else {
    res.json({ isAuthenticated: false });
  }
});

module.exports = { authTeacher, checkAuthStatus };
