const Surveillance = require('../models/Surveillance'); // Ajustez le chemin selon votre structure

// Fonction pour équilibrer la charge de surveillance entre les enseignants

exports.balanceSurveillanceLoad = async (schedule) => {
              try {
                // Récupérer tous les enseignants
                const teachers = await Surveillance.find().lean();
                
                // Calculer la charge actuelle par enseignant
                const teacherLoad = {};
                teachers.forEach(teacher => {
                  teacherLoad[teacher.Nom] = {
                    assigned: 0,
                    target: teacher.Surveillance || 0,
                    teacherId: teacher._id.toString()
                  };
                });
                
                // Compter les surveillances assignées
                schedule.forEach(entry => {
                  if (teacherLoad[entry.nom_surveillant]) {
                    if (entry.type === "Surveillance" || entry.type === "Réserve") {
                      teacherLoad[entry.nom_surveillant].assigned++;
                    }
                  }
                });
                
                // Identifier les enseignants surchargés et sous-chargés
                const overloaded = [];
                const underloaded = [];
                
                Object.entries(teacherLoad).forEach(([nom, load]) => {
                  const diff = load.assigned - load.target;
                  
                  if (diff > 0) {
                    overloaded.push({ nom, excess: diff, load });
                  } else if (diff < 0) {
                    underloaded.push({ nom, shortage: -diff, load });
                  }
                });
                
                // Trier par excès/manque décroissant
                overloaded.sort((a, b) => b.excess - a.excess);
                underloaded.sort((a, b) => b.shortage - a.shortage);
                
                console.log(`Enseignants surchargés: ${overloaded.length}, Enseignants sous-chargés: ${underloaded.length}`);
                
                // Si déséquilibre, tenter de réaffecter
                const adjustments = [];
                const sessionMap = {}; // ✨ Déclaration globale avant le if

                
                if (overloaded.length > 0 && underloaded.length > 0) {
                  // Grouper le planning par date/session
                  //const sessionMap = {};
                  
                  schedule.forEach(entry => {
                    const key = `${entry.date}_${entry.session}`;
                    if (!sessionMap[key]) {
                      sessionMap[key] = { surveillants: [], reserves: [] };
                    }
                    
                    if (entry.type === "Surveillance") {
                      sessionMap[key].surveillants.push(entry);
                    } else if (entry.type === "Réserve") {
                      sessionMap[key].reserves.push(entry);
                    }
                  });
                  
                  // Pour chaque enseignant surchargé
                  for (const overTeacher of overloaded) {
                    // Continuer tant qu'il y a un excès et des enseignants sous-chargés
                    while (overTeacher.excess > 0 && underloaded.length > 0) {
                      const underTeacher = underloaded[0];
                      
                      // Chercher une session où l'enseignant surchargé peut être remplacé
                      let swapFound = false;
                      
                      for (const [key, session] of Object.entries(sessionMap)) {
                        // Vérifier si l'enseignant surchargé est présent
                        const overTeacherEntry = [...session.surveillants, ...session.reserves]
                          .find(entry => entry.nom=== overTeacher.nom);
                        
                        if (overTeacherEntry) {
                          // Vérifier si l'enseignant sous-chargé n'est pas déjà dans cette session
                          const underTeacherExists = [...session.surveillants, ...session.reserves]
                            .some(entry => entry.nom=== underTeacher.nom);
                          
                          if (!underTeacherExists) {
                            // Faire l'échange
                            const [date, sessionTime] = key.split('_');
                            
                            adjustments.push({
                              date,
                              session: sessionTime,
                              removed: overTeacher.nom,
                              added: underTeacher.nom,
                              role: overTeacherEntry.type,
                              salle: overTeacherEntry.salle
                            });
                            
                            // Mettre à jour les compteurs
                            overTeacher.excess--;
                            underTeacher.shortage--;
                            
                            // Mettre à jour l'entrée dans le planning
                            overTeacherEntry.nom= underTeacher.nom;
                            
                            swapFound = true;
                            break;
                          }
                        }
                      }
                      
                      // Si aucun échange possible, passer à l'enseignant sous-chargé suivant
                      if (!swapFound || underTeacher.shortage === 0) {
                        // Retirer l'enseignant de la liste s'il n'a plus de manque
                        if (underTeacher.shortage === 0) {
                          underloaded.shift();
                        }
                        
                        // Si plus d'enseignants sous-chargés, sortir
                        if (underloaded.length === 0) break;
                      }
                    }
                    
                    // Si cet enseignant n'a plus d'excès, passer au suivant
                    if (overTeacher.excess === 0) {
                      continue;
                    }
                  }
                }
                
                // Reconstruire le planning après ajustements
                const balancedSchedule = [];
                
                Object.entries(sessionMap).forEach(([key, session]) => {
                  balancedSchedule.push(...session.surveillants, ...session.reserves);
                });
                
                // Trier le planning comme précédemment
                balancedSchedule.sort((a, b) => {
                  if (a.date !== b.date) return a.date.localeCompare(b.date);
                  if (a.session !== b.session) return a.session.localeCompare(b.session);
                  if (a.type !== b.type) return a.type.localeCompare(b.type);
                  return a.nom_surveillant.localeCompare(b.nom_surveillant);
                });
                
                console.log(`✅ Équilibrage terminé: ${adjustments.length} ajustements effectués`);
                
                return {
                  success: true,
                  schedule: balancedSchedule,
                  adjustments
                };
                
              } catch (error) {
                console.error('❌ Erreur lors de l\'équilibrage de la charge de surveillance:', error);
                throw error;
              }
 };
  


