// models/Calendrier.js
const mongoose = require("mongoose");

const calendrierSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  seance: {
    type: String, 
    required: true
  },
  CodeMatiere: {
    type: String,
    required: true
  },
  filiere: {
    type: String,
    required: true
  },
  specialite: {
    type: String,
    default: ""  // Champ optionnel, valeur par défaut vide
  }
});

module.exports = mongoose.model('Calendrier', calendrierSchema);