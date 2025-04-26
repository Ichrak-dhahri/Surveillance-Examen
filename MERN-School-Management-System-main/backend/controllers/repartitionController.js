// controllers/repartitionController.js
const fs = require('fs');
const Repartition = require('../models/Repartition');
const schedulingController = require('./schedulingController');

// Importer et traiter le fichier de répartition
exports.uploadRepartition = async (req, res) => {
  const filePath = req.file.path;
  try {
    console.log("📊 Analyse du fichier de répartition...");
    const rowCount = this.logExcelContent(filePath);
    console.log(`Le fichier contient ${rowCount} lignes de données`);

    // Mapping des colonnes exactes pour la répartition
    const columnMapping = {
      'salle': 'salle',
      'groupe': 'groupe'
    };

    const result = await schedulingController.processExcelFile(filePath, Repartition, columnMapping);

    // Ensuite, associez les matières et enseignants aux salles et groupes
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
};

// Récupérer toutes les répartitions
exports.getAllRepartitions = async (req, res) => {
  try {
    const repartitions = await Repartition.find().lean();
    res.json({
      success: true,
      count: repartitions.length,
      data: repartitions
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des répartitions:", error);
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