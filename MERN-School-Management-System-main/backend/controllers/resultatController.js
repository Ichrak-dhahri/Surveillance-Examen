const Resultat = require('../models/Resultat'); // Assurez-vous que le chemin est correct

// Récupérer tous les résultats - avec options de filtrage
exports.getAllResultats = async (req, res) => {
  try {
    // Options de filtrage
    const filter = {};
    
    // Filtrer par date
    if (req.query.date) {
      filter.date = req.query.date;
    }
    
    // Filtrer par séance
    if (req.query.seance) {
      filter.seance = req.query.seance;
    }
    
    // Filtrer par salle
    if (req.query.salle) {
      filter.salle = req.query.salle;
    }
    
    // Filtrer par nom d'enseignant (recherche dans tous les champs professeur)
    if (req.query.professeur) {
      const nomProf = req.query.professeur;
      filter.$or = [
        { professeur_surveillant1: { $regex: nomProf, $options: 'i' } },
        { professeur_surveillant2: { $regex: nomProf, $options: 'i' } },
        { professeur_reserve: { $regex: nomProf, $options: 'i' } }
      ];
    }
    
    // Tri des résultats
    const sort = {};
    if (req.query.sort) {
      const sortField = req.query.sort;
      const sortOrder = req.query.order === 'desc' ? -1 : 1;
      sort[sortField] = sortOrder;
    } else {
      // Tri par défaut: d'abord par date, puis par séance, puis par salle
      sort.date = 1;
      sort.seance = 1;
      sort.salle = 1;
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Exécuter la requête
    const resultats = await Resultat.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    // Compter le nombre total de résultats (pour la pagination)
    const total = await Resultat.countDocuments(filter);
    
    // Renvoyer les résultats avec des métadonnées de pagination
    return res.status(200).json({
      success: true,
      count: resultats.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: resultats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des résultats:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des résultats',
      error: error.message
    });
  }
};

// Récupérer des statistiques sur les affectations
exports.getResultatsStats = async (req, res) => {
  try {
    // Statistiques des professeurs: combien de surveillances chacun
    const statsProfesseurs = await Resultat.aggregate([
      // Décomposer pour compter chaque prof séparément
      { $facet: {
        "surveillant1": [
          { $group: { _id: "$professeur_surveillant1", count: { $sum: 1 } } },
          { $match: { _id: { $ne: "À ASSIGNER" } } },
          { $sort: { count: -1 } }
        ],
        "surveillant2": [
          { $group: { _id: "$professeur_surveillant2", count: { $sum: 1 } } },
          { $match: { _id: { $ne: "À ASSIGNER" } } },
          { $sort: { count: -1 } }
        ],
        "reserve": [
          { $match: { professeur_reserve: { $ne: "Aucun" } } },
          { $group: { _id: "$professeur_reserve", count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]
      }}
    ]);
    
    // Combiner les résultats pour avoir un total par prof
    const professeurs = {};
    
    // Fonction pour agréger les comptages
    const aggregateCounts = (array, type) => {
      array.forEach(item => {
        const nom = item._id;
        if (!professeurs[nom]) {
          professeurs[nom] = { total: 0, surveillances: 0, reserves: 0 };
        }
        professeurs[nom].total += item.count;
        if (type === 'surveillance') {
          professeurs[nom].surveillances += item.count;
        } else {
          professeurs[nom].reserves += item.count;
        }
      });
    };
    
    // Agréger les comptages
    aggregateCounts(statsProfesseurs[0].surveillant1, 'surveillance');
    aggregateCounts(statsProfesseurs[0].surveillant2, 'surveillance');
    aggregateCounts(statsProfesseurs[0].reserve, 'reserve');
    
    // Convertir en tableau pour le tri
    const profsArray = Object.entries(professeurs).map(([nom, stats]) => ({
      nom,
      total: stats.total,
      surveillances: stats.surveillances,
      reserves: stats.reserves
    }));
    
    // Trier par total décroissant
    profsArray.sort((a, b) => b.total - a.total);
    
    // Statistiques globales
    const statsGlobales = {
      total_affectations: await Resultat.countDocuments(),
      salles_distinctes: (await Resultat.distinct('salle')).length,
      dates_distinctes: (await Resultat.distinct('date')).length,
      professeurs_distincts: profsArray.length,
      postes_a_assigner: await Resultat.countDocuments({
        $or: [
          { professeur_surveillant1: "À ASSIGNER" },
          { professeur_surveillant2: "À ASSIGNER" }
        ]
      })
    };
    
    return res.status(200).json({
      success: true,
      stats_globales: statsGlobales,
      stats_professeurs: profsArray
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};