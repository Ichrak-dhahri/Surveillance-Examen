// models/Surveillance.js
const mongoose = require("mongoose");

const surveillanceSchema = new mongoose.Schema({
  nom_et_prenom: String,
  departement: String,
  grade: String,
  cours: Number,
  td: Number,
  tp: Number,
  coef: Number,
  nombre_de_seance_de_surveillance: Number,
  CodeMatiere: [String] // Pour stocker les matières enseignées par cet enseignant
});

module.exports = mongoose.model('Surveillance', surveillanceSchema);