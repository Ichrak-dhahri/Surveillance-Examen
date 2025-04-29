import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Paper, Table, TableBody, TableContainer,
  TableHead, TablePagination, Button, Box, IconButton,
  Dialog, DialogContent, Typography
} from '@mui/material';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import { useNavigate } from 'react-router-dom';
import { StyledTableCell, StyledTableRow } from '../../../components/styles';
import { BlueButton } from '../../../components/buttonStyles';
import SpeedDialTemplate from '../../../components/SpeedDialTemplate';
import AddTeacher from './AddTeacher';

const ShowTeachers = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [teachersList, setTeachersList] = useState([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/enseignants');
        const data = response.data.data;

        const formattedData = data.map((teacher) => ({
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

        setTeachersList(formattedData);
      } catch (error) {
        console.error('Erreur lors du chargement des enseignants:', error);
      }
    };

    fetchTeachers();
  }, []);

  const handleImportTeachers = (importedTeachers) => {
    setTeachersList((prev) => [...prev, ...importedTeachers]);
  };

  const confirmDelete = (id) => {
    console.log("confirmDelete appelée avec ID:", id);
    setTeacherToDelete(id);
    setOpenConfirmDialog(true);
  };
  
  const handleConfirmDelete = () => {
    console.log("handleConfirmDelete appelée, teacherToDelete =", teacherToDelete);
    deleteHandler(teacherToDelete);
    setTeacherToDelete(null);
    setOpenConfirmDialog(false);
  };
  
  const deleteHandler = async (id) => {
    console.log("deleteHandler appelée avec ID:", id);
    try {
      if (id === "all") {
        await axios.delete('http://localhost:5000/deleteenseignants');
        setTeachersList([]);
      } else {
        await axios.delete(`http://localhost:5000/deleteenseignants/${id}`);
        setTeachersList((prev) => prev.filter(t => t.id !== id));
      }
      console.log("Suppression réussie");
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const columns = [
    { id: 'name', label: 'Nom', minWidth: 150 },
    { id: 'department', label: 'Département', minWidth: 100 },
    { id: 'grade', label: 'Grade', minWidth: 100 },
    { id: 'course', label: 'Cours', minWidth: 120 },
    { id: 'td', label: 'TD', minWidth: 50 },
    { id: 'tp', label: 'TP', minWidth: 50 },
    { id: 'coef', label: 'Coefficient', minWidth: 80 },
    { id: 'surveillance', label: 'Surveillance', minWidth: 100 },
    { id: 'CodeMatiere', label: 'Code matière', minWidth: 120 },
  ];

  const actions = [
    {
      icon: <PersonAddAlt1Icon color="primary" />,
      name: 'Ajouter un enseignant',
      action: () => setOpenAddDialog(true),
    },
    {
      icon: <PersonRemoveIcon color="error" />,
      name: 'Supprimer tous les enseignants',
      action: () => confirmDelete("all"),
    },
  ];

  // Style pour la table avec en-tête fixe
  const tableStyles = {
    tableContainer: {
      maxHeight: 440,
      borderRadius: 3,
      overflow: 'auto',
      '&::-webkit-scrollbar': {
        width: '10px',
        height: '10px',
      },
      '&::-webkit-scrollbar-track': {
        background: '#f1f1f1',
        borderRadius: '4px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#888',
        borderRadius: '4px',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: '#555',
      },
    },
    stickyHeader: {
      position: 'sticky',
      top: 0,
      backgroundColor: '#fff',
      zIndex: 10,
    }
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <h4 className="text-center mb-4 fw-bold">Liste des Enseignants</h4>
      
      {/* Utilisation de TableContainer avec une hauteur maximale fixe pour activer le défilement */}
      <TableContainer sx={tableStyles.tableContainer}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <StyledTableRow>
              {columns.map((column) => (
                <StyledTableCell 
                  key={column.id} 
                  align="center"
                  sx={{
                    minWidth: column.minWidth,
                    backgroundColor: 'primary.main', // Couleur pour l'en-tête fixe
                    color: 'white', // Pour assurer la lisibilité
                  }}
                >
                  {column.label}
                </StyledTableCell>
              ))}
              <StyledTableCell 
                align="center"
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                }}
              >
                Actions
              </StyledTableCell>
            </StyledTableRow>
          </TableHead>
          <TableBody>
            {teachersList
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => (
                <StyledTableRow key={row.id} hover role="checkbox" tabIndex={-1}>
                  {columns.map((column) => (
                    <StyledTableCell key={column.id} align="center">
                      {row[column.id]}
                    </StyledTableCell>
                  ))}
                  <StyledTableCell align="center">
                    <IconButton onClick={() => confirmDelete(row.id)}>
                      <PersonRemoveIcon color="error" />
                    </IconButton>
                    <BlueButton onClick={() => navigate("/Admin/teachers/teacher/" + row.id)}>
                      View
                    </BlueButton>
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            {/* Gérer le cas où il n'y a pas de données ou pendant le chargement */}
            {teachersList.length === 0 && (
              <StyledTableRow>
                <StyledTableCell colSpan={columns.length + 1} align="center">
                  Aucun enseignant trouvé
                </StyledTableCell>
              </StyledTableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={teachersList.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(event, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
      />

      <SpeedDialTemplate actions={actions} />

      {/* Add Teacher Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
        <DialogContent>
          <AddTeacher onClose={() => setOpenAddDialog(false)} onImport={handleImportTeachers} />
        </DialogContent>
      </Dialog>

      {/* Confirmation Delete Dialog */}
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Êtes-vous sûr de vouloir supprimer {teacherToDelete === "all" ? "tous les enseignants" : "cet enseignant"} ?
          </Typography>
          <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
            <Button onClick={() => setOpenConfirmDialog(false)} color="primary">
              Annuler
            </Button>
            <Button onClick={handleConfirmDelete} color="error" variant="contained">
              Supprimer
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default ShowTeachers;