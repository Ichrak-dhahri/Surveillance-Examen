// controllers/schedulingController.js
const Calendrier = require('../models/Calendrier');
const Surveillance = require('../models/Surveillance');
const Repartition = require('../models/Repartition');

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
        coursesByTeacher[rep.enseignant].push(rep.CodeMatiere);
      }
    });
    
    console.log("Répartition des cours par enseignant:", JSON.stringify(coursesByTeacher, null, 2));
    
    // Mettre à jour chaque enseignant avec ses matières
    for (const [teacherName, courses] of Object.entries(coursesByTeacher)) {
      const result = await Surveillance.updateOne(
        { Nom: teacherName }, // Modifié de nom_et_prenom à Nom
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
            { $set: { enseignant: matchingEnseignant.Nom } } // Modifié de nom_et_prenom à Nom
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

// Algorithme de génération du planning de surveillance
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

    // Organiser les sessions d'examen par date et horaire
    const examsByDateAndSession = {};
    exams.forEach(exam => {
      const key = `${exam.date}_${exam.seance}`;
      if (!examsByDateAndSession[key]) {
        examsByDateAndSession[key] = [];
      }
      examsByDateAndSession[key].push(exam);
    });

    // Suivre les affectations des enseignants et les créneaux restants
    const teacherAssignments = {};
    const teacherSurveillanceRemaining = {};

    // Initialiser les données de suivi des enseignants
    teachers.forEach(teacher => {
      const teacherId = teacher._id.toString();
      teacherAssignments[teacherId] = [];
      teacherSurveillanceRemaining[teacherId] = teacher.Surveillance || 0; // Modifié de nombre_de_seance_de_surveillance à Surveillance
    });

    // Regrouper les groupes par salle
    const groupsByRoom = {};
    roomAssignments.forEach(assignment => {
      if (!groupsByRoom[assignment.salle]) {
        groupsByRoom[assignment.salle] = [];
      }
      groupsByRoom[assignment.salle].push(assignment.groupe);
    });

    // Structure pour stocker les affectations finales
    const finalSchedule = {};

    // Traiter les examens par date et session
    const dateSessionKeys = Object.keys(examsByDateAndSession);
    dateSessionKeys.sort();

    for (const dateSessionKey of dateSessionKeys) {
      const currentExams = examsByDateAndSession[dateSessionKey];
      const [dateStr, session] = dateSessionKey.split('_');
      const date = new Date(dateStr);
      
      // Préparer la structure pour cette date/session
      if (!finalSchedule[dateStr]) {
        finalSchedule[dateStr] = {};
      }
      if (!finalSchedule[dateStr][session]) {
        finalSchedule[dateStr][session] = {
          surveillants: [],
          reserveProfs: []
        };
      }
      
      // Créer une map des enseignants par matière
      const teachersByMatiere = {};
      teachers.forEach(teacher => {
        const teacherId = teacher._id.toString();
        if (teacher.CodeMatiere && teacher.CodeMatiere.length > 0) {
          teacher.CodeMatiere.forEach(code => {
            if (!teachersByMatiere[code]) {
              teachersByMatiere[code] = [];
            }
            teachersByMatiere[code].push(teacherId);
          });
        }
      });

      // Affecter les examens aux salles en respectant les contraintes des groupes
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
          continue;
        }
        
        // Ajouter l'examen à la salle assignée
        if (!assignedRooms[assignedRoom]) {
          assignedRooms[assignedRoom] = [];
        }
        assignedRooms[assignedRoom].push(exam);
      }
      
      console.log(`${dateStr} ${session} - Nombre de salles: ${Object.keys(assignedRooms).length}`);
      
      // Liste des enseignants déjà assignés à cette date/session
      const assignedTeachers = new Set();
      
      // Affecter des surveillants à chaque salle
      for (const [room, roomExams] of Object.entries(assignedRooms)) {
        const supervisors = [];
        const examCodesInRoom = roomExams.map(e => e.CodeMatiere);
        
        // Priorité 1: Enseignants qui enseignent ces matières
        const potentialTeachers = new Set();
        examCodesInRoom.forEach(code => {
          if (teachersByMatiere[code]) {
            teachersByMatiere[code].forEach(teacherId => potentialTeachers.add(teacherId));
          }
        });
        
        for (const teacherId of potentialTeachers) {
          // Vérifier si l'enseignant a encore des créneaux disponibles et n'est pas déjà assigné à cette session
          if (
            teacherSurveillanceRemaining[teacherId] > 0 &&
            !assignedTeachers.has(teacherId)
          ) {
            supervisors.push(teacherId);
            teacherSurveillanceRemaining[teacherId]--;
            teacherAssignments[teacherId].push({
              date: dateStr,
              session
            });
            assignedTeachers.add(teacherId);
            
            // Si nous avons 2 superviseurs, c'est suffisant
            if (supervisors.length >= 2) break;
          }
        }

        // Priorité 2: Autres enseignants qui ont le plus de créneaux restants
        if (supervisors.length < 2) {
          const eligibleTeachers = teachers
            .filter(teacher => {
              const teacherId = teacher._id.toString();
              return teacherSurveillanceRemaining[teacherId] > 0 &&
                !assignedTeachers.has(teacherId);
            })
            .sort((a, b) => {
              const aId = a._id.toString();
              const bId = b._id.toString();
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
          }
        }
        
        // Ajouter les surveillants au planning
        for (const supervisorId of supervisors) {
          const teacher = teachers.find(t => t._id.toString() === supervisorId);
          if (teacher) {
            finalSchedule[dateStr][session].surveillants.push({
              nom: teacher.Nom // Modifié de nom_et_prenom à Nom
            });
          }
        }
      }
      
      // Ajouter 2-3 enseignants de réserve pour cette date/session
      const reserveCount = 3;
      const eligibleForReserve = teachers
        .filter(teacher => {
          const teacherId = teacher._id.toString();
          return teacherSurveillanceRemaining[teacherId] > 0 && 
                !assignedTeachers.has(teacherId);
        })
        .sort((a, b) => {
          const aId = a._id.toString();
          const bId = b._id.toString();
          return teacherSurveillanceRemaining[bId] - teacherSurveillanceRemaining[aId];
        });
      
      for (const teacher of eligibleForReserve) {
        if (finalSchedule[dateStr][session].reserveProfs.length >= reserveCount) break;
        const teacherId = teacher._id.toString();
        finalSchedule[dateStr][session].reserveProfs.push({
          nom: teacher.Nom // Modifié de nom_et_prenom à Nom
        });
        teacherSurveillanceRemaining[teacherId]--;
        teacherAssignments[teacherId].push({
          date: dateStr,
          session,
          reserve: true
        });
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
            type: "Surveillance"
          });
        }
        
        // Ajouter les profs de réserve
        for (const reserveProf of data.reserveProfs) {
          simplifiedSchedule.push({
            date: formattedDate,
            session: session,
            nom_surveillant: reserveProf.nom,
            type: "Réserve"
          });
        }
      }
    }
    
    // Trier par date, puis par session, puis par nom
    simplifiedSchedule.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.session !== b.session) return a.session.localeCompare(b.session);
      return a.nom_surveillant.localeCompare(b.nom_surveillant);
    });

    return simplifiedSchedule;
  } catch (error) {
    console.error("Erreur lors de la génération du planning:", error);
    throw error;
  }
};