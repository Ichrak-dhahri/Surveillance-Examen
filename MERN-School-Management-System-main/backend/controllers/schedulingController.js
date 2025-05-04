// controllers/schedulingController.js
const Calendrier = require('../models/Calendrier');
const Surveillance = require('../models/Surveillance');
const Repartition = require('../models/Repartition');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');


// Traitement des fichiers Excel
exports.processExcelFile = async (filePath, Model, columnMapping) => {
  const xlsx = require("xlsx");
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const allRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false });
  const headerRow = allRows[0];

  const dataRows = allRows.slice(1).map(row => {
    const item = {};

    headerRow.forEach((header, index) => {
      if (!header) return;

      const cleanedHeader = header.trim();
      const mappingKey = Object.keys(columnMapping).find(
        key => key.toLowerCase() === cleanedHeader.toLowerCase()
      );
      const schemaField = columnMapping[mappingKey] || cleanedHeader.replace(/ /g, '_');

      const value = row[index];

      // Gestion spéciale des dates Excel (numériques)
      if (schemaField === 'date') {
        if (typeof value === 'number') {
          item[schemaField] = new Date((value - 25569) * 86400 * 1000); // Excel -> JS Date
        } else if (typeof value === 'string') {
          item[schemaField] = new Date(value);
        }
      } else {
        item[schemaField] = value !== undefined ? value : "";
      }
    });

    return item;
  });

  // Supprimer les documents existants avant insertion
  await Model.deleteMany({});

  const validRows = dataRows.filter(row => Object.values(row).some(v => v !== ""));

  console.log(`Données à insérer pour ${Model.modelName}:`, JSON.stringify(validRows.slice(0, 2), null, 2));

  if (validRows.length > 0) {
    await Model.insertMany(validRows);
    console.log(`✅ ${validRows.length} enregistrements importés avec succès dans ${Model.modelName}`);
  }

  return {
    columns: headerRow,
    rows: validRows
  };
};

// Mettre à jour les matières des enseignants basé sur le fichier de répartition
exports.updateTeacherCourses = async () => {
  try {
    // Récupérer toutes les répartitions
    const repartitions = await Repartition.find().lean();
    
    if (repartitions.length === 0) {
      console.log("⚠️ Aucune répartition trouvée dans la base de données");
      return false;
    }
    
    console.log(`Nombre de répartitions trouvées: ${repartitions.length}`);
    
    // Regrouper les codes de matière par enseignant
    const coursesByTeacher = {};
    
    repartitions.forEach(rep => {
      if (rep.enseignant && rep.CodeMatiere) {
        if (!coursesByTeacher[rep.enseignant]) {
          coursesByTeacher[rep.enseignant] = [];
        }
        if (!coursesByTeacher[rep.enseignant].includes(rep.CodeMatiere)) {
          coursesByTeacher[rep.enseignant].push(rep.CodeMatiere);
        }
      }
    });
    
    console.log("Répartition des cours par enseignant:", JSON.stringify(coursesByTeacher, null, 2));
    
    // Mettre à jour chaque enseignant avec ses matières
    for (const [teacherName, courses] of Object.entries(coursesByTeacher)) {
      const result = await Surveillance.updateOne(
        { Nom: teacherName },
        { $set: { CodeMatiere: courses } }
      );
      
      console.log(`Mise à jour pour ${teacherName}: ${JSON.stringify(result)}`);
    }
    
    console.log('✅ Cours des enseignants mis à jour avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des cours des enseignants:', error);
    throw error;
  }
};

// Association des enseignants et des cours
exports.associateTeachersAndCourses = async () => {
  try {
    // 1. Récupérer toutes les répartitions, calendriers et surveillances
    const repartitions = await Repartition.find().lean();
    const calendriers = await Calendrier.find().lean();
    const surveillances = await Surveillance.find().lean();
    
    // 2. Pour chaque répartition, essayez de trouver un cours/matière correspondant
    for (const repartition of repartitions) {
      // La logique de correspondance dépend de vos données
      // Par exemple, si groupe dans répartition correspond à filière dans calendrier
      const matchingCours = calendriers.find(cal => 
        cal.filiere === repartition.groupe || 
        (cal.specialite && cal.specialite === repartition.groupe)
      );
      
      if (matchingCours) {
        // 3. Si on trouve un cours correspondant, mettre à jour la répartition avec le code matière
        await Repartition.updateOne(
          { _id: repartition._id },
          { $set: { CodeMatiere: matchingCours.CodeMatiere } }
        );
        
        // 4. Essayer de trouver un enseignant pour cette matière
        const matchingEnseignant = surveillances.find(surv => 
          surv.CodeMatiere && 
          surv.CodeMatiere.includes(matchingCours.CodeMatiere)
        );
        
        if (matchingEnseignant) {
          // 5. Si on trouve un enseignant, mettre à jour la répartition
          await Repartition.updateOne(
            { _id: repartition._id },
            { $set: { enseignant: matchingEnseignant.Nom } }
          );
        }
      }
    }
    
    console.log('✅ Association des enseignants et matières terminée');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'association des enseignants et matières:', error);
    throw error;
  }
};
// MODIFICATION 4: Améliorer la continuité des surveillances par séance (ligne ~233)
// Algorithme amélioré d'optimisation des surveillances d'examens

