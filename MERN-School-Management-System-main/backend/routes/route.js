const express = require('express');
const router = express.Router();
const multer = require('multer');

// Import middlewares
const { protect, teacher, admin } = require('../middleware/authMiddleware.js');

const surveillanceController = require('../controllers/surveillanceController');
const calendrierController = require('../controllers/calendrierController');
const repartitionController = require('../controllers/repartitionController');
const planningController = require('../controllers/planningController');
const schedulingController = require('../controllers/schedulingController');
const resultatController = require('../controllers/resultatController');

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
router.get('/admin/teachers/:id',getTeacherById);
router.put('/admin/teachers/:id/approve', approveTeacher);
router.put('/admin/teachers/:id/reject',  rejectTeacher);

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
router.get("/check-data", planningController.checkData);


/* ---------------------------------  Routes Planification --------------------------------- */
router.get("/check-data", planningController.checkData);

// Nouvelle Route: Génération directe via module d'algorithme

router.post('/generer-planning', async (req, res) => {
  try {
    // Appel à l'algorithme principal pour générer un planning
    const result = await schedulingController.generateSurveillanceSchedule();

    // Préparer un message selon les statistiques d'optimisation
    let statsMessage = "Planning généré avec succès.";
    if (result.stats && result.stats.optimizationStats) {
      statsMessage += ` Optimisations effectuées: ${result.stats.optimizationStats.changesCount}`;
    }

    // Retourner la réponse avec le planning et les statistiques
    res.status(200).json({
      success: true,
      message: statsMessage,
      data: result
    });
  } catch (error) {
    // Gérer les erreurs éventuelles
    res.status(500).json({
      success: false,
      message: "Erreur lors de la génération du planning",
      error: error.message
    });
  }
});

// Nouvelle Route: Export du planning
router.get("/export-schedule", schedulingController.exportSchedule);

//CRUD
router.get('/', resultatController.getAllResultats);

// GET /api/resultats/stats - Obtenir des statistiques sur les affectations
router.get('/stats',resultatController.getResultatsStats);

// Export router
module.exports = router;