// Fonction pour maximiser la continuité des surveillances
exports.optimizeContinuity = async (schedule) => {
    try {
      // Récupérer tous les enseignants
      const teachers = await Surveillance.find().lean();
      
      // Restructurer le planning par enseignant et par date
      const teacherSchedule = {};
      const allDates = new Set();
      
      // Initialiser pour tous les enseignants
      teachers.forEach(teacher => {
        teacherSchedule[teacher.Nom] = {
          dates: new Set(),
          assignments: []
        };
      });
      
      // Remplir avec les affectations existantes
      schedule.forEach(entry => {
        if (teacherSchedule[entry.nom_surveillant]) {
          const dateObj = new Date(entry.date.split(' ').slice(1).join(' '));
          const dateStr = dateObj.toISOString().split('T')[0]; // Format YYYY-MM-DD
          
          teacherSchedule[entry.nom_surveillant].dates.add(dateStr);
          teacherSchedule[entry.nom_surveillant].assignments.push({
            ...entry,
            dateStr
          });
          
          allDates.add(dateStr);
        }
      });
      
      // Convertir en tableau et trier
      const sortedDates = [...allDates].sort();
      
      // Calculer les discontinuités actuelles
      const initialDiscontinuities = {};
      let totalInitialGaps = 0;
      
      Object.entries(teacherSchedule).forEach(([teacher, data]) => {
        const assignedDates = [...data.dates].sort();
        
        if (assignedDates.length > 1) {
          const gaps = [];
          let totalGap = 0;
          
          for (let i = 1; i < assignedDates.length; i++) {
            const prevDate = new Date(assignedDates[i-1]);
            const currDate = new Date(assignedDates[i]);
            
            const diffTime = Math.abs(currDate - prevDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;
            
            if (diffDays > 0) {
              gaps.push({
                from: assignedDates[i-1],
                to: assignedDates[i],
                gap: diffDays
              });
              
              totalGap += diffDays;
            }
          }
          
          if (gaps.length > 0) {
            initialDiscontinuities[teacher] = { gaps, totalGap };
            totalInitialGaps += totalGap;
          }
        }
      });
      
      console.log(`Discontinuités initiales: ${Object.keys(initialDiscontinuities).length} enseignants, ${totalInitialGaps} jours d'écart au total`);
      
      // Identifier les paires d'enseignants qui peuvent échanger pour améliorer la continuité
      const swaps = [];
      
      Object.entries(teacherSchedule).forEach(([teacher1, data1]) => {
        if (data1.dates.size <= 1) return; // Pas assez de jours pour optimiser
        
        Object.entries(teacherSchedule).forEach(([teacher2, data2]) => {
          if (teacher1 === teacher2 || data2.dates.size <= 1) return;
          
          // Pour chaque affectation du premier enseignant
          data1.assignments.forEach(assignment1 => {
            // Pour chaque affectation du second enseignant
            data2.assignments.forEach(assignment2 => {
              // Ne pas échanger des affectations du même jour
              if (assignment1.dateStr === assignment2.dateStr) return;
              
              // Simuler l'échange
              const newTeacher1Dates = new Set([...data1.dates]);
              newTeacher1Dates.delete(assignment1.dateStr);
              newTeacher1Dates.add(assignment2.dateStr);
              
              const newTeacher2Dates = new Set([...data2.dates]);
              newTeacher2Dates.delete(assignment2.dateStr);
              newTeacher2Dates.add(assignment1.dateStr);
              
              // Calculer les nouvelles discontinuités
              const teacher1GapsBefore = calculateGaps([...data1.dates].sort());
              const teacher2GapsBefore = calculateGaps([...data2.dates].sort());
              
              const teacher1GapsAfter = calculateGaps([...newTeacher1Dates].sort());
              const teacher2GapsAfter = calculateGaps([...newTeacher2Dates].sort());
              
              const beforeTotal = teacher1GapsBefore + teacher2GapsBefore;
              const afterTotal = teacher1GapsAfter + teacher2GapsAfter;
              
              // Si l'échange réduit les discontinuités, l'enregistrer
              if (afterTotal < beforeTotal) {
                swaps.push({
                  teacher1,
                  teacher2,
                  assignment1,
                  assignment2,
                  improvement: beforeTotal - afterTotal
                });
              }
            });
          });
        });
      });
      
      // Trier les échanges par amélioration décroissante
      swaps.sort((a, b) => b.improvement - a.improvement);
      
      // Appliquer les meilleurs échanges (éviter les conflits)
      const appliedSwaps = [];
      const swappedAssignments = new Set();
      
      swaps.forEach(swap => {
        const id1 = `${swap.assignment1.date}_${swap.assignment1.session}_${swap.assignment1.nom_surveillant}`;
        const id2 = `${swap.assignment2.date}_${swap.assignment2.session}_${swap.assignment2.nom_surveillant}`;
        
        if (!swappedAssignments.has(id1) && !swappedAssignments.has(id2)) {
          appliedSwaps.push(swap);
          swappedAssignments.add(id1);
          swappedAssignments.add(id2);
        }
      });
      
      // Appliquer les échanges au planning
      appliedSwaps.forEach(swap => {
        // Trouver et modifier les entrées dans le planning
        const entry1 = schedule.find(e => 
          e.date === swap.assignment1.date && 
          e.session === swap.assignment1.session && 
          e.nom=== swap.teacher1 &&
          e.type === swap.assignment1.type
        );
        
        const entry2 = schedule.find(e => 
          e.date === swap.assignment2.date && 
          e.session === swap.assignment2.session && 
          e.nom=== swap.teacher2 &&
          e.type === swap.assignment2.type
        );
        
        if (entry1 && entry2) {
          // Échanger les noms
          [entry1.nom_surveillant, entry2.nom_surveillant] = [entry2.nom_surveillant, entry1.nom_surveillant];
        }
      });
      
      console.log(`✅ Optimisation de la continuité terminée: ${appliedSwaps.length} échanges effectués`);
      
      return {
        success: true,
        schedule,
        swapsApplied: appliedSwaps.length,
        initialDiscontinuities: Object.keys(initialDiscontinuities).length
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'optimisation de la continuité:', error);
      throw error;
    }
};


// Fonction utilitaire pour calculer les écarts dans une séquence de dates
   // Fonction utilitaire pour calculer les écarts dans une séquence de dates
   function calculateGaps(dateArray) {
    if (dateArray.length <= 1) return 0;
    
    let totalGaps = 0;
    
    for (let i = 1; i < dateArray.length; i++) {
      const prevDate = new Date(dateArray[i-1]);
      const currDate = new Date(dateArray[i]);
      
      const diffTime = Math.abs(currDate - prevDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;
      
      if (diffDays > 0) {
        totalGaps += diffDays;
      }
    }
    
    return totalGaps;
}

// Fonction d'évaluation du planning
exports.evaluateSchedule = async (schedule) => {
    const metrics = {
      totalAssignments: schedule.length,
      surveillanceAssignments: 0,
      reserveAssignments: 0,
      roomsWithoutTwoSupervisors: 0,
      teachersWithDiscontinuity: 0,
      daysWithoutReserves: 0
    };
    
    // Structure de données pour l'analyse
    const roomSupervisors = {};
    const teacherDates = {};
    const reservesByDate = {};
    
    schedule.forEach(entry => {
      // Compter par type
      if (entry.type === "Surveillance") {
        metrics.surveillanceAssignments++;
        
        // Compter les surveillants par salle
        const key = `${entry.date}_${entry.session}_${entry.salle}`;
        if (!roomSupervisors[key]) roomSupervisors[key] = [];
        roomSupervisors[key].push(entry.nom_surveillant);
      } else if (entry.type === "Réserve") {
        metrics.reserveAssignments++;
        
        // Compter les réserves par date
        if (!reservesByDate[entry.date]) reservesByDate[entry.date] = [];
        reservesByDate[entry.date].push(entry.nom_surveillant);
      }
      
      // Collecter les dates par enseignant
      if (!teacherDates[entry.nom_surveillant]) teacherDates[entry.nom_surveillant] = new Set();
      
      // Convertir la date en format standard
      const dateObj = new Date(entry.date.split(' ').slice(1).join(' '));
      const dateStr = dateObj.toISOString().split('T')[0]; // Format YYYY-MM-DD
      
      teacherDates[entry.nom_surveillant].add(dateStr);
    });
    
    // Vérifier les salles sans exactement 2 surveillants
    Object.values(roomSupervisors).forEach(supervisors => {
      if (supervisors.length !== 2) {
        metrics.roomsWithoutTwoSupervisors++;
      }
    });
    
    // Vérifier la continuité des jours pour chaque enseignant
    Object.entries(teacherDates).forEach(([teacher, dates]) => {
      const sortedDates = [...dates].sort();
      
      if (sortedDates.length > 1) {
        let hasDiscontinuity = false;
        
        for (let i = 1; i < sortedDates.length; i++) {
          const prevDate = new Date(sortedDates[i-1]);
          const currDate = new Date(sortedDates[i]);
          
          const diffTime = Math.abs(currDate - prevDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays > 1) {
            hasDiscontinuity = true;
            break;
          }
        }
        
        if (hasDiscontinuity) {
          metrics.teachersWithDiscontinuity++;
        }
      }
    });
    
    // Vérifier les jours sans enseignants de réserve
    Object.values(reservesByDate).forEach(reserves => {
      if (reserves.length < 2) {
        metrics.daysWithoutReserves++;
      }
    });
    
    // Calculer un score global de 0 à 100
    const score = calculateScheduleScore(metrics);
    
    return {
      metrics,
      score,
      details: {
        roomSupervisors,
        teacherDates,
        reservesByDate
      }
    };
};

// Fonction utilitaire pour calculer un score de qualité du planning
  // Fonction utilitaire pour calculer un score de qualité du planning
  function calculateScheduleScore(metrics) {
    // Pondération des différents critères
    const weights = {
      roomsWithoutTwoSupervisors: 40,  // Très important
      teachersWithDiscontinuity: 30,    // Important
      daysWithoutReserves: 30           // Important
    };
    
    // Calculer le nombre total de salles
    const totalRooms = metrics.surveillanceAssignments / 2;
    
    // Calculer le nombre total d'enseignants
    const teacherCount = Object.keys(metrics.teacherDates || {}).length;
    
    // Calculer le nombre de jours uniques
    const uniqueDays = Object.keys(metrics.reservesByDate || {}).length;
    
    // Calculer les scores normalisés (0 = parfait, 1 = totalement mauvais)
    const normalizedScores = {
      roomsWithoutTwoSupervisors: totalRooms > 0 ? metrics.roomsWithoutTwoSupervisors / totalRooms : 0,
      teachersWithDiscontinuity: teacherCount > 0 ? metrics.teachersWithDiscontinuity / teacherCount : 0,
      daysWithoutReserves: uniqueDays > 0 ? metrics.daysWithoutReserves / uniqueDays : 0
    };
    
    // Calculer le score pondéré total (0 = pire, 100 = parfait)
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    Object.entries(weights).forEach(([metric, weight]) => {
      totalWeightedScore += (1 - normalizedScores[metric]) * weight;
      totalWeight += weight;
    });
    
    // Normaliser sur 100
    return Math.round((totalWeightedScore / totalWeight) * 100);
  }