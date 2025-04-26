// models/Calendrier.js
const mongoose = require("mongoose");

const calendrierSchema = new mongoose.Schema({
  date: {
    type: String,  // Correction ici: "Date" avec D majuscule
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
  specialite: {
    type: String,
    default: ""
  },
  filiere: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Calendrier', calendrierSchema);