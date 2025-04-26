import React, { useState } from 'react';
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
  const [teachersList, setTeachersList] = useState([
    {
      _id: "1",
      name: "Mme Ben Youssef",
      department: "Math",
      grade: "Professeur",
      course: "Maths Avancées",
      CodeMatiere: "1234",
      td: 10,
      tp: 5,
      coef: 2,
      surveillance: 3,
    },
    {
      _id: "2",
      name: "Mr Trabelsi",
      department: "Informatique",
      grade: "Assistant",
      course: "Algo",
      CodeMatiere: "123",
      td: 6,
      tp: 4,
      coef: 1.5,
      surveillance: 2,
    },
  ]);

  const navigate = useNavigate();
  const [openAddDialog, setOpenAddDialog] = useState(false);

  const handleImportTeachers = (importedTeachers) => {
    setTeachersList((prev) => [...prev, ...importedTeachers]);
  };

  const deleteHandler = (id) => {
    if (id === "all") {
      setTeachersList([]);
    } else {
      setTeachersList((prev) => prev.filter(t => t._id !== id));
    }
  };

  // Delete confirmation dialog states
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);

  const confirmDelete = (id) => {
    setTeacherToDelete(id);
    setOpenConfirmDialog(true);
  };

  const handleConfirmDelete = () => {
    deleteHandler(teacherToDelete);
    setTeacherToDelete(null);
    setOpenConfirmDialog(false);
  };

  const columns = [
    { id: 'name', label: 'Nom', minWidth: 150 },
    { id: 'department', label: 'Département', minWidth: 100 },
    { id: 'grade', label: 'Grade', minWidth: 100 },
    { id: 'course', label: 'Cours', minWidth: 120 },
    { id: 'CodeMatiere', label: 'Code matière', minWidth: 120 },
    { id: 'td', label: 'TD', minWidth: 50 },
    { id: 'tp', label: 'TP', minWidth: 50 },
    { id: 'coef', label: 'Coefficient', minWidth: 80 },
    { id: 'surveillance', label: 'Surveillance', minWidth: 100 },
  ];

  const rows = teachersList.map((teacher) => ({
    id: teacher._id,
    name: teacher.name,
    department: teacher.department,
    grade: teacher.grade,
    course: teacher.course,
    CodeMatiere: teacher.CodeMatiere,
    td: teacher.td,
    tp: teacher.tp,
    coef: teacher.coef,
    surveillance: teacher.surveillance,
  }));

  const actions = [
    {
      icon: <PersonAddAlt1Icon color="primary" />,
      name: 'Add New Teacher',
      action: () => setOpenAddDialog(true),
    },
    {
      icon: <PersonRemoveIcon color="error" />,
      name: 'Delete All Teachers',
      action: () => deleteHandler("all"),
    },
  ];

  return (
    
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <h4 className="text-center mb-4 fw-bold">Calendrier des Examens</h4>
      <TableContainer sx={{ borderRadius: 3 }}>
        <Table stickyHeader>
          <TableHead>
            <StyledTableRow>
              {columns.map((column) => (
                <StyledTableCell key={column.id} align="center">
                  {column.label}
                </StyledTableCell>
              ))}
              <StyledTableCell align="center">Actions</StyledTableCell>
            </StyledTableRow>
          </TableHead>
          <TableBody>
            {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
              <StyledTableRow key={row.id}>
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
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={rows.length}
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
            Êtes-vous sûr de vouloir supprimer cet enseignant ?
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