// Fonction d'optimisation des surveillances selon l'ordre séquentiel des séances
exports.optimizeTeacherSchedule = (teacherAssignments, allDates) => {
  // Organiser les dates chronologiquement
  const sortedDates = [...allDates].sort();
  
  // Définir clairement l'ordre des séances avec valeurs numériques
  const sessionOrder = { s1: 1, s2: 2, s3: 3, s4: 4 };
  
  // Copier les affectations pour les modifier
  const optimizedAssignments = JSON.parse(JSON.stringify(teacherAssignments));
  
  // Pour chaque enseignant, réorganiser ses surveillances pour respecter la séquence
  Object.entries(optimizedAssignments).forEach(([teacherId, assignments]) => {
    if (assignments.length <= 1) return; // Pas besoin d'optimiser s'il n'y a qu'une seule surveillance
    
    // Grouper les affectations par date
    const assignmentsByDate = {};
    assignments.forEach(assignment => {
      if (!assignmentsByDate[assignment.date]) {
        assignmentsByDate[assignment.date] = [];
      }
      assignmentsByDate[assignment.date].push(assignment);
    });
    
    // Pour chaque date, s'assurer que les séances sont dans l'ordre
    Object.values(assignmentsByDate).forEach(dateAssignments => {
      dateAssignments.sort((a, b) => sessionOrder[a.session] - sessionOrder[b.session]);
    });
    
    // Reconstruire la liste d'affectations triée par date puis par séance
    const sortedAssignments = [];
    sortedDates.forEach(date => {
      if (assignmentsByDate[date]) {
        sortedAssignments.push(...assignmentsByDate[date]);
      }
    });
    
    // Vérifier que la séquence est bien respectée entre les jours
    let hasSequenceIssue = false;
    for (let i = 1; i < sortedAssignments.length; i++) {
      const prev = sortedAssignments[i-1];
      const curr = sortedAssignments[i];
      
      // Si même jour, s'assurer que l'ordre est croissant
      if (prev.date === curr.date) {
        if (sessionOrder[prev.session] >= sessionOrder[curr.session]) {
          hasSequenceIssue = true;
          console.warn(`Problème de séquence pour l'enseignant ${teacherId}: ${prev.session} -> ${curr.session} le même jour ${prev.date}`);
        }
      } 
      // Si jours différents et consécutifs, s'assurer qu'on termine par s4 puis commence par s1
      else if (new Date(curr.date) - new Date(prev.date) === 24*60*60*1000) {
        if (prev.session !== 's4' && curr.session !== 's1') {
          console.warn(`Continuité sous-optimale entre jours pour l'enseignant ${teacherId}: ${prev.date}/${prev.session} -> ${curr.date}/${curr.session}`);
        }
      }
    }
    
    optimizedAssignments[teacherId] = sortedAssignments;
  });
  
  return optimizedAssignments;
};
function calculateSequenceScore(sessionProgress, currentDate, currentSession) {
  if (!sessionProgress || !sessionProgress.currentDate) {
    return 0; // Aucun historique => score 0
  }
  
  // Comparer la dernière date de surveillance
  const lastDate = sessionProgress.currentDate;
  const lastSession = sessionProgress.lastSession;
  
  // Convertir les séances en valeurs numériques pour comparaison directe
  const sessionOrder = { s1: 1, s2: 2, s3: 3, s4: 4 };
  const lastSessionValue = sessionOrder[lastSession] || 0;
  const currentSessionValue = sessionOrder[currentSession] || 0;
  
  // Comparer les dates
  if (lastDate === currentDate) {
    // Même jour : vérifier si la séquence est strictement croissante
    if (currentSessionValue === lastSessionValue + 1) {
      return 100; // Séquence parfaite (ex: s1 -> s2)
    } else if (currentSessionValue > lastSessionValue) {
      return 50; // Séquence correcte mais avec saut (ex: s1 -> s3)
    }
    return -10; // Séquence incorrecte sur même jour (ex: s2 -> s1)
  } else {
    // Dates différentes
    const last = new Date(lastDate);
    const current = new Date(currentDate);
    const diffDays = Math.round((current - last) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Jour suivant
      if (lastSession === "s4" && currentSession === "s1") {
        return 90; // Séquence parfaite entre jours (s4 -> s1 le lendemain)
      } else if (currentSession === "s1") {
        return 70; // Bon redémarrage au début du jour suivant
      }
      return 40; // Continuité acceptable mais pas optimale
    } else if (diffDays > 1) {
      // Plus d'un jour d'écart
      if (currentSession === "s1") {
        return 20; // Au moins on recommence par le début
      }
      return -5; // Pas idéal pour la continuité
    }
    
    return -20; // Cas anormal (date antérieure)
  }
}

