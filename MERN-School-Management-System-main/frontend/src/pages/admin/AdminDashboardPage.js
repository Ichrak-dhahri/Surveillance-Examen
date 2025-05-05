import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCheck, faUserTimes } from '@fortawesome/free-solid-svg-icons';

const AdminDashboardPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [sortDirection, setSortDirection] = useState('desc');

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/admin/teachers?status=${statusFilter}`
      );
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to load teacher requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [statusFilter]);

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const sortedTeachers = [...teachers].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const handleApprove = async (id) => {
    try {
      await axios.put(`http://localhost:5000/admin/teachers/${id}/approve`);
      toast.success('Teacher approved successfully');
      fetchTeachers();
    } catch (error) {
      console.error('Error approving teacher:', error);
      toast.error('Failed to approve teacher');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason === null) return;

    try {
      await axios.put(`http://localhost:5000/admin/teachers/${id}/reject`, { reason });
      toast.success('Teacher rejected successfully');
      fetchTeachers();
    } catch (error) {
      console.error('Error rejecting teacher:', error);
      toast.error('Failed to reject teacher');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'badge bg-warning text-dark';
      case 'approved':
        return 'badge bg-success';
      case 'rejected':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  };

  return (
    <div className="container-fluid py-4 animate__animated animate__fadeIn">
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-body d-flex flex-column flex-md-row justify-content-between align-items-center">
              <h1 className="h3 mb-3 mb-md-0 fw-bold text-primary">Users Managment</h1>

              <div className="d-flex flex-column flex-sm-row gap-2">
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <i className="bi bi-funnel"></i>
                  </span>
                  <select
                    value={statusFilter}
                    onChange={handleStatusChange}
                    className="form-select"
                    aria-label="Filter status"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <button
                  onClick={toggleSortDirection}
                  className="btn btn-outline-primary d-flex align-items-center justify-content-center"
                >
                  <i className={`bi bi-sort-${sortDirection === 'asc' ? 'up' : 'down'} me-2`}></i>
                  {sortDirection === 'asc' ? 'Oldest First' : 'Newest First'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center my-5">
          <LoadingSpinner />
        </div>
      ) : sortedTeachers.length > 0 ? (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm border-0">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="border-0">Name</th>
                        <th className="border-0">Email</th>
                        <th className="border-0">Subject</th>
                        <th className="border-0">Date</th>
                        <th className="border-0">Status</th>
                        <th className="border-0">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTeachers.map((teacher) => (
                        <tr key={teacher._id}>
                          <td>
                            <span className="fw-medium">
                              {teacher.firstName} {teacher.lastName}
                            </span>
                          </td>
                          <td>{teacher.email}</td>
                          <td>{teacher.subject}</td>
                          <td>{new Date(teacher.createdAt).toLocaleDateString()}</td>
                          <td>
                            <span className={getStatusBadgeClass(teacher.status)}>
                              {teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1)}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              

                              {teacher.status === 'pending' && (
                                <>
                                  <button
                            onClick={() => handleApprove(teacher._id)}
                            className="btn btn-success py-1 px-2"
                            title="Approve"
                          >
                            <FontAwesomeIcon icon={faUserCheck} />
                          </button>


                          <button
                            onClick={() => handleReject(teacher._id)}
                            className="btn btn-danger py-1 px-2"
                            title="Reject"
                          >
                            <FontAwesomeIcon icon={faUserTimes} />
                          </button>

                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm border-0 text-center py-5">
              <p className="text-muted fs-5">
                No {statusFilter} teacher registrations found.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="row g-4">
        <div className="col-md-4">
          <div className="card border-start border-primary border-4 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                  <i className="bi bi-hourglass-split text-primary fs-4"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-0">Pending Requests</h6>
                  <h2 className="mb-0 mt-2 text-primary">
                    {statusFilter === 'pending' ? sortedTeachers.length : '...'}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-start border-success border-4 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                  <i className="bi bi-person-check text-success fs-4"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-0">Approved Teachers</h6>
                  <h2 className="mb-0 mt-2 text-success">
                    {statusFilter === 'approved' ? sortedTeachers.length : '...'}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-start border-danger border-4 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-danger bg-opacity-10 p-3 me-3">
                  <i className="bi bi-person-x text-danger fs-4"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-0">Rejected Applications</h6>
                  <h2 className="mb-0 mt-2 text-danger">
                    {statusFilter === 'rejected' ? sortedTeachers.length : '...'}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;