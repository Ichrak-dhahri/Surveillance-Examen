// models/Repartition.js
const mongoose = require("mongoose");

const repartitionSchema = new mongoose.Schema({
  salle: {
    type: String,
    required: true
  },
  groupe: {
    type: String,
    required: true
  },
  // Ces champs seront remplis automatiquement par votre logique d'association
  enseignant: {
    type: String,
    required: false  // Maintenant optionnel
  },
  CodeMatiere: {
    type: String,
    required: false  // Maintenant optionnel
  }
});

module.exports = mongoose.model('Repartition', repartitionSchema);