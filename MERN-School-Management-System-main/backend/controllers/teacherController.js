const asyncHandler = require('express-async-handler');
const Teacher = require('../models/teacherModel');
const generateToken = require('../utils/generateToken');

// @desc    Register a new teacher (pre-registration)
// @route   POST /api/teachers
// @access  Public
const registerTeacher = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, subject, phone, qualifications } = req.body;

  const teacherExists = await Teacher.findOne({ email });

  if (teacherExists) {
    res.status(400);
    throw new Error('Teacher already exists');
  }

  // Create temporary password that will be replaced by admin
  // This password won't be used by the teacher
  const tempPassword = Math.random().toString(36).slice(-8);

  const teacher = await Teacher.create({
    firstName,
    lastName,
    email,
    password: tempPassword, // This will be replaced when admin approves
    subject,
    phone,
    qualifications,
  });

  if (teacher) {
    res.status(201).json({
      message: 'Registration request submitted successfully. You will be notified by email when your account is approved.',
    });
  } else {
    res.status(400);
    throw new Error('Invalid teacher data');
  }
});

// @desc    Get teacher profile
// @route   GET /api/teachers/profile
// @access  Private/Teacher
const getTeacherProfile = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.user._id).select('-password');

  if (teacher) {
    res.json(teacher);
  } else {
    res.status(404);
    throw new Error('Teacher not found');
  }
});

// @desc    Update teacher profile
// @route   PUT /api/teachers/profile
// @access  Private/Teacher
const updateTeacherProfile = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.user._id);

  if (teacher) {
    teacher.firstName = req.body.firstName || teacher.firstName;
    teacher.lastName = req.body.lastName || teacher.lastName;
    teacher.email = req.body.email || teacher.email;
    teacher.subject = req.body.subject || teacher.subject;
    teacher.phone = req.body.phone || teacher.phone;
    teacher.qualifications = req.body.qualifications || teacher.qualifications;

    if (req.body.password) {
      teacher.password = req.body.password;
      teacher.isFirstLogin = false;
    }

    const updatedTeacher = await teacher.save();

    res.json({
      _id: updatedTeacher._id,
      firstName: updatedTeacher.firstName,
      lastName: updatedTeacher.lastName,
      email: updatedTeacher.email,
      subject: updatedTeacher.subject,
      status: updatedTeacher.status,
      isFirstLogin: updatedTeacher.isFirstLogin,
      token: generateToken(updatedTeacher._id, 'teacher'),
    });
  } else {
    res.status(404);
    throw new Error('Teacher not found');
  }
});

// @desc    Change password on first login
// @route   PUT /api/teachers/change-password
// @access  Private/Teacher
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get the teacher ID from the URL params
  const { id } = req.params;

  const teacher = await Teacher.findById(id);

  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }

  // Check if current password matches
  const isMatch = await teacher.matchPassword(currentPassword);

  if (!isMatch) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }

  teacher.password = newPassword;
  teacher.isFirstLogin = false;
  await teacher.save();

  res.json({ message: 'Password updated successfully' });
});

module.exports = { 
  registerTeacher, 
  getTeacherProfile, 
  updateTeacherProfile,
  changePassword
};
