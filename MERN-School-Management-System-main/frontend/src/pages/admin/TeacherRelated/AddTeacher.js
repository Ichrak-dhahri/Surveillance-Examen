import React from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  InputLabel
} from "@mui/material";
import * as XLSX from "xlsx";

function AddTeacher({ onClose, onImport }) {
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const formattedData = jsonData.map((item, index) => ({
        _id: Date.now().toString() + index, // unique id
        name: item.Nom|| "",
        department: item.Département || "",
        grade: item.Grade || "",
        course: item.Cours || "",
        CodeMatiere: item["Code Matière"] || "",
        td: item.TD || 0,
        tp: item.TP || 0,
        coef: item.Coef || 0,
        surveillance: item.Surveillance || 0,
      }));

      onImport(formattedData); // Appelle le parent
      onClose(); // Ferme le dialog
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f4f6f8",
        p: 2,
      }}
    >
      <Box
        sx={{
          marginTop: 10,
          p: 4,
          borderRadius: 2,
          backgroundColor: "white",
          boxShadow: 3,
          width: "600px",
          maxWidth: "600px",
        }}
      >
        <Typography variant="h5" gutterBottom align="center">
          Ajouter un Enseignant
        </Typography>

        <Stack spacing={2}>
          <TextField label="Nom" fullWidth />
          <TextField label="Département" fullWidth />
          <TextField label="Grade" fullWidth />
          <TextField label="Cours" fullWidth />
          <TextField label="Code Matière" fullWidth />
          <TextField label="TD" fullWidth type="number" />
          <TextField label="TP" fullWidth type="number" />
          <TextField label="Coefficient" fullWidth type="number" />
          <TextField label="Séances de surveillance" fullWidth type="number" />

          <Button variant="contained" color="primary">
            Ajouter
          </Button>

          <Box>
            <InputLabel sx={{ mt: 2 }}>Ou importer un fichier Excel :</InputLabel>
            <Button variant="outlined" component="label" sx={{ mt: 1 }}>
              Choisir un fichier
              <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileUpload} />
            </Button>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

export default AddTeacher;
