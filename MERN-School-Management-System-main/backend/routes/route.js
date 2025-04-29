const express = require('express');
const router = express.Router();
const multer = require('multer');

// Import middlewares
const { protect, teacher, admin } = require('../middleware/authMiddleware.js');

// Import controllers
const {
  registerTeacher,
  getTeacherProfile,
  updateTeacherProfile,
  changePassword
} = require('../controllers/teacherController.js');

const {
  authTeacher,
  checkAuthStatus
} = require('../controllers/authController.js');

const {
  authAdmin,
  getTeacherRequests,
  getTeacherById,
  approveTeacher,
  rejectTeacher,
  registerAdmin,
  adminRegister,
  adminLogIn,
  getAdminDetail
} = require('../controllers/admin-controller.js');

const surveillanceController = require('../controllers/surveillanceController.js');
const calendrierController = require('../controllers/calendrierController.js');
const repartitionController = require('../controllers/repartitionController.js');
const planningController = require('../controllers/planningController.js');

// Multer configuration for file uploads
const upload = multer({ dest: "uploads/" });

/* --------------------------------- Teacher Routes --------------------------------- */
router.post('/teachers/register', registerTeacher);
router.get('/teachers/profile', protect, teacher, getTeacherProfile);
router.put('/teachers/profile', protect, teacher, updateTeacherProfile);
router.put('/teachers/:id/change-password', changePassword);

/* --------------------------------- Auth Routes --------------------------------- */
router.post('/auth/login', authTeacher);
router.get('/auth/status', protect, checkAuthStatus);

/* --------------------------------- Admin Auth & Admin Management --------------------------------- */

// Admin Teachers Requests
router.get('/admin/teachers', getTeacherRequests);
router.get('/admin/teachers/:id', protect, admin, getTeacherById);
router.put('/admin/teachers/:id/approve', approveTeacher);
router.put('/admin/teachers/:id/reject', protect, admin, rejectTeacher);

// Admin Profile
router.post('/AdminReg', adminRegister);
router.post('/AdminLogin', adminLogIn);
router.get('/Admin/:id', getAdminDetail);

/* --------------------------------- Surveillance Routes --------------------------------- */
router.post('/upload-enseignants', upload.single("file"), surveillanceController.uploadEnseignants);
router.get('/enseignants', surveillanceController.getAllSurveillants);
router.delete('/deleteenseignants', surveillanceController.deleteAllSurveillants);
router.post('/enseignantsAdd', surveillanceController.addSurveillant);
router.delete('/deleteenseignants/:id', surveillanceController.deleteSurveillantById);

/* --------------------------------- Calendrier Routes --------------------------------- */
router.post('/upload-calendrier', upload.single("file"), calendrierController.uploadCalendrier);
router.get('/examens', calendrierController.getAllExams);

/* --------------------------------- Répartition Routes --------------------------------- */
router.post('/upload-repartition', upload.single("file"), repartitionController.uploadRepartition);
router.get('/repartitions', repartitionController.getAllRepartitions);

/* --------------------------------- Planning Routes --------------------------------- */
router.get('/check-data', planningController.checkData);
router.post('/generate-schedule', planningController.generateSchedule);
router.get('/surveillance-schedule', planningController.getSurveillanceSchedule);

// Export router
module.exports = router;
