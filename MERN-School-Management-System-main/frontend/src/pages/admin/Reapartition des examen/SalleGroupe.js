import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Alert } from 'react-bootstrap';
import TableViewTemplate from '../../../components/TableViewTemplate';
import axios from 'axios';
import { Pagination } from 'react-bootstrap';
import { TablePagination } from '@mui/material';

const SalleGroupe = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Fetch existing data when component mounts
  useEffect(() => {
    fetchRepartitions();
  }, []);

  const fetchRepartitions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/repartitions');
      if (response.data.success) {
        // Format data for table display
        const formattedRows = response.data.data.map((item, index) => ({
          id: item._id || index + 1,
          salle: item.salle || '',
          groupe: item.groupe || '',
        }));
        setRows(formattedRows);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Impossible de récupérer les données de répartition');
    } finally {
      setLoading(false);
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
      const response = await axios.post('http://localhost:5000/upload-repartition', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setSuccess(`${response.data.message}`);
        // Refresh data after successful upload
        fetchRepartitions();
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

  const columns = [
    { id: 'salle', label: 'Salle', minWidth: 150 },
    { id: 'groupe', label: 'Groupe', minWidth: 150 },
  ];

  // Calculate pagination
  const indexOfLastRow = (page + 1) * rowsPerPage;
  const indexOfFirstRow = page * rowsPerPage;
  const currentRows = rows.slice(indexOfFirstRow, indexOfLastRow);

  // CSS styles for custom scrollbar
  const scrollbarStyles = `
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
    
    /* Style pour rendre l'en-tête fixe */
    .fixed-header th {
      position: sticky;
      top: 0;
      background-color: #fff;
      z-index: 2;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
  `;

  // Surcharger TableViewTemplate pour ajouter l'en-tête fixe
  const CustomTableView = ({ columns, rows, loading }) => {
    return (
      <div className="table-responsive custom-scrollbar" style={{ maxHeight: '350px', overflowY: 'auto' }}>
        <table className="table fixed-header">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  style={{
                    minWidth: column.minWidth,
                    backgroundColor: '#f8f9fa',
                    padding: '12px 16px',
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
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id}>
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
        </table>
      </div>
    );
  };

  return (
    <Card className="calendar-container">
      <style>{scrollbarStyles}</style>
      <Card.Body>
        <h4 className="text-center mb-4 fw-bold">Répartition des salles</h4>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <div className="d-flex justify-content-center mb-4">
          <Button
            variant="outline-success"
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
                <i className="bi bi-file-earmark-excel me-2"></i>
                IMPORTER UN FICHIER EXCEL
              </>
            )}
            <Form.Control
              type="file"
              hidden
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
            />
          </Button>
        </div>

        {/* Remplacer TableViewTemplate par notre version personnalisée */}
        <CustomTableView
          columns={columns}
          rows={currentRows}
          loading={loading}
        />

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
      </Card.Body>
    </Card>
  );
};

export default SalleGroupe;