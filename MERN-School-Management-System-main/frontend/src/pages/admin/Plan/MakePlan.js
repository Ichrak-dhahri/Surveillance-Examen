import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import TableViewTemplate from '../../../components/TableViewTemplate';

const columns = [
  { id: 'date', label: 'Date', minWidth: 100 },
  { id: 'seance', label: 'Séance', minWidth: 100 },
  { id: 'salle', label: 'Salle', minWidth: 100 },
  { id: 'enseignant1', label: 'Enseignant 1', minWidth: 150 },
  { id: 'enseignant2', label: 'Enseignant 2', minWidth: 150 },
  { id: 'action', label: 'Action', minWidth: 100 }, // Nouvelle colonne
];

const rows = [
  {
    id: 1,
    date: '2025-04-12',
    seance: '08:00 - 10:00',
    salle: 'A101',
    enseignant1: 'Mme Ben Ali',
    enseignant2: 'M. Khemiri',
  },
  {
    id: 2,
    date: '2025-04-13',
    seance: '10:00 - 12:00',
    salle: 'B202',
    enseignant1: 'M. Trabelsi',
    enseignant2: 'Mme Gharbi',
  },
  {
    id: 3,
    date: '2025-04-14',
    seance: '14:00 - 16:00',
    salle: 'C303',
    enseignant1: 'Mme Jaziri',
    enseignant2: 'M. Haddad',
  },
];

const ModifierButton = ({ row }) => {
  const handleClick = () => {
    console.log('Modifier la ligne :', row);
    // Tu peux ouvrir un modal ici si tu veux
  };

  return (
    <button
      onClick={handleClick}
      style={{
        padding: '6px 12px',
        border: 'none',
        backgroundColor: '#007bff',
        color: 'white',
        borderRadius: '4px',
        cursor: 'pointer',
      }}
    >
      Modifier
    </button>
  );
};

const MakePlan = () => {
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Planification des Séances', 14, 15);
    const tableColumn = columns.filter(col => col.id !== 'action').map(col => col.label);
    const tableRows = rows.map(row => [
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
  };

  const handleAffecter = () => {
    console.log('Affecter clicked');
    // Implémente ta logique ici
  };

  const handleVider = () => {
    console.log('Vider clicked');
    // Implémente ta logique ici
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
        <button onClick={handleExportPDF} style={{ ...btnStyle, backgroundColor: '#28a745' }}>Exporter</button>
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