// Fonction principale de génération du planning de surveillance améliorée
exports.generateSurveillanceSchedule = async () => {
  try {
    // Récupérer tous les examens, enseignants et répartitions
    const exams = await Calendrier.find().lean();
    const teachers = await Surveillance.find().lean();
    const roomAssignments = await Repartition.find().lean();

    if (exams.length === 0) {
      throw new Error("Aucun examen trouvé dans la base de données");
    }
    if (teachers.length === 0) {
      throw new Error("Aucun enseignant trouvé dans la base de données");
    }

    console.log(`Nombre d'examens: ${exams.length}, Nombre d'enseignants: ${teachers.length}`);

    // Vérification du nombre total de surveillances nécessaires vs disponibles
    const totalExams = exams.length;
    const totalSurveillancesNeeded = totalExams * 2; // 2 surveillants par examen
    const totalSurveillancesAvailable = teachers.reduce((total, teacher) => total + (teacher.Surveillance || 0), 0);

    console.log(`Surveillances nécessaires: ${totalSurveillancesNeeded}, Surveillances disponibles: ${totalSurveillancesAvailable}`);

    if (totalSurveillancesAvailable < totalSurveillancesNeeded) {
      console.warn(`⚠️ Attention: Le nombre total de surveillances disponibles (${totalSurveillancesAvailable}) est inférieur au nombre requis (${totalSurveillancesNeeded})`);
    }

    // Organiser les sessions d'examen par date chronologique
    const examsByDate = {};
    const allDates = [];
    exams.forEach(exam => {
      const dateObj = new Date(exam.date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      if (!examsByDate[dateStr]) {
        examsByDate[dateStr] = {};
        allDates.push(dateStr);
      }

      if (!examsByDate[dateStr][exam.seance]) {
        examsByDate[dateStr][exam.seance] = [];
      }

      examsByDate[dateStr][exam.seance].push(exam);
    });

    // Trier les dates chronologiquement
    allDates.sort();

    // Regrouper les dates en blocs consécutifs de 2-3 jours
    const dateBlocks = [];
    let currentBlock = [];
    for (let i = 0; i < allDates.length; i++) {
      currentBlock.push(allDates[i]);
      // Fermer le bloc après 3 jours ou à la fin de la liste
      if (currentBlock.length >= 3 || i === allDates.length - 1) {
        dateBlocks.push([...currentBlock]);
        currentBlock = [];
      }
    }

    console.log(`Regroupement en ${dateBlocks.length} blocs de jours consécutifs:`, dateBlocks);

    // Créer une map des enseignants par matière
    const teachersByMatiere = {};
    teachers.forEach(teacher => {
      if (teacher.CodeMatiere && teacher.CodeMatiere.length > 0) {
        teacher.CodeMatiere.forEach(code => {
          if (!teachersByMatiere[code]) {
            teachersByMatiere[code] = [];
          }
          teachersByMatiere[code].push(teacher._id.toString());
        });
      }
    });

    // Regrouper les groupes par salle
    const groupsByRoom = {};
    roomAssignments.forEach(assignment => {
      if (!groupsByRoom[assignment.salle]) {
        groupsByRoom[assignment.salle] = [];
      }
      groupsByRoom[assignment.salle].push(assignment.groupe);
    });

    // Initialiser le suivi des affectations des enseignants
    const teacherSurveillanceRemaining = {};
    const teacherAssignments = {};
    const teacherAvailability = {};
    
    // Structure pour suivre l'ordre séquentiel des séances pour chaque enseignant
    const teacherSessionProgress = {};

    teachers.forEach(teacher => {
      const teacherId = teacher._id.toString();
      teacherSurveillanceRemaining[teacherId] = teacher.Surveillance || 0;
      teacherAssignments[teacherId] = [];
      teacherAvailability[teacherId] = {
        currentBlock: null,
        assignedDates: new Set()
      };
      teacherSessionProgress[teacherId] = {
        currentDate: null,
        lastSession: null  // Dernière séance assignée (s1, s2, s3, s4)
      };
    });

    // Structure pour stocker les affectations finales
    const finalSchedule = {};

    // Définir l'ordre des séances pour vérifier la séquence
    const sessionOrder = { s1: 1, s2: 2, s3: 3, s4: 4 };
    const sessionKeys = Object.keys(sessionOrder);

    // Traiter chaque bloc de jours
    for (let blockIndex = 0; blockIndex < dateBlocks.length; blockIndex++) {
      const currentBlock = dateBlocks[blockIndex];
      console.log(`Traitement du bloc ${blockIndex + 1}: ${currentBlock.join(', ')}`);

      // Libérer les enseignants qui ont terminé leur bloc précédent
      teachers.forEach(teacher => {
        const teacherId = teacher._id.toString();
        if (teacherAvailability[teacherId].currentBlock !== null && 
            teacherAvailability[teacherId].currentBlock !== blockIndex) {
          teacherAvailability[teacherId].currentBlock = null;
          teacherAvailability[teacherId].assignedDates = new Set();
          // Réinitialiser le suivi des séances
          teacherSessionProgress[teacherId].currentDate = null;
          teacherSessionProgress[teacherId].lastSession = null;
        }
      });

      // Collecter tous les codes de matière pour ce bloc
      const materieCodesInBlock = new Set();
      currentBlock.forEach(dateStr => {
        const dateSessions = examsByDate[dateStr];
        if (dateSessions) {
          Object.values(dateSessions).forEach(sessionExams => {
            sessionExams.forEach(exam => {
              if (exam.CodeMatiere) {
                materieCodesInBlock.add(exam.CodeMatiere);
              }
            });
          });
        }
      });

      // Identifier les enseignants prioritaires pour ce bloc (ceux qui enseignent ces matières)
      const priorityTeachersForBlock = new Set();
      materieCodesInBlock.forEach(code => {
        if (teachersByMatiere[code]) {
          teachersByMatiere[code].forEach(teacherId => {
            if (teacherSurveillanceRemaining[teacherId] > 0) {
              priorityTeachersForBlock.add(teacherId);
            }
          });
        }
      });

      console.log(`${priorityTeachersForBlock.size} enseignants prioritaires identifiés pour ce bloc`);

      // Traiter les dates dans l'ordre chronologique
      for (const dateStr of currentBlock) {
        const dateSessions = examsByDate[dateStr];
        if (!dateSessions) continue;

        if (!finalSchedule[dateStr]) {
          finalSchedule[dateStr] = {};
        }

        // Traiter les séances dans l'ordre (s1, s2, s3, s4)
        for (const session of sessionKeys) {
          if (!dateSessions[session]) continue;

          const currentExams = dateSessions[session];

          if (!finalSchedule[dateStr][session]) {
            finalSchedule[dateStr][session] = {
              surveillants: [],
              reserveProfs: []
            };
          }

          // Identifier les salles nécessaires pour cette session
          const assignedRooms = {};
          for (const exam of currentExams) {
            // Trouver la salle pour cet examen selon le fichier de répartition
            const examGroups = [exam.filiere];
            if (exam.specialite) examGroups.push(exam.specialite);
            let assignedRoom = null;

            // Chercher la salle qui contient ce groupe
            for (const [room, groups] of Object.entries(groupsByRoom)) {
              if (groups.some(g => examGroups.includes(g))) {
                assignedRoom = room;
                break;
              }
            }

            if (!assignedRoom) {
              console.log(`Aucune salle trouvée pour l'examen: ${exam.CodeMatiere} (${exam.filiere}/${exam.specialite || ""})`);
              assignedRoom = `Salle ${exam.filiere.substring(0, 3)}-${Math.floor(Math.random() * 100)}`;
            }

            if (!assignedRooms[assignedRoom]) {
              assignedRooms[assignedRoom] = [];
            }
            assignedRooms[assignedRoom].push(exam);
          }

          // Liste des enseignants déjà assignés à cette date/session
          const assignedTeachers = new Set();
          
          // NOUVELLE LOGIQUE: Prioriser les enseignants avec la séquence en cours
          for (const [room, roomExams] of Object.entries(assignedRooms)) {
            const supervisors = [];
            const examCodesInRoom = roomExams.map(e => e.CodeMatiere).filter(Boolean);
            
            // PHASE 1: Priorité aux professeurs responsables qui suivent une séquence
            // PHASE 1: Priorité aux professeurs responsables qui suivent une séquence
const priorityTeachers = [];
priorityTeachersForBlock.forEach(teacherId => {
  if (teacherSurveillanceRemaining[teacherId] <= 0 || assignedTeachers.has(teacherId)) {
    return;
  }
  
  const progress = teacherSessionProgress[teacherId];
  let score = 0;
  
  // Définir clairement l'ordre des séances
  const sessionOrderValue = { s1: 1, s2: 2, s3: 3, s4: 4 };
  
  // Vérifier si c'est une continuation de séance dans la même journée
  if (progress.currentDate === dateStr) {
    const lastSessionValue = progress.lastSession ? sessionOrderValue[progress.lastSession] : 0;
    const currentSessionValue = sessionOrderValue[session];
    
    // Très haute priorité si c'est exactement la séance suivante
    if (currentSessionValue === lastSessionValue + 1) {
      score += 150; // Augmenter cette valeur pour favoriser les séquences parfaites
    } else if (currentSessionValue > lastSessionValue) {
      score += 50; // Séquence correcte mais avec saut
    } else {
      score -= 30; // Pénaliser les séquences incorrectes (ex: s2 -> s1)
    }
  }
  // Vérifier si c'est la première séance d'une nouvelle journée consécutive
  else if (progress.currentDate !== null && progress.lastSession === 's4' && session === 's1') {
    const lastDateIndex = currentBlock.indexOf(progress.currentDate);
    const currentDateIndex = currentBlock.indexOf(dateStr);
    
    if (currentDateIndex === lastDateIndex + 1) {
      score += 120; // Priorité très haute pour la séquence parfaite entre jours
    }
  }
  // Première séance du jour 
  else if (progress.currentDate === null && session === 's1') {
    score += 25; // Priorité pour démarrer une nouvelle séquence correctement
  } else if (session === 's1') {
    score += 15; // Toujours mieux de commencer par s1
  } else {
    score -= 20; // Pénaliser le démarrage avec une séance autre que s1
  }
  
  // Bonus pour les enseignants qui enseignent cette matière
  if (examCodesInRoom.some(code =>
    teachersByMatiere[code] && teachersByMatiere[code].includes(teacherId))) {
    score += 75;
  }
  
  if (score > -30) { // Permettre même des scores négatifs mais pas trop bas
    priorityTeachers.push([teacherId, score]);
  }
});
            
            // Trier par score de priorité décroissant
            priorityTeachers.sort((a, b) => b[1] - a[1]);
            
            // Affecter les enseignants prioritaires
            for (const [teacherId, _] of priorityTeachers) {
              if (supervisors.length >= 2) break;
              
              // Vérifier la disponibilité pour ce bloc
              const teacherAvail = teacherAvailability[teacherId];
              if (teacherAvail.currentBlock === null || teacherAvail.currentBlock === blockIndex) {
                supervisors.push(teacherId);
                teacherSurveillanceRemaining[teacherId]--;
                
                // Mettre à jour les informations d'affectation
                teacherAssignments[teacherId].push({
                  date: dateStr,
                  session
                });
                
                assignedTeachers.add(teacherId);
                
                // Mettre à jour le suivi des séances
                teacherSessionProgress[teacherId].currentDate = dateStr;
                teacherSessionProgress[teacherId].lastSession = session;
                
                // Affecté à ce bloc
                teacherAvail.currentBlock = blockIndex;
                teacherAvail.assignedDates.add(dateStr);
              }
            }
            
            // PHASE 2: Compléter avec des enseignants du bloc ayant une séquence en cours
            if (supervisors.length < 2) {
              const eligibleTeachers = teachers
                .filter(teacher => {
                  const teacherId = teacher._id.toString();
                  return (
                    teacherSurveillanceRemaining[teacherId] > 0 &&
                    !assignedTeachers.has(teacherId) &&
                    teacherAvailability[teacherId].currentBlock === blockIndex
                  );
                })
                .sort((a, b) => {
                  const aId = a._id.toString();
                  const bId = b._id.toString();
                  
                  // Calculer un score de séquence pour chaque enseignant
                  const scoreA = calculateSequenceScore(teacherSessionProgress[aId], dateStr, session);
                  const scoreB = calculateSequenceScore(teacherSessionProgress[bId], dateStr, session);
                  
                  // Priorité de séquence, puis par nombre de surveillances restantes
                  if (scoreA !== scoreB) return scoreB - scoreA;
                  return teacherSurveillanceRemaining[bId] - teacherSurveillanceRemaining[aId];
                });

              for (const teacher of eligibleTeachers) {
                if (supervisors.length >= 2) break;
                
                const teacherId = teacher._id.toString();
                supervisors.push(teacherId);
                teacherSurveillanceRemaining[teacherId]--;
                
                teacherAssignments[teacherId].push({
                  date: dateStr,
                  session
                });
                
                assignedTeachers.add(teacherId);
                
                // Mettre à jour le suivi des séances
                teacherSessionProgress[teacherId].currentDate = dateStr;
                teacherSessionProgress[teacherId].lastSession = session;
                
                teacherAvailability[teacherId].assignedDates.add(dateStr);
              }
            }
            
            // PHASE 3: Affecter de nouveaux enseignants au bloc si nécessaire
            if (supervisors.length < 2) {
              const eligibleTeachers = teachers
                .filter(teacher => {
                  const teacherId = teacher._id.toString();
                  return (
                    teacherSurveillanceRemaining[teacherId] > 0 &&
                    !assignedTeachers.has(teacherId) &&
                    teacherAvailability[teacherId].currentBlock === null
                  );
                })
                .sort((a, b) => {
                  const aId = a._id.toString();
                  const bId = b._id.toString();
                  
                  // Préférer ceux qui enseignent les matières dans la salle
                  const aTeachesSubject = examCodesInRoom.some(code => 
                    a.CodeMatiere && a.CodeMatiere.includes(code)) ? 1 : 0;
                  const bTeachesSubject = examCodesInRoom.some(code => 
                    b.CodeMatiere && b.CodeMatiere.includes(code)) ? 1 : 0;
                  
                  if (aTeachesSubject !== bTeachesSubject) {
                    return bTeachesSubject - aTeachesSubject;
                  }
                  
                  // Puis par nombre de surveillances restantes
                  return teacherSurveillanceRemaining[bId] - teacherSurveillanceRemaining[aId];
                });

              for (const teacher of eligibleTeachers) {
                if (supervisors.length >= 2) break;
                
                const teacherId = teacher._id.toString();
                supervisors.push(teacherId);
                teacherSurveillanceRemaining[teacherId]--;
                
                teacherAssignments[teacherId].push({
                  date: dateStr,
                  session
                });
                
                assignedTeachers.add(teacherId);
                
                // Initialiser le suivi des séances
                teacherSessionProgress[teacherId].currentDate = dateStr;
                teacherSessionProgress[teacherId].lastSession = session;
                
                // Affecter l'enseignant à ce bloc
                teacherAvailability[teacherId].currentBlock = blockIndex;
                teacherAvailability[teacherId].assignedDates.add(dateStr);
              }
            }
            
            // VÉRIFICATION STRICTE: S'assurer qu'il y a EXACTEMENT 2 surveillants
            if (supervisors.length < 2) {
              const backupTeachers = teachers
                .filter(teacher => {
                  const teacherId = teacher._id.toString();
                  return !assignedTeachers.has(teacherId);
                })
                .sort((a, b) => {
                  const aId = a._id.toString();
                  const bId = b._id.toString();
                  
                  // Préférer ceux qui sont déjà dans le bloc et suivent une séquence
                  const aInBlock = teacherAvailability[aId].currentBlock === blockIndex ? 1 : 0;
                  const bInBlock = teacherAvailability[bId].currentBlock === blockIndex ? 1 : 0;
                  
                  if (aInBlock !== bInBlock) return bInBlock - aInBlock;
                  
                  // S'ils sont tous deux dans le bloc, préférer celui avec une séquence en cours
                  if (aInBlock && bInBlock) {
                    const scoreA = calculateSequenceScore(teacherSessionProgress[aId], dateStr, session);
                    const scoreB = calculateSequenceScore(teacherSessionProgress[bId], dateStr, session);
                    if (scoreA !== scoreB) return scoreB - scoreA;
                  }
                  
                  return 0;
                });

              for (const teacher of backupTeachers) {
                if (supervisors.length >= 2) break;
                
                const teacherId = teacher._id.toString();
                supervisors.push(teacherId);
                
                console.log(`⚠️ L'enseignant ${teacher.Nom} est assigné à une surveillance supplémentaire (hors quota)`);
                
                teacherAssignments[teacherId].push({
                  date: dateStr,
                  session,
                  extraDuty: true
                });
                
                assignedTeachers.add(teacherId);
                
                // Mettre à jour le suivi des séances
                teacherSessionProgress[teacherId].currentDate = dateStr;
                teacherSessionProgress[teacherId].lastSession = session;
                
                if (teacherAvailability[teacherId].currentBlock === null) {
                  teacherAvailability[teacherId].currentBlock = blockIndex;
                }
                teacherAvailability[teacherId].assignedDates.add(dateStr);
              }
            }

            // Ajouter les surveillants au planning
            for (const supervisorId of supervisors) {
              const teacher = teachers.find(t => t._id.toString() === supervisorId);
              if (teacher) {
                finalSchedule[dateStr][session].surveillants.push({
                  nom: teacher.Nom,
                  salle: room
                });
              }
            }
          }

          // Gestion des professeurs de réserve pour cette date/session
          // Optimisation similaire avec des séquences consécutives
          
          // Vérifier combien d'enseignants sont déjà en réserve pour cette date
          const reservesOnThisDate = new Set();
          Object.values(finalSchedule[dateStr]).forEach(sessionData => {
            if (sessionData.reserveProfs) {
              sessionData.reserveProfs.forEach(prof => {
                reservesOnThisDate.add(prof.nom);
              });
            }
          });

          // Déterminer combien d'enseignants supplémentaires sont nécessaires pour cette réserve
          const targetReserveCount = 4; // Cible: entre 3 et 4 enseignants en réserve par jour
          const neededAdditionalReserves = Math.max(0, targetReserveCount - reservesOnThisDate.size);

          // Priorité aux enseignants avec une séquence en cours dans le bloc
          const eligibleForReserve = teachers
            .filter(teacher => {
              const teacherId = teacher._id.toString();
              const teacherName = teacher.Nom;
              return (
                teacherSurveillanceRemaining[teacherId] > 0 &&
                !assignedTeachers.has(teacherId) &&
                !reservesOnThisDate.has(teacherName) &&
                (
                  teacherAvailability[teacherId].currentBlock === blockIndex ||
                  teacherAvailability[teacherId].currentBlock === null
                )
              );
            })
            .sort((a, b) => {
              const aId = a._id.toString();
              const bId = b._id.toString();
              
              // Critères de tri:
              // 1. Prioriser ceux avec une séquence en cours
              const scoreA = calculateSequenceScore(teacherSessionProgress[aId], dateStr, session);
              const scoreB = calculateSequenceScore(teacherSessionProgress[bId], dateStr, session);
              
              if (scoreA !== scoreB) return scoreB - scoreA;
              
              // 2. Prioriser ceux déjà dans ce bloc
              const aInBlock = teacherAvailability[aId].currentBlock === blockIndex ? 1 : 0;
              const bInBlock = teacherAvailability[bId].currentBlock === blockIndex ? 1 : 0;
              
              if (aInBlock !== bInBlock) return bInBlock - aInBlock;
              
              // 3. Si égalité, prioriser ceux avec le plus de séances restantes
              return teacherSurveillanceRemaining[bId] - teacherSurveillanceRemaining[aId];
            });

          // Ajouter des enseignants en réserve pour atteindre le quota quotidien
          for (const teacher of eligibleForReserve) {
            if (finalSchedule[dateStr][session].reserveProfs.length >= neededAdditionalReserves) break;
            
            const teacherId = teacher._id.toString();
            
            finalSchedule[dateStr][session].reserveProfs.push({
              nom: teacher.Nom
            });
            
            teacherSurveillanceRemaining[teacherId]--;
            
            teacherAssignments[teacherId].push({
              date: dateStr,
              session,
              reserve: true
            });
            
            // Mettre à jour le suivi des séances pour les réserves aussi
            teacherSessionProgress[teacherId].currentDate = dateStr;
            teacherSessionProgress[teacherId].lastSession = session;

            // Affecter l'enseignant à ce bloc s'il n'y est pas déjà
            if (teacherAvailability[teacherId].currentBlock === null) {
              teacherAvailability[teacherId].currentBlock = blockIndex;
            }
            
            teacherAvailability[teacherId].assignedDates.add(dateStr);
            reservesOnThisDate.add(teacher.Nom);
          }
        }
      }
    }

    // VÉRIFICATION FINALE: S'assurer que tous les enseignants ont fait leurs surveillances
    const teachersWithMissingSurveillances = [];
    for (const teacher of teachers) {
      const teacherId = teacher._id.toString();
      const remaining = teacherSurveillanceRemaining[teacherId];
      const completed = teacher.Surveillance - remaining;
      
      if (remaining > 0) {
        teachersWithMissingSurveillances.push({
          nom: teacher.Nom,
          total: teacher.Surveillance,
          effectuees: completed,
          manquantes: remaining
        });
      }
    }

    if (teachersWithMissingSurveillances.length > 0) {
      console.warn("⚠️ Des enseignants n'ont pas effectué toutes leurs surveillances:", teachersWithMissingSurveillances);
      
      // Tentative de réaffectation pour les enseignants qui n'ont pas complété leur quota
      // Dans la partie de réaffectation pour les enseignants manquants
for (const teacherInfo of teachersWithMissingSurveillances) {
  const teacher = teachers.find(t => t.Nom === teacherInfo.nom);
  if (!teacher) continue;
  
  const teacherId = teacher._id.toString();
  const remaining = teacherInfo.manquantes;
  
  // Obtenir les affectations actuelles pour connaître sa dernière séance
  const currentAssignments = teacherAssignments[teacherId] || [];
  let lastAssignment = null;
  if (currentAssignments.length > 0) {
    lastAssignment = currentAssignments.sort((a, b) => {
      if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
      return sessionOrder[a.session] - sessionOrder[b.session];
    }).pop();
  }
  
  // Trouver des places idéales basées sur la séquence
  const potentialAssignments = [];
  
  for (const dateStr in finalSchedule) {
    for (const session in finalSchedule[dateStr]) {
      // Si l'enseignant a déjà complété ses surveillances, sortir
      if (teacherSurveillanceRemaining[teacherId] <= 0) break;
      
      // Vérifier si l'enseignant n'est pas déjà assigné à cette session
      const isAlreadyAssigned = 
        finalSchedule[dateStr][session].surveillants.some(s => s.nom === teacher.Nom) ||
        finalSchedule[dateStr][session].reserveProfs.some(r => r.nom === teacher.Nom);
      
      if (!isAlreadyAssigned && finalSchedule[dateStr][session].reserveProfs.length < 5) {
        let sequenceScore = 0;
        
        // Calculer un score basé sur la continuité de la séquence
        if (lastAssignment) {
          sequenceScore = calculateSequenceScore(
            { currentDate: lastAssignment.date, lastSession: lastAssignment.session },
            dateStr,
            session
          );
        } else if (session === 's1') {
          // Si pas d'affectation précédente, préférer commencer par s1
          sequenceScore = 30;
        }
        
        potentialAssignments.push({
          dateStr,
          session,
          score: sequenceScore
        });
      }
    }
  }
  
  // Trier les affectations potentielles par score décroissant
  potentialAssignments.sort((a, b) => b.score - a.score);
  
  // Affecter aux meilleures positions disponibles
  for (const assignment of potentialAssignments) {
    if (teacherSurveillanceRemaining[teacherId] <= 0) break;
    
    // Ajouter comme enseignant de réserve
    finalSchedule[assignment.dateStr][assignment.session].reserveProfs.push({
      nom: teacher.Nom,
      reaffectation: true
    });
    
    teacherSurveillanceRemaining[teacherId]--;
    lastAssignment = { date: assignment.dateStr, session: assignment.session };
    console.log(`✅ ${teacher.Nom} réaffecté comme réserve le ${assignment.dateStr}, session ${assignment.session} (score: ${assignment.score})`);
  }
}
    }

    // Formater la sortie finale simplifiée
    const simplifiedSchedule = [];
    for (const [dateStr, sessions] of Object.entries(finalSchedule)) {
      for (const [session, data] of Object.entries(sessions)) {
        // Formater la date pour l'affichage
        const date = new Date(dateStr);
        const formattedDate = date.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        // Ajouter les surveillants réguliers
        for (const surveillant of data.surveillants) {
          simplifiedSchedule.push({
            date: formattedDate,
            session: session,
            nom_surveillant: surveillant.nom,
            salle: surveillant.salle,
            type: "Surveillance"
          });
        }
        
        // Ajouter les profs de réserve
        for (const reserveProf of data.reserveProfs) {
          simplifiedSchedule.push({
            date: formattedDate,
            session: session,
            nom_surveillant: reserveProf.nom,
            type: "Réserve",
            reaffectation: reserveProf.reaffectation || false
          });
        }
      }
    }

    // Trier par date, puis par session, puis par nom
    simplifiedSchedule.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.session !== b.session) return a.session.localeCompare(b.session);
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return a.nom_surveillant.localeCompare(b.nom_surveillant);
    });

    
  // Optimisation: Essayer d'améliorer la continuité des surveillances
