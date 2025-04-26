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

  // Lecture de toutes les lignes
  const allRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false });

  // Extraction des noms de colonnes (première ligne)
  const headerRow = allRows[0];

  // Ignorer la première ligne et préparer les données pour MongoDB
  const dataRows = allRows.slice(1).map(row => {
    const item = {};
    
    // Pour chaque cellule dans la ligne
    headerRow.forEach((header, index) => {
      if (header) {
        const value = row[index];
        // Mapper les noms des colonnes Excel aux noms des champs du schéma
        const schemaField = columnMapping[header.toLowerCase().trim()] || header.toLowerCase().replace(/ /g, '_');
        
        // Ne pas ajouter les champs vides (undefined)
        if (value !== undefined) {
          item[schemaField] = value;
        } else {
          // Ajouter une chaîne vide pour les champs obligatoires qui sont manquants
          if (Model.schema.paths[schemaField] && Model.schema.paths[schemaField].isRequired) {
            item[schemaField] = "";
          }
        }
      }
    });
    
    return item;
  });

  // Filtrer les lignes vides
  const validRows = dataRows.filter(row => Object.keys(row).length > 0);

  // Vérification des données avant insertion
  console.log(`Données à insérer pour ${Model.modelName}:`, JSON.stringify(validRows.slice(0, 2), null, 2));

  // Supprimer les données existantes pour ce modèle
  await Model.deleteMany({});

  // Insérer les nouvelles données
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
        { nom_et_prenom: teacherName },
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
// Fonction à ajouter dans schedulingController.js
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
            { $set: { enseignant: matchingEnseignant.nom_et_prenom } }
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
    // Récupérer tous les examens et enseignants de la base de données
    const exams = await Calendrier.find().lean();
    const teachers = await Surveillance.find().lean();

    if (exams.length === 0) {
      throw new Error("Aucun examen trouvé dans la base de données");
    }

    if (teachers.length === 0) {
      throw new Error("Aucun enseignant trouvé dans la base de données");
    }

    console.log(`Nombre d'examens: ${exams.length}, Nombre d'enseignants: ${teachers.length}`);

    // Initialiser le tableau du planning
    const schedule = [];

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
      teacherSurveillanceRemaining[teacherId] = teacher.nombre_de_seance_de_surveillance || 0;
    });

    // Traiter les examens par date et session
    const dateSessionKeys = Object.keys(examsByDateAndSession);
    dateSessionKeys.sort(); // Trier chronologiquement

    for (const dateSessionKey of dateSessionKeys) {
      const currentExams = examsByDateAndSession[dateSessionKey];
      const [date, session] = dateSessionKey.split('_');

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

      // Affecter des surveillants à chaque examen de cette session
      for (const exam of currentExams) {
        const supervisors = [];
        
        // Priorité 1: Enseignants qui enseignent cette matière
        if (teachersByMatiere[exam.CodeMatiere]) {
          for (const teacherId of teachersByMatiere[exam.CodeMatiere]) {
            // Vérifier si l'enseignant a encore des créneaux disponibles et n'est pas déjà assigné à cette session
            if (
              teacherSurveillanceRemaining[teacherId] > 0 &&
              !teacherAssignments[teacherId].some(a => a.date === date && a.session === session)
            ) {
              supervisors.push(teacherId);
              teacherSurveillanceRemaining[teacherId]--;
              teacherAssignments[teacherId].push({
                date,
                session,
                examId: exam._id.toString(),
                matiere: exam.CodeMatiere
              });
              
              // Si nous avons 2 superviseurs, c'est suffisant
              if (supervisors.length >= 2) break;
            }
          }
        }
        
        // Priorité 2: Autres enseignants qui ont le plus de créneaux restants
        if (supervisors.length < 2) {
          const eligibleTeachers = teachers
            .filter(teacher => {
              const teacherId = teacher._id.toString();
              return teacherSurveillanceRemaining[teacherId] > 0 &&
                !teacherAssignments[teacherId].some(a => a.date === date && a.session === session) &&
                !supervisors.includes(teacherId);
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
              date,
              session,
              examId: exam._id.toString(),
              matiere: exam.CodeMatiere
            });
          }
        }

        // Ajouter au planning même si nous n'avons pas 2 superviseurs
        schedule.push({
          exam: exam,
          supervisors
        });
      }
    }

    // Convertir les ID des enseignants en noms
    const readableSchedule = await Promise.all(schedule.map(async item => {
      const supervisorDetails = await Promise.all(item.supervisors.map(async id => {
        const teacher = await Surveillance.findById(id);
        return teacher ? teacher.nom_et_prenom : 'Inconnu';
      }));

      return {
        date: item.exam.date,
        seance: item.exam.seance,
        matiere: item.exam.CodeMatiere,
        filiere: item.exam.filiere,
        specialite: item.exam.specialite || '',
        surveillants: supervisorDetails
      };
    }));

    return readableSchedule;
  } catch (error) {
    console.error("Erreur lors de la génération du planning:", error);
    throw error;
  }
};