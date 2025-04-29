import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Table, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import SalleGroupe from './SalleGroupe';
import { TablePagination } from '@mui/material';

const CalendarUpload = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const columns = [
    { id: 'date', label: 'Date', minWidth: 100 },
    { id: 'seance', label: 'Séance', minWidth: 100 },
    { id: 'codeMatiere', label: 'Code Matière', minWidth: 130 },
    { id: 'filiere', label: 'Filière', minWidth: 130 },
    { id: 'specialite', label: 'Spécialité', minWidth: 130 }
  ];

  // Fetch existing calendar data when component mounts
  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/examens');
      if (response.data.success) {
        // Format data for table display
        const mappedData = response.data.data.map((item, index) => ({
          id: item._id || index,
          // Format date to display only day, month, year
          date: formatDate(item.date),
          seance: item.seance || "",
          codeMatiere: item.CodeMatiere || "", // Match the mapping in controller
          filiere: item.filiere || "",
          specialite: item.specialite || ""
        }));
        setCalendarData(mappedData);
      }
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setError('Impossible de récupérer les données du calendrier');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    
    try {
      // Parse the date string (handles various input formats)
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return dateString;
      
      // Format to DD/MM/YYYY
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString; // Return original string if formatting fails
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Create form data to send file
      const formData = new FormData();
      formData.append('file', file);

      // Upload file to server
      const response = await axios.post('http://localhost:5000/upload-calendrier', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setSuccess(`${response.data.message}`);
        // Refresh data after successful upload
        fetchCalendarData();
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err.response?.data?.error || 'Erreur lors du téléchargement du fichier');
    } finally {
      setLoading(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  // Calculate pagination
  const indexOfLastRow = (page + 1) * rowsPerPage;
  const indexOfFirstRow = page * rowsPerPage;
  const currentRows = calendarData.slice(indexOfFirstRow, indexOfLastRow);

  // CSS styles for custom scrollbar and fixed header
  const customStyles = `
    /* Styles pour personnaliser la scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
    
    /* Pour Firefox */
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #888 #f1f1f1;
    }
    
    /* Style pour l'en-tête fixe */
    .custom-table thead tr th {
      position: sticky;
      top: 0;
      background-color: #f8f9fa;
      z-index: 2;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
  `;

  return (
    <Container fluid className="py-4 mt-auto overflow: 'hidden' ">
      <style>{customStyles}</style>
      <Card className="calendar-container">
        <Card.Body>
          <h4 className="text-center mb-4 fw-bold">Calendrier des Examens</h4>

          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <div className="d-flex justify-content-center mb-4">
            <Button
              variant="outline-primary"
              className="file-upload-btn d-flex align-items-center"
              as="label"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Chargement...
                </>
              ) : (
                <>
                  <i className="bi bi-upload me-2"></i>
                  Importer un fichier Excel
                </>
              )}
              <Form.Control 
                type="file" 
                accept=".xlsx, .xls" 
                hidden 
                onChange={handleFileUpload} 
              />
            </Button>
          </div>

          <div className="table-responsive custom-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <Table className="custom-table table-hover">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th 
                      key={column.id} 
                      style={{ 
                        minWidth: column.minWidth, 
                        padding: '12px 16px'
                      }}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-4">
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Chargement des données...
                    </td>
                  </tr>
                ) : currentRows.length > 0 ? (
                  currentRows.map((row) => (
                    <tr key={row.id} className="new-row">
                      {columns.map((column) => (
                        <td key={column.id} style={{ padding: '10px 16px' }}>
                          {row[column.id]}
                        </td>
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
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={calendarData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </Card.Body>
      </Card>

      <SalleGroupe />
    </Container>
  );
};

export default CalendarUpload;