console.log("Optimisation du planning des enseignants...");
try {
  teacherAssignments = exports.optimizeTeacherSchedule(teacherAssignments, allDates);
  console.log("✅ Planning des enseignants optimisé");
} catch (error) {
  console.error("❌ Erreur lors de l'optimisation du planning:", error);
  // Continuer avec le planning non optimisé
}

// Analyse finale pour vérifier la répartition
console.log("=== Analyse du planning généré ===");
const teacherSummary = {};

teachers.forEach(teacher => {
  const teacherId = teacher._id.toString();  // S'assurer que l'ID est bien une chaîne
  const assigned = teacher.Surveillance - teacherSurveillanceRemaining[teacherId];
  
  // Vérification si assignedDates est un Set ou un tableau
  const assignedDates = teacherAvailability[teacherId].assignedDates;

  // Vérifier le type de assignedDates
  const joursAssignes = Array.isArray(assignedDates) ? assignedDates.length : assignedDates.size;
  
  // Générer un résumé pour chaque enseignant
  teacherSummary[teacher.Nom] = {
    surveillance_total: teacher.Surveillance,
    surveillance_effectuees: assigned,
    jours_assignes: joursAssignes,
    dates_assignées: Array.from(assignedDates).map(date => {
      // Convertir en format plus lisible si nécessaire
      return new Date(date).toLocaleDateString('fr-FR');
    })
  };
});

