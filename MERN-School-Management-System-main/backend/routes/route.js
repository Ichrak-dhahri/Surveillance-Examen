const router = require('express').Router();
const multer = require('multer');
const upload = multer({ dest: "uploads/" });
const xlsx = require('xlsx');
const { adminRegister, adminLogIn, getAdminDetail} = require('../controllers/admin-controller.js');

const { teacherRegister, teacherLogIn, getTeachers, getTeacherDetail, deleteTeachers, deleteTeacher } = require('../controllers/teacher-controller.js');
const surveillanceController = require('../controllers/surveillanceController');
// Admin
router.post('/AdminReg', adminRegister);
router.post('/AdminLogin', adminLogIn);
router.get("/Admin/:id", getAdminDetail)

// Teacher
router.post('/TeacherReg', teacherRegister);
router.post('/TeacherLogin', teacherLogIn)
router.get("/Teachers/:id", getTeachers)
router.get("/Teacher/:id", getTeacherDetail)
router.delete("/Teachers/:id", deleteTeachers)
router.delete("/Teacher/:id", deleteTeacher)


// Routes pour la gestion des enseignants/surveillances
router.post("/upload-enseignants", upload.single("file"), surveillanceController.uploadEnseignants);
router.get("/enseignants", surveillanceController.getAllSurveillants);




module.exports = router;