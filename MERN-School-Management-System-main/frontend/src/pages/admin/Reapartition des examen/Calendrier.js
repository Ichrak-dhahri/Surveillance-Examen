import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Container, Card, Button, Table, Pagination, Form } from 'react-bootstrap';
import SalleGroupe from './SalleGroupe';

const CalendarUpload = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [calendarData, setCalendarData] = useState([]);

  const columns = [
    { id: 'date', label: 'Date', minWidth: 100 },
    { id: 'seance', label: 'Séance', minWidth: 100 },
    { id: 'codeMatiere', label: 'Code Matière', minWidth: 130 },
    { id: 'filiere', label: 'Filière', minWidth: 130 },
    { id: 'specialite', label: 'Spécialité', minWidth: 130 }
  ];

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      const mappedData = jsonData.map((row, index) => ({
        id: index,
        date: row["Date"] || "",
        seance: row["Seance"] || "",
        codeMatiere: row["CodeMatiere"] || "",
        specialite: row["Specialite"] || "",
        filiere: row["Filiere"] || ""
      }));
      setCalendarData(mappedData);
    };
    reader.readAsArrayBuffer(file);
  };

  // Calculate pagination
  const totalPages = Math.ceil(calendarData.length / rowsPerPage);
  const indexOfLastRow = (page + 1) * rowsPerPage;
  const indexOfFirstRow = page * rowsPerPage;
  const currentRows = calendarData.slice(indexOfFirstRow, indexOfLastRow);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setPage(pageNumber - 1);
  };

  // Generate pagination items
  const paginationItems = [];
  for (let number = 1; number <= totalPages; number++) {
    paginationItems.push(
      <Pagination.Item 
        key={number} 
        active={number === page + 1}
        onClick={() => handlePageChange(number)}
      >
        {number}
      </Pagination.Item>
    );
  }

  return (
    <Container fluid className="py-4">
      <Card className="calendar-container">
        <Card.Body>
          <h4 className="text-center mb-4 fw-bold">Calendrier des Examens</h4>

          <div className="d-flex justify-content-center mb-4">
            <Button
              variant="outline-primary"
              className="file-upload-btn d-flex align-items-center"
              as="label"
            >
              <i className="bi bi-upload me-2"></i>
              Importer un fichier Excel
              <Form.Control 
                type="file" 
                accept=".xlsx, .xls" 
                hidden 
                onChange={handleFileUpload} 
              />
            </Button>
          </div>

          <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>

            <Table className="custom-table">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.id} style={{ minWidth: column.minWidth, position: 'sticky', top: 0, zIndex: 1 }}>
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentRows.length > 0 ? (
                  currentRows.map((row) => (
                    <tr key={row.id} className="new-row">
                      {columns.map((column) => (
                        <td key={column.id}>{row[column.id]}</td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-4">
                      Aucune donnée disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {calendarData.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                <Form.Select 
                  className="d-inline-block me-2" 
                  style={{ width: 'auto' }}
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                >
                  <option value={5}>5 par page</option>
                  <option value={10}>10 par page</option>
                  <option value={25}>25 par page</option>
                </Form.Select>
                <span className="text-muted">
                  Affichage {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, calendarData.length)} sur {calendarData.length} entrées
                </span>
              </div>
              <Pagination>
                <Pagination.First 
                  onClick={() => handlePageChange(1)} 
                  disabled={page === 0}
                />
                <Pagination.Prev 
                  onClick={() => handlePageChange(page)} 
                  disabled={page === 0}
                />
                {paginationItems}
                <Pagination.Next 
                  onClick={() => handlePageChange(page + 2)} 
                  disabled={page === totalPages - 1}
                />
                <Pagination.Last 
                  onClick={() => handlePageChange(totalPages)} 
                  disabled={page === totalPages - 1}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      <SalleGroupe />
    </Container>
  );
};

export default CalendarUpload;