// Générer un tableau pour affichage
const displayTable = Object.keys(teacherSummary).map(teacherName => {
  const summary = teacherSummary[teacherName];
  return {
    Enseignant: teacherName,
    "Total Surveillance": summary.surveillance_total,
    "Surveillances Effectuées": summary.surveillance_effectuees,
    "Jours Assignés": summary.jours_assignes,
    "Dates Assignées": summary.dates_assignées.join(", ")  // Affichage des dates séparées par une virgule
  
  };
});

// Affichage du tableau dans la console
console.log("=== Tableau des surveillances des enseignants ===");
console.table(displayTable);



 console.log("Répartition des surveillances par enseignant:", JSON.stringify(teacherSummary, null, 2));
      
      // Compter les surveillances par date/session pour vérification
      const surveillanceCountBySession = {};
      
      simplifiedSchedule.forEach(entry => {
        if (entry.type === "Surveillance") {
          const key = `${entry.date}_${entry.session}`;
          if (!surveillanceCountBySession[key]) {
            surveillanceCountBySession[key] = [];
          }
          surveillanceCountBySession[key].push(entry.nom_surveillant);
        }
      });
      
      // Vérifier que chaque salle a exactement 2 surveillants
      const sessionsWithWrongSurveillantCount = [];
      
      Object.entries(surveillanceCountBySession).forEach(([key, surveillants]) => {
        const [date, session] = key.split('_');
        const uniqueSalles = new Set(simplifiedSchedule
          .filter(e => e.date === date && e.session === session && e.type === "Surveillance")
          .map(e => e 
            .salle));

            if (uniqueSalles.size > 0) {
              // Vérifier que chaque salle a exactement 2 surveillants
              const sallesSurveillants = {};
              
              simplifiedSchedule
                .filter(e => e.date === date && e.session === session && e.type === "Surveillance")
                .forEach(entry => {
                  if (!sallesSurveillants[entry.salle]) {
                    sallesSurveillants[entry.salle] = [];
                  }
                  sallesSurveillants[entry.salle].push(entry.nom_surveillant);
                });
              
              const problemSalles = Object.entries(sallesSurveillants)
                .filter(([salle, surveillants]) => surveillants.length !== 2);
              
              if (problemSalles.length > 0) {
                sessionsWithWrongSurveillantCount.push({
                  date,
                  session,
                  problemSalles: problemSalles.map(([salle, surveillants]) => ({
                    salle,
                    surveillantCount: surveillants.length,
                    surveillants
                  }))
                });
              }
            }
            });
            
            if (sessionsWithWrongSurveillantCount.length > 0) {
              console.warn("⚠️ Des salles n'ont pas exactement 2 surveillants:", 
                JSON.stringify(sessionsWithWrongSurveillantCount, null, 2));
            }
            
            // Vérifier la continuité des jours de surveillance
            console.log("=== Vérification de la continuité des surveillances ===");
            const discontinuityByTeacher = {};
            
            teachers.forEach(teacher => {
              const teacherId = teacher._id.toString();
              const assignedDates = [...teacherAvailability[teacherId].assignedDates].sort();
              
              if (assignedDates.length > 1) {
                const discontinuities = [];
                
                for (let i = 1; i < assignedDates.length; i++) {
                  const prevDate = new Date(assignedDates[i-1]);
                  const currDate = new Date(assignedDates[i]);
                  
                  // Calculer la différence en jours
                  const diffTime = Math.abs(currDate - prevDate);
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  if (diffDays > 1) {
                    discontinuities.push({
                      from: assignedDates[i-1],
                      to: assignedDates[i],
                      gap: diffDays - 1
                    });
                  }
                }
                
                if (discontinuities.length > 0) {
                  discontinuityByTeacher[teacher.Nom] = discontinuities;
                }
              }
            });
            
            if (Object.keys(discontinuityByTeacher).length > 0) {
              console.warn("⚠️ Des enseignants ont des jours de surveillance non consécutifs:", 
                JSON.stringify(discontinuityByTeacher, null, 2));
            }
            
            // Créer des statistiques sur les jours de réserve
            const reserveStatsByDate = {};
            simplifiedSchedule.forEach(entry => {
              if (entry.type === "Réserve") {
                if (!reserveStatsByDate[entry.date]) {
                  reserveStatsByDate[entry.date] = { count: 0, teachers: [] };
                }
                reserveStatsByDate[entry.date].count++;
                reserveStatsByDate[entry.date].teachers.push(entry.nom_surveillant);
              }
            });
            
            // Vérifier que chaque jour a au moins 2 enseignants de réserve
            const datesWithInsufficientReserves = [];
            Object.entries(reserveStatsByDate).forEach(([date, stats]) => {
              if (stats.count < 2) {
                datesWithInsufficientReserves.push({
                  date,
                  reserveCount: stats.count,
                  reserveTeachers: stats.teachers
                });
              }
            });
            
            if (datesWithInsufficientReserves.length > 0) {
              console.warn("⚠️ Des jours n'ont pas assez d'enseignants de réserve:", 
                JSON.stringify(datesWithInsufficientReserves, null, 2));
            }
            
            console.log(`✅ Planning de surveillance généré avec succès: ${simplifiedSchedule.length} affectations`);
            
            return {
              success: true,
              schedule: simplifiedSchedule,
              stats: {
                totalExams,
                totalSurveillancesNeeded,
                totalSurveillancesAvailable,
                teacherSummary,
                sessionsWithWrongSurveillantCount: sessionsWithWrongSurveillantCount.length,
                teachersWithDiscontinuity: Object.keys(discontinuityByTeacher).length,
                datesWithInsufficientReserves: datesWithInsufficientReserves.length
              }
            };
            
            } catch (error) {
              console.error('❌ Erreur lors de la génération du planning de surveillance:', error);
              throw error;
            }
};
         

