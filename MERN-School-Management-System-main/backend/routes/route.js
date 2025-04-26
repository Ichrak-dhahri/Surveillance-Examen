const router = require('express').Router();
const multer = require('multer');
const { adminRegister, adminLogIn, getAdminDetail} = require('../controllers/admin-controller.js');
const { teacherRegister, teacherLogIn, getTeachers, getTeacherDetail, deleteTeachers, deleteTeacher } = require('../controllers/teacher-controller.js');
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
//Routes Manel

// Importer les contrôleurs
const surveillanceController = require('../controllers/surveillanceController');
const calendrierController = require('../controllers/calendrierController');
const repartitionController = require('../controllers/repartitionController');
const planningController = require('../controllers/planningController');
// Configuration de multer pour les téléchargements de fichiers
const upload = multer({ dest: "uploads/" });
// Routes pour la gestion des enseignants/surveillances
router.post("/upload-enseignants", upload.single("file"), surveillanceController.uploadEnseignants);
router.get("/enseignants", surveillanceController.getAllSurveillants);

// Routes pour la gestion du calendrier des examens
router.post("/upload-calendrier", upload.single("file"), calendrierController.uploadCalendrier);
router.get("/examens", calendrierController.getAllExams);

// Routes pour la gestion de la répartition
router.post("/upload-repartition", upload.single("file"), repartitionController.uploadRepartition);
router.get("/repartitions", repartitionController.getAllRepartitions);

// Routes pour la planification et la vérification des données
router.get("/check-data", planningController.checkData);
router.post("/generate-schedule", planningController.generateSchedule);
router.get("/surveillance-schedule", planningController.getSurveillanceSchedule);




module.exports = router;