
const mongoose = require('mongoose');

const resultatSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  seance: {
    type: String,
    required: true,
    enum: ['s1', 's2', 's3', 's4']
  },
  salle: {
    type: String,
    required: true
  },
  professeur_surveillant1: {
    type: String,
    required: true
  },
  professeur_surveillant2: {
    type: String,
    required: true
  },
  professeur_reserve: {
    type: String,
    default: "Aucun"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour améliorer les performances de recherche
resultatSchema.index({ date: 1, seance: 1, salle: 1 }, { unique: true });

const Resultat = mongoose.models.Resultat || mongoose.model('Resultat', resultatSchema);

module.exports = Resultat;