// Fonction pour créer un tableau structuré à partir des données du planning
const createStructuredSchedule = (schedule) => {
  // Grouper par date et session
  const structuredData = [];
  const dateSessionMap = new Map();
  
  // Première étape: regrouper tous les surveillants par date et séance
  schedule.forEach(entry => {
    if (entry.type === "Surveillance") {
      const dateKey = entry.date;
      const sessionKey = entry.session;
      const key = `${dateKey}_${sessionKey}`;
      
      if (!dateSessionMap.has(key)) {
        dateSessionMap.set(key, {
          date: dateKey,
          session: sessionKey,
          surveillantPairs: []
        });
      }
      
      // Trouver si le surveillant fait partie d'une paire existante pour la même salle
      const sessionData = dateSessionMap.get(key);
      let pairFound = false;
      
      for (const pair of sessionData.surveillantPairs) {
        if (pair.salle === entry.salle && pair.surveillants.length < 2) {
          pair.surveillants.push(entry.nom_surveillant);
          pairFound = true;
          break;
        }
      }
      
      // Si aucune paire existante n'est trouvée pour cette salle, créer une nouvelle
      if (!pairFound) {
        sessionData.surveillantPairs.push({
          salle: entry.salle,
          surveillants: [entry.nom_surveillant]
        });
      }
    }
  });
  
  // Convertir la Map en tableau
  dateSessionMap.forEach(value => {
    structuredData.push(value);
  });
  
  // Trier par date puis par séance
  structuredData.sort((a, b) => {
    const dateA = new Date(a.date.split(' ').slice(1).join(' '));
    const dateB = new Date(b.date.split(' ').slice(1).join(' '));
    
    if (dateA - dateB !== 0) {
      return dateA - dateB;
    }
    
    // Si même date, trier par séance (s1, s2, s3, s4)
    const sessionOrder = { s1: 1, s2: 2, s3: 3, s4: 4 };
    return sessionOrder[a.session] - sessionOrder[b.session];
  });
  
  return structuredData;
};

// Fonction pour exporter en Excel
const exportScheduleToExcel = async (schedule) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Planning Surveillance');
  
  // Préparer les données
  const structuredData = createStructuredSchedule(schedule);
  
  // Déterminer le nombre maximal de paires de surveillants pour une séance
  let maxPairs = 0;
  structuredData.forEach(item => {
    maxPairs = Math.max(maxPairs, item.surveillantPairs.length);
  });
  
  // En-têtes de base
  const headers = [
    { header: 'Date', key: 'date', width: 30 },
    { header: 'Séance', key: 'session', width: 10 }
  ];
  
  // Ajouter des colonnes dynamiques pour chaque paire de surveillants
  for (let i = 0; i < maxPairs; i++) {
    headers.push(
      { header: `Paire ${i+1} - Surveillant 1`, key: `surv1_${i}`, width: 20 },
      { header: `Paire ${i+1} - Surveillant 2`, key: `surv2_${i}`, width: 20 }
    );
  }
  
  worksheet.columns = headers;
  
  // Style pour les en-têtes
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' }
  };
  
  // Ajouter les données
  structuredData.forEach(item => {
    const rowData = {
      date: item.date,
      session: item.session
    };
    
    // Ajouter les paires de surveillants
    item.surveillantPairs.forEach((pair, index) => {
      rowData[`surv1_${index}`] = pair.surveillants[0] || "Non assigné";
      rowData[`surv2_${index}`] = pair.surveillants[1] || "Non assigné";
    });
    
    worksheet.addRow(rowData);
  });
  
  // Créer le répertoire temp s'il n'existe pas
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  
  const filePath = path.join(tempDir, 'planning_surveillance.xlsx');
  await workbook.xlsx.writeFile(filePath);
  
  return filePath;
};

// Fonction pour exporter en PDF
const exportScheduleToPDF = async (schedule) => {
  return new Promise((resolve, reject) => {
    // Créer le répertoire temp s'il n'existe pas
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
   
    const filePath = path.join(tempDir, 'planning_surveillance.pdf');
    // Format paysage pour avoir plus d'espace horizontal
    const doc = new PDFDocument({
      margin: 40,  // Marges plus grandes
      size: 'A4',
      layout: 'landscape'
    });
   
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
   
    // Titre
    doc.fontSize(16).font('Helvetica-Bold').text('Planning de Surveillance des Examens', { align: 'center' });
    doc.moveDown(1.5);
   
    // Préparer les données
    const structuredData = createStructuredSchedule(schedule);
   
    // Regrouper par date
    const dateGroups = {};
    structuredData.forEach(item => {
      if (!dateGroups[item.date]) {
        dateGroups[item.date] = [];
      }
      dateGroups[item.date].push(item);
    });
   
    // Définir les dimensions du tableau avec plus d'espace pour le contenu
    const margin = doc.page.margins.left;
    const pageWidth = doc.page.width - 2 * margin;
   
    // Ajuster les proportions des colonnes: session (15%), salle+surveillants (85%)
    const colWidth = [pageWidth * 0.15, pageWidth * 0.85];
   
    // Pour chaque date, créer un tableau
    let isFirstDate = true;
   
    Object.keys(dateGroups).sort().forEach(date => {
      const dateItems = dateGroups[date];
     
      // Ajouter une page pour chaque nouvelle date (sauf la première)
      if (!isFirstDate) {
        doc.addPage();
      } else {
        isFirstDate = false;
      }
     
      // En-tête de la date
      doc.fontSize(14).font('Helvetica-Bold').text(`Date: ${date}`, { underline: true });
      doc.moveDown(1);
     
      let y = doc.y;
      let x = margin;
     
      // Dessiner l'en-tête du tableau avec fond gris
      doc.fillColor('#D3D3D3')
         .rect(x, y, pageWidth, 25)
         .fill();
     
      doc.strokeColor('#000000');
     
      // Lignes de séparation des en-têtes
      doc.rect(x, y, colWidth[0], 25).stroke();
      doc.rect(x + colWidth[0], y, colWidth[1], 25).stroke();
     
      // Texte des en-têtes
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(12);
      doc.text('Séance', x + 5, y + 7, { width: colWidth[0] - 10, align: 'center' });
      doc.text('Paires de Surveillants (Salle: Surveillant 1 / Surveillant 2)',
              x + colWidth[0] + 5, y + 7,
              { width: colWidth[1] - 10, align: 'center' });
     
      y += 25;
     
      // Lignes de données
      doc.font('Helvetica').fontSize(10);
     
      // Utiliser des couleurs alternées pour les lignes
      let rowColor = false;
     
      dateItems.forEach(item => {
        // Préparer le texte pour les paires de surveillants
        const pairsText = item.surveillantPairs.map(pair => {
          return `Salle ${pair.salle}: ${pair.surveillants[0] || "Non assigné"} / ${pair.surveillants[1] || "Non assigné"}`;
        }).join('\n\n');  // Double saut de ligne pour plus de lisibilité
       
        // Calculer la hauteur nécessaire avec un peu plus d'espace
        const textOptions = { width: colWidth[1] - 10, align: 'left' };
        const pairsTextHeight = doc.heightOfString(pairsText, textOptions);
       
        // Ajouter un padding pour une meilleure lisibilité
        const rowHeight = Math.max(30, pairsTextHeight + 20);
       
        // Vérifier si on a besoin d'une nouvelle page
        if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          y = doc.page.margins.top;
         
          // Redessiner l'en-tête sur la nouvelle page
          doc.fillColor('#D3D3D3')
             .rect(x, y, pageWidth, 25)
             .fill();
         
          doc.strokeColor('#000000');
          doc.rect(x, y, colWidth[0], 25).stroke();
          doc.rect(x + colWidth[0], y, colWidth[1], 25).stroke();
         
          doc.fillColor('#000000').font('Helvetica-Bold').fontSize(12);
          doc.text('Séance', x + 5, y + 7, { width: colWidth[0] - 10, align: 'center' });
          doc.text('Paires de Surveillants (Salle: Surveillant 1 / Surveillant 2)',
                  x + colWidth[0] + 5, y + 7,
                  { width: colWidth[1] - 10, align: 'center' });
         
          y += 25;
          rowColor = false;
        }
       
        // Fond alterné pour une meilleure lisibilité
        if (rowColor) {
          doc.fillColor('#F5F5F5')
             .rect(x, y, pageWidth, rowHeight)
             .fill();
        }
        rowColor = !rowColor;
       
        // Bordures des cellules
        doc.strokeColor('#000000');
        doc.rect(x, y, colWidth[0], rowHeight).stroke();
        doc.rect(x + colWidth[0], y, colWidth[1], rowHeight).stroke();
       
        // Contenu des cellules
        doc.fillColor('#000000');
       
        // Session (centré verticalement et horizontalement)
        doc.font('Helvetica-Bold').fontSize(11);
        doc.text(item.session,
                x + 5,
                y + (rowHeight - doc.heightOfString(item.session, { width: colWidth[0] - 10 })) / 2,
                { width: colWidth[0] - 10, align: 'center' });
       
        // Paires de surveillants
        doc.font('Helvetica').fontSize(10);
        doc.text(pairsText, x + colWidth[0] + 10, y + 10, textOptions);
       
        y += rowHeight;
      });
     
      doc.moveDown(2);
    });
   
    doc.end();
   
    stream.on('finish', () => {
      resolve(filePath);
    });
   
    stream.on('error', (err) => {
      reject(err);
    });
  });
};


// Fonction principale d'export
exports.exportSchedule = async (req, res) => {
  try {
    // Générer le planning
    const result = await exports.generateSurveillanceSchedule();
    
    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        message: "Échec de la génération du planning de surveillance" 
      });
    }
    
    // Déterminer le format d'export
    const format = req.query.format || 'excel';
    let filePath;
    let mimeType;
    
    if (format.toLowerCase() === 'pdf') {
      filePath = await exportScheduleToPDF(result.schedule);
      mimeType = 'application/pdf';
    } else {
      filePath = await exportScheduleToExcel(result.schedule);
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }
    
    // Pour Postman, nous pouvons envoyer une réponse avec le lien vers le fichier
    // ou permettre de télécharger directement
    if (req.query.download === 'true') {
      res.setHeader('Content-Type', mimeType);
res.setHeader('Content-Disposition', `attachment; filename="planning_surveillance.${format === 'pdf' ? 'pdf' : 'xlsx'}"`);
res.setHeader('Content-Transfer-Encoding', 'binary');
res.setHeader('Cache-Control', 'no-cache');

      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } else {
      // Pour le test sur Postman, renvoyer les données structurées
      const structuredData = createStructuredSchedule(result.schedule);
      
      res.status(200).json({
        success: true,
        message: `Planning de surveillance généré en format ${format}`,
        data: structuredData,
        filePath: `/temp/${path.basename(filePath)}`
      });
    }
  } catch (error) {
    console.error('Erreur lors de l\'export du planning:', error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de l'export du planning", 
      error: error.message 
    });
  }
}; 


       
// Exporter toutes les fonctions
//module.exports = {
  //...exports,
 // calculateGaps,
//s}; 
            