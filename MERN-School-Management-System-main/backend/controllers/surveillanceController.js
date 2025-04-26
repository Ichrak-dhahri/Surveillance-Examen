// controllers/surveillanceController.js
const fs = require('fs');
const Surveillance = require('../models/Surveillance');
const schedulingController = require('./schedulingController');

// Importer et traiter le fichier des enseignants
exports.uploadEnseignants = async (req, res) => {
  const filePath = req.file.path;
  try {
    console.log("📊 Analyse du fichier d'enseignants...");
    const rowCount = this.logExcelContent(filePath);
    console.log(`Le fichier contient ${rowCount} lignes de données`);

    // Mapping des colonnes exactes pour les enseignants
    const columnMapping = {
      'nom et prenom': 'nom_et_prenom',
      'departement': 'departement',
      'grade': 'grade',
      'cours': 'cours',
      'td': 'td',
      'tp': 'tp',
      'coef': 'coef',
      'nombre de seance de surveillance': 'nombre_de_seance_de_surveillance'
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
};

// Récupérer tous les enseignants
exports.getAllSurveillants = async (req, res) => {
  try {
    const surveillants = await Surveillance.find().lean();
    res.json({
      success: true,
      count: surveillants.length,
      data: surveillants
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des enseignants:", error);
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