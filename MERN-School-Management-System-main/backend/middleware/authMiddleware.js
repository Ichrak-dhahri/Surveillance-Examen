const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Teacher = require('../models/teacherModel');
const Admin = require('../models/adminSchema');

// Protect routes - verify token
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.role === 'teacher') {
        req.user = await Teacher.findById(decoded.id).select('-password');
      } else if (decoded.role === 'admin') {
        req.user = await Admin.findById(decoded.id).select('-password');
      }

      req.userRole = decoded.role;
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Admin middleware
const admin = (req, res, next) => {
  if (req.userRole && req.userRole === 'admin') {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
};

// Teacher middleware
const teacher = (req, res, next) => {
  if (req.userRole && req.userRole === 'teacher' && req.user.status === 'approved') {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as a teacher or account not approved');
  }
};

module.exports = { protect, admin, teacher };
