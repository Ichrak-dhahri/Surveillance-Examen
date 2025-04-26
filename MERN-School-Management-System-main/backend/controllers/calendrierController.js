// controllers/calendrierController.js
const fs = require('fs');
const Calendrier = require('../models/Calendrier');
const schedulingController = require('./schedulingController');

// Importer et traiter le fichier du calendrier des examens
exports.uploadCalendrier = async (req, res) => {
  // Vérifier si le fichier a été correctement uploadé
  if (!req.file) {
    return res.status(400).json({ success: false, error: "Aucun fichier n'a été uploadé" });
  }
  

  const filePath = req.file.path;

  try {
    console.log("📊 Analyse du fichier de calendrier...");
    
    // Utiliser une fonction plus robuste pour lire le contenu Excel
    const xlsx = require('xlsx');
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { raw: false });
    
    console.log("Exemple de données du fichier Excel:", JSON.stringify(data.slice(0, 2), null, 2));
    
    // Mapping des colonnes exactes pour le calendrier
const columnMapping = {
  'date': 'date',
  'seance': 'seance',
  'codematiere': 'CodeMatiere',
  'filiere': 'filiere',
  'specialite': 'specialite'
};


    // Vérifier les en-têtes de colonnes dans le fichier
    if (data.length > 0) {
      console.log("En-têtes détectés:", Object.keys(data[0]));
      
      // Mettre à jour le mapping en fonction des en-têtes réels
      const updatedMapping = {};
      Object.keys(data[0]).forEach(header => {
        const headerLower = header.toLowerCase().trim();
        for (const key in columnMapping) {
          if (headerLower === key || headerLower === key.replace("_", " ")) {
            updatedMapping[header] = columnMapping[key];
          }
        }
      });
      
      console.log("Mapping ajusté:", updatedMapping);
      
      const result = await schedulingController.processExcelFile(filePath, Calendrier, updatedMapping);
      
      res.json({
        success: true,
        message: `${result.rows.length} séances d'examen importées avec succès`,
        columns: result.columns,
        rows: result.rows.slice(0, 3) // Limiter l'affichage pour la réponse
      });
    } else {
      throw new Error("Le fichier Excel ne contient pas de données");
    }
  } catch (error) {
    console.error("❌ Erreur:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    // Supprimer le fichier téléchargé
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

// Récupérer tous les examens du calendrier
exports.getAllExams = async (req, res) => {
  try {
    const examens = await Calendrier.find().lean();
    res.json({
      success: true,
      count: examens.length,
      data: examens
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des examens:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Fonction utilitaire pour lire le contenu Excel
exports.logExcelContent = (filePath) => {
  const xlsx = require('xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);
  console.log("Exemple de données du fichier Excel:", JSON.stringify(data.slice(0, 2), null, 2));
  return data.length;
};