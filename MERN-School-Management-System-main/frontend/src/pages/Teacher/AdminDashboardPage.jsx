import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserCheck, 
  faUserTimes, 
  faEye, 
  faFilter,
  faUserPlus,
  faSortAmountDown,
  faSortAmountUp
} from '@fortawesome/free-solid-svg-icons';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminDashboardPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [sortDirection, setSortDirection] = useState('desc');

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/teachers?status=${statusFilter}`);
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
    return sortDirection === 'asc' 
      ? dateA - dateB 
      : dateB - dateA;
  });

  const handleApprove = async (id) => {
    try {
      await api.put(`/api/admin/teachers/${id}/approve`);
      toast.success('Teacher approved successfully');
      fetchTeachers();
    } catch (error) {
      console.error('Error approving teacher:', error);
      toast.error('Failed to approve teacher');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason === null) return; // User canceled

    try {
      await api.put(`/api/admin/teachers/${id}/reject`, { reason });
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
        return 'status-badge status-pending';
      case 'approved':
        return 'status-badge status-approved';
      case 'rejected':
        return 'status-badge status-rejected';
      default:
        return 'status-badge';
    }
  };

  return (
    <div className="fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Admin Dashboard</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faFilter} className="mr-2 text-gray-500" />
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="form-input py-1 px-3"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <button 
            onClick={toggleSortDirection}
            className="btn btn-outline py-1 flex items-center justify-center"
          >
            <FontAwesomeIcon 
              icon={sortDirection === 'asc' ? faSortAmountUp : faSortAmountDown} 
              className="mr-2" 
            />
            {sortDirection === 'asc' ? 'Oldest First' : 'Newest First'}
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : sortedTeachers.length > 0 ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTeachers.map((teacher) => (
                <tr key={teacher._id}>
                  <td>
                    {teacher.firstName} {teacher.lastName}
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
                    <div className="flex space-x-2">
                      <Link
                        to={`/admin/teachers/${teacher._id}`}
                        className="btn btn-outline py-1 px-2"
                        title="View Details"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </Link>
                      
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
      ) : (
        <div className="card text-center py-8">
          <p className="text-xl text-gray-500">
            No {statusFilter} teacher registrations found.
          </p>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="card bg-blue-50 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-blue-700 mb-2">Pending Requests</h3>
          <p className="text-3xl font-bold text-blue-600">
            {statusFilter === 'pending' ? sortedTeachers.length : '...'}
          </p>
        </div>
        
        <div className="card bg-green-50 border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-green-700 mb-2">Approved Teachers</h3>
          <p className="text-3xl font-bold text-green-600">
            {statusFilter === 'approved' ? sortedTeachers.length : '...'}
          </p>
        </div>
        
        <div className="card bg-red-50 border-l-4 border-red-500">
          <h3 className="text-lg font-semibold text-red-700 mb-2">Rejected Applications</h3>
          <p className="text-3xl font-bold text-red-600">
            {statusFilter === 'rejected' ? sortedTeachers.length : '...'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;