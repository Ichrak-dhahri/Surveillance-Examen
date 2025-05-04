// controllers/planningController.js
const schedulingController = require('./schedulingController');
const Surveillance = require('../models/Surveillance');
const Calendrier = require('../models/Calendrier');
const Repartition = require('../models/Repartition');
const scheduleOptimizer = require('../utils/scheduleOptimizer');

// Vérifier le contenu actuel des collections
exports.checkData = async (req, res) => {
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
};