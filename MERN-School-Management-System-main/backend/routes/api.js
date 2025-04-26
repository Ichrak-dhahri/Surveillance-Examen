// routes/api.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const xlsx = require('xlsx');
const schedulingController = require('../controllers/schedulingController');
const Surveillance = require('../models/Surveillance');
const Calendrier = require('../models/Calendrier');
const Repartition = require('../models/Repartition');

// Configuration de multer pour les téléchargements de fichiers
const upload = multer({ dest: "uploads/" });

// Fonction pour vérifier les données avant l'importation
const logExcelContent = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);
  console.log("Exemple de données du fichier Excel:", JSON.stringify(data.slice(0, 2), null, 2));
  return data.length;
};

// Route pour télécharger le fichier des enseignants
router.post("/upload-enseignants", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;
  
  try {
    console.log("📊 Analyse du fichier d'enseignants...");
    const rowCount = logExcelContent(filePath);
    console.log(`Le fichier contient ${rowCount} lignes de données`);
    
    // Mapping des colonnes exactes pour les enseignants
    const columnMapping = {
      'nom et prenom': 'Nom',
      'departement': 'Département',
      'grade': 'Grade',
      'cours': 'Cours',
      'td': 'Td',
      'tp': 'Tp',
      'coef': 'coef',
      'nombre de seance de surveillance': 'Surveillance'
    };
    
    const result = await schedulingController.processExcelFile(filePath, Surveillance, columnMapping);
    
    res.json({
      success: true,
      message: `${result.rows.length} enseignants importés avec succès`,
      columns: result.columns,
      rows: result.rows.slice(0, 3) // Limiter l'affichage pour la réponse
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    // Supprimer le fichier téléchargé
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

// Route pour télécharger le fichier du calendrier des examens
router.post("/upload-calendrier", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;
  
  try {
    console.log("📊 Analyse du fichier de calendrier...");
    const rowCount = logExcelContent(filePath);
    console.log(`Le fichier contient ${rowCount} lignes de données`);
    
    // Mapping des colonnes exactes pour le calendrier
    const columnMapping = {
      'date': 'date',
      'seance': 'seance',
      'codematiere': 'CodeMatiere',
      'filiere': 'filiere',
      'specialite': 'specialite'
    };
    
    const result = await schedulingController.processExcelFile(filePath, Calendrier, columnMapping);
    
    res.json({
      success: true,
      message: `${result.rows.length} séances d'examen importées avec succès`,
      columns: result.columns,
      rows: result.rows.slice(0, 3) // Limiter l'affichage pour la réponse
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    // Supprimer le fichier téléchargé
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

// Route pour télécharger le fichier de répartition
// Pour la route d'importation de répartition
router.post("/upload-repartition", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;
  
  try {
    console.log("📊 Analyse du fichier de répartition...");
    const rowCount = logExcelContent(filePath);
    console.log(`Le fichier contient ${rowCount} lignes de données`);
    
    // Mapping des colonnes exactes pour la répartition
    const columnMapping = {
      'salle': 'salle',
      'groupe': 'groupe'
    };
    
    const result = await schedulingController.processExcelFile(filePath, Repartition, columnMapping);
    
    // Ensuite, associez les matières et enseignants aux salles et groupes
    // Cette partie dépend de votre logique métier
    await schedulingController.associateTeachersAndCourses();
    
    res.json({
      success: true,
      message: `${result.rows.length} répartitions importées avec succès`,
      columns: result.columns,
      rows: result.rows.slice(0, 3)
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

// Route pour vérifier le contenu actuel des collections
router.get("/check-data", async (req, res) => {
  try {
    const surveillances = await Surveillance.find().limit(5).lean();
    const calendriers = await Calendrier.find().limit(5).lean();
    const repartitions = await Repartition.find().limit(5).lean();
    
    res.json({
      success: true,
      data: {
        surveillances: {
          count: await Surveillance.countDocuments(),
          examples: surveillances
        },
        calendriers: {
          count: await Calendrier.countDocuments(),
          examples: calendriers
        },
        repartitions: {
          count: await Repartition.countDocuments(),
          examples: repartitions
        }
      }
    });
  } catch (error) {
    console.error("❌ Erreur lors de la vérification des données:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route pour générer le planning de surveillance
router.post("/generate-schedule", async (req, res) => {
  try {
    const schedule = await schedulingController.generateSurveillanceSchedule();
    res.json({
      success: true,
      schedule: schedule
    });
  } catch (error) {
    console.error("❌ Erreur lors de la génération du planning:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route pour consulter le planning actuel
router.get("/surveillance-schedule", async (req, res) => {
  try {
    const schedule = await schedulingController.generateSurveillanceSchedule();
    res.json({
      success: true,
      schedule: schedule
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du planning:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;