// models/Surveillance.js
const mongoose = require("mongoose");

const surveillanceSchema = new mongoose.Schema({
  Nom: String,
  Département: String,
  Grade: String, 
  Cours: Number,
  TD: Number,
  TP: Number,
  coef: Number,
  Surveillance: Number,
  CodeMatiere: [String] // Pour stocker les matières enseignées par cet enseignant
});

module.exports = mongoose.model('Surveillance', surveillanceSchema);