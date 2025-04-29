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

    // Mapping des colonnes selon les noms dans le fichier Excel
    const columnMapping = {
      'Nom': 'Nom',
      'Département': 'Département',
      'Grade': 'Grade',
      'Cours': 'Cours',
      'TD': 'TD',
      'TP': 'TP',
      'coef': 'coef',
      'Surveillance': 'Surveillance'
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
    const surveillants = await Surveillance.find();
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
// Supprimer tous les enseignants
exports.deleteAllSurveillants = async (req, res) => {
  try {
    await Surveillance.deleteMany(); // Supprimer tous les documents
    res.json({
      success: true,
      message: 'Tous les enseignants ont été supprimés avec succès.'
    });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression des enseignants:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
// Supprimer un enseignant par ID
exports.deleteSurveillantById = async (req, res) => {
  const { id } = req.params; // Récupérer l'ID à partir des paramètres
  try {
    const surveillant = await Surveillance.findByIdAndDelete(id); // Supprimer l'enseignant par son ID

    if (!surveillant) {
      return res.status(404).json({
        success: false,
        message: 'Enseignant non trouvé'
      });
    }

    res.json({
      success: true,
      message: `L'enseignant avec l'ID ${id} a été supprimé avec succès.`
    });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de l'enseignant:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
// Ajouter un enseignant manuellement via formulaire
// Dans surveillanceController.js, modifiez votre fonction addSurveillant:

exports.addSurveillant = async (req, res) => {
  try {
    console.log("📝 Ajout d'un enseignant via formulaire...");
    console.log("Données reçues:", req.body);
    
    // Au lieu d'utiliser new Surveillance(), utilisez directement le modèle
    const newSurveillant = {
      Nom: req.body.Nom,
      Département: req.body.Département,
      Grade: req.body.Grade,
      Cours: Number(req.body.Cours) || 0,
      TD: Number(req.body.TD) || 0,
      TP: Number(req.body.TP) || 0,
      coef: Number(req.body.coef) || 1,
      Surveillance: Number(req.body.Surveillance) || 0,
      CodeMatiere: req.body.CodeMatiere || ''
    };

    // Sauvegarder l'enseignant dans la base de données
    const savedSurveillant = await Surveillance.create(newSurveillant);
    console.log("✅ Enseignant ajouté avec succès:", savedSurveillant._id);

    res.status(201).json({
      success: true,
      message: 'Enseignant ajouté avec succès',
      data: savedSurveillant
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout de l'enseignant:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};