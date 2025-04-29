import React, { useState } from 'react';
import axios from 'axios';
import {
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  MenuItem,
  Snackbar,
  Alert,
  Divider
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const AddTeacher = ({ onClose, onImport }) => {
  // État pour le formulaire manuel
  const [formData, setFormData] = useState({
    Nom: '',
    Département: '',
    Grade: '',
    Cours: 0,
    TD: 0,
    TP: 0,
    coef: 1,
    Surveillance: 0,
    CodeMatiere: ''
  });

  // État pour l'importation de fichier
  const [file, setFile] = useState(null);
  
  // État pour les notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Options pour le département et le grade
  const departmentOptions = ['Informatique', 'Mathématiques', 'Physique', 'Chimie', 'Biologie', 'Autre'];
  const gradeOptions = ['Professeur', 'Maître de conférences', 'Assistant', 'Doctorant', 'Vacataire'];

  // Gestion des changements dans le formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;
    
    // Convertir en nombres pour les champs numériques
    if (['Cours', 'TD', 'TP', 'coef', 'Surveillance'].includes(name)) {
      parsedValue = Number(value) || 0;
    }
    
    setFormData({
      ...formData,
      [name]: parsedValue
    });
  };

  // Gestion de la sélection de fichier
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Soumission du formulaire manuel
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/enseignantsAdd', formData);
      
      if (response.data.success) {
        // Ajouter le nouvel enseignant à la liste
        const newTeacher = {
          id: response.data.data._id,
          ...formData
        };
        
        if (onImport) {
          onImport([newTeacher]);
        }
        
        // Notification de succès
        setNotification({
          open: true,
          message: 'Enseignant ajouté avec succès',
          severity: 'success'
        });
        
        // Réinitialiser le formulaire
        setFormData({
          Nom: '',
          Département: '',
          Grade: '',
          Cours: 0,
          TD: 0,
          TP: 0,
          coef: 1,
          Surveillance: 0,
          CodeMatiere: ''
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'enseignant:', error);
      setNotification({
        open: true,
        message: 'Erreur lors de l\'ajout de l\'enseignant',
        severity: 'error'
      });
    }
  };

  // Soumission du fichier
  const handleFileSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setNotification({
        open: true,
        message: 'Veuillez sélectionner un fichier',
        severity: 'warning'
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/upload-enseignants', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        // Formater les données importées pour correspondre à votre format
        const importedTeachers = response.data.rows.map(teacher => ({
          id: teacher._id,
          name: teacher.Nom,
          department: teacher.Département,
          grade: teacher.Grade,
          course: teacher.Cours,
          td: teacher.TD,
          tp: teacher.TP,
          coef: teacher.coef,
          surveillance: teacher.Surveillance,
          CodeMatiere: teacher.CodeMatiere || "",
        }));

        if (onImport) {
          onImport(importedTeachers);
        }

        setNotification({
          open: true,
          message: `${response.data.rows.length} enseignants importés avec succès`,
          severity: 'success'
        });
        
        setFile(null);
      }
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      setNotification({
        open: true,
        message: 'Erreur lors de l\'importation du fichier',
        severity: 'error'
      });
    }
  };

  // Fermer la notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Ajouter un enseignant
      </Typography>
      
      {/* Formulaire d'ajout manuel */}
      <Box component="form" onSubmit={handleFormSubmit} sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          <PersonAddIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Ajouter manuellement
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Nom"
              name="Nom"
              value={formData.Nom}
              onChange={handleInputChange}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              select
              label="Département"
              name="Département"
              value={formData.Département}
              onChange={handleInputChange}
              margin="normal"
            >
              {departmentOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              select
              label="Grade"
              name="Grade"
              value={formData.Grade}
              onChange={handleInputChange}
              margin="normal"
            >
              {gradeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Code Matière"
              name="CodeMatiere"
              value={formData.CodeMatiere}
              onChange={handleInputChange}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <TextField
              required
              fullWidth
              type="number"
              label="Cours"
              name="Cours"
              value={formData.Cours}
              onChange={handleInputChange}
              margin="normal"
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <TextField
              required
              fullWidth
              type="number"
              label="TD"
              name="TD"
              value={formData.TD}
              onChange={handleInputChange}
              margin="normal"
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <TextField
              required
              fullWidth
              type="number"
              label="TP"
              name="TP"
              value={formData.TP}
              onChange={handleInputChange}
              margin="normal"
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <TextField
              required
              fullWidth
              type="number"
              label="Coefficient"
              name="coef"
              value={formData.coef}
              onChange={handleInputChange}
              margin="normal"
              InputProps={{ inputProps: { min: 0.1, step: 0.1 } }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              type="number"
              label="Surveillance"
              name="Surveillance"
              value={formData.Surveillance}
              onChange={handleInputChange}
              margin="normal"
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={onClose} 
            sx={{ mr: 2 }}
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            startIcon={<PersonAddIcon />}
          >
            Ajouter l'enseignant
          </Button>
        </Box>
      </Box>
      
      <Divider sx={{ my: 4 }} />
      
      {/* Formulaire d'importation de fichier */}
      <Box component="form" onSubmit={handleFileSubmit}>
        <Typography variant="h6" gutterBottom>
          <FileUploadIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Importer depuis un fichier Excel
        </Typography>
        
        <Box sx={{ mt: 2, mb: 3 }}>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<FileUploadIcon />}
            >
              Sélectionner un fichier
            </Button>
            <Typography component="span" sx={{ ml: 2 }}>
              {file ? file.name : 'Aucun fichier sélectionné'}
            </Typography>
          </label>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={onClose} 
            sx={{ mr: 2 }}
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            startIcon={<FileUploadIcon />}
            disabled={!file}
          >
            Importer
          </Button>
        </Box>
      </Box>
      
      {/* Notification */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddTeacher;