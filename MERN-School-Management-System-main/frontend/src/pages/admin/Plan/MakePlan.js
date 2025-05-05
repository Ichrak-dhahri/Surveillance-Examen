import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import TableViewTemplate from '../../../components/TableViewTemplate';

const columns = [
  { id: 'date', label: 'Date', minWidth: 100 },
  { id: 'seance', label: 'Séance', minWidth: 100 },
  { id: 'salle', label: 'Salle', minWidth: 100 },
  { id: 'enseignant1', label: 'Enseignant 1', minWidth: 150 },
  { id: 'enseignant2', label: 'Enseignant 2', minWidth: 150 },
  { id: 'action', label: 'Action', minWidth: 100 },
];

const ModifierButton = ({ row }) => {
  const handleClick = () => {
    console.log('Modifier la ligne :', row);
  };

  return (
    <button onClick={handleClick} style={btnStyle}>Modifier</button>
  );
};

const MakePlan = () => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/resultats') // adapte l'URL si nécessaire
      .then(response => response.json())
      .then(data => {
        const transformedRows = data.data.map((item, index) => ({
          id: index + 1,
          date: item.date,
          seance: item.seance,
          salle: item.salle,
          enseignant1: item.professeur_surveillant1,
          enseignant2: item.professeur_surveillant2,
        }));
        setRows(transformedRows);
      })
      .catch(error => {
        console.error('Erreur de chargement des données :', error);
      });
  }, []);

  const handleExport = async () => {
    try {
      const response = await fetch('http://localhost:5000/');
      const data = await response.json();
  
      const transformedRows = data.data.map((item, index) => ({
        id: index + 1,
        date: item.date,
        seance: item.seance,
        salle: item.salle,
        enseignant1: item.professeur_surveillant1,
        enseignant2: item.professeur_surveillant2,
        action: <ModifierButton row={item} />
      }));
  
      // Générer le PDF avec les données fraîchement chargées
      const doc = new jsPDF();
      doc.text('Planification des Séances', 14, 15);
      const tableColumn = columns.filter(col => col.id !== 'action').map(col => col.label);
      const tableRows = transformedRows.map(row => [
        row.date,
        row.seance,
        row.salle,
        row.enseignant1,
        row.enseignant2,
      ]);
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
      });
      doc.save('planification.pdf');
  
      // Optionnel : mettre à jour le tableau dans l’interface
      setRows(transformedRows);
  
    } catch (error) {
      console.error('Erreur lors de l’export PDF :', error);
      alert('Erreur lors de l’export PDF');
    }
  };
  

  const handleAffecter = async () => {
    try {
      const response = await fetch('http://localhost:5000/generer-planning', {
        method: 'POST',
      });
  
      const result = await response.json();
  
      if (result.success) {
        alert('Planning généré avec succès !');
  
        // Recharge les données depuis la base après génération
        const reloadResponse = await fetch('http://localhost:5000/');
        const reloadData = await reloadResponse.json();
  
        const transformedRows = reloadData.data.map((item, index) => ({
          id: index + 1,
          date: item.date,
          seance: item.seance,
          salle: item.salle,
          enseignant1: item.professeur_surveillant1,
          enseignant2: item.professeur_surveillant2,
        }));
  
        setRows(transformedRows);
      } else {
        alert('Erreur : ' + result.message);
      }
    } catch (error) {
      console.error('Erreur lors de la génération du planning:', error);
      alert('Erreur lors de la génération du planning');
    }
  };
  
  
  const handleVider = () => {
    console.log('Vider clicked');
  };
  
  const handleExportPlanning = () => {
    window.open(' http://localhost:5000/export-schedule?format=pdf&download=true', '_blank');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Planification des Séances</h2>

      <TableViewTemplate
        columns={columns}
        rows={rows.map(row => ({
          ...row,
          action: <ModifierButton row={row} />
        }))}
      />

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={handleAffecter} style={btnStyle}>Affecter</button>
        <button onClick={handleVider} style={btnStyle}>Vider</button>
    
          {/* 🔽 Nouveau bouton pour export via backend */}
  <button onClick={handleExportPlanning} style={{ ...btnStyle, backgroundColor: '#6c757d' }}>
    Exporter Planning
  </button>      
      </div>
    </div>
  );
};

const btnStyle = {
  padding: '10px 16px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
};

export default MakePlan;