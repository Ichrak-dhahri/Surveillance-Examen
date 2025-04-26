import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Card, Button, Form } from 'react-bootstrap';
import TableViewTemplate from '../../../components/TableViewTemplate';

const SalleGroupe = () => {
  const [rows, setRows] = useState([]);

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { raw: true });

      const formattedRows = json.map((row, index) => ({
        id: index + 1,
        salle: row.Salle || '',
        groupe: row.Groupe || '',
      }));

      setRows(formattedRows);
    };

    reader.readAsArrayBuffer(file);
  };

  const columns = [
    { id: 'salle', label: 'Salle', minWidth: 150 },
    { id: 'groupe', label: 'Groupe', minWidth: 150 },
  ];

  return (
    <Card className="calendar-container">
      <Card.Body>
        <h4 className="text-center mb-4 fw-bold">Répartition des salles</h4>

        <div className="d-flex justify-content-center mb-4">
          <Button
            variant="outline-success"
            className="file-upload-btn d-flex align-items-center"
            as="label"
          >
            <i className="bi bi-file-earmark-excel me-2"></i>
            IMPORTER UN FICHIER EXCEL
            <Form.Control
              type="file"
              hidden
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
            />
          </Button>
        </div>

        <TableViewTemplate columns={columns} rows={rows} />
      </Card.Body>
    </Card>
  );
};

export default SalleGroupe;