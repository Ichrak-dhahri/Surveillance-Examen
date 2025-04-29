import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faUserCheck, 
  faUserTimes,
  faEnvelope,
  faPhone,
  faBook,
  faGraduationCap,
  faCalendarAlt,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const TeacherDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTeacherDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/admin/teachers/${id}`);
        setTeacher(response.data);
        setRejectionReason(response.data.rejectionReason || '');
      } catch (error) {
        console.error('Error fetching teacher details:', error);
        toast.error('Failed to load teacher details');
        navigate('/admin/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherDetails();
  }, [id, navigate]);

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      await api.put(`/api/admin/teachers/${id}/approve`);
      toast.success('Teacher approved successfully');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error approving teacher:', error);
      toast.error('Failed to approve teacher');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.put(`/api/admin/teachers/${id}/reject`, { reason: rejectionReason });
      toast.success('Teacher rejected successfully');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error rejecting teacher:', error);
      toast.error('Failed to reject teacher');
    } finally {
      setIsSubmitting(false);
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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!teacher) {
    return (
      <div className="card text-center py-8">
        <p className="text-xl text-red-500">Teacher not found</p>
        <Link to="/admin/dashboard" className="btn btn-primary mt-4">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="flex items-center mb-6">
        <Link to="/admin/dashboard" className="mr-4 text-blue-600 hover:text-blue-700">
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </Link>
        <h1 className="text-3xl font-bold">Teacher Details</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="bg-blue-600 text-white px-6 py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h2 className="text-2xl font-bold">
                {teacher.firstName} {teacher.lastName}
              </h2>
              <p className="text-blue-100">{teacher.subject} Teacher</p>
            </div>
            <span className={`${getStatusBadgeClass(teacher.status)} mt-2 md:mt-0`}>
              {teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 border-b pb-2">Personal Information</h3>
              
              <div className="mb-3">
                <div className="flex items-center text-gray-600 mb-1">
                  <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                  <span className="font-medium">Email:</span>
                </div>
                <p>{teacher.email}</p>
              </div>
              
              <div className="mb-3">
                <div className="flex items-center text-gray-600 mb-1">
                  <FontAwesomeIcon icon={faPhone} className="mr-2" />
                  <span className="font-medium">Phone:</span>
                </div>
                <p>{teacher.phone}</p>
              </div>
              
              <div className="mb-3">
                <div className="flex items-center text-gray-600 mb-1">
                  <FontAwesomeIcon icon={faBook} className="mr-2" />
                  <span className="font-medium">Subject:</span>
                </div>
                <p>{teacher.subject}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4 border-b pb-2">Application Details</h3>
              
              <div className="mb-3">
                <div className="flex items-center text-gray-600 mb-1">
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                  <span className="font-medium">Application Date:</span>
                </div>
                <p>{new Date(teacher.createdAt).toLocaleDateString()} {new Date(teacher.createdAt).toLocaleTimeString()}</p>
              </div>
              
              <div className="mb-3">
                <div className="flex items-center text-gray-600 mb-1">
                  <FontAwesomeIcon icon={faGraduationCap} className="mr-2" />
                  <span className="font-medium">Qualifications:</span>
                </div>
                <p className="whitespace-pre-wrap">{teacher.qualifications}</p>
              </div>
              
              {teacher.status === 'rejected' && teacher.rejectionReason && (
                <div className="mb-3">
                  <div className="flex items-center text-gray-600 mb-1">
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                    <span className="font-medium">Rejection Reason:</span>
                  </div>
                  <p className="text-red-600">{teacher.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {teacher.status === 'pending' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Application Decision</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <button
                onClick={handleApprove}
                className="btn btn-success w-full flex items-center justify-center"
                disabled={isSubmitting}
              >
                <FontAwesomeIcon icon={faUserCheck} className="mr-2" />
                Approve Application
              </button>
              <p className="text-sm text-gray-600 mt-2">
                An email with login credentials will be sent to the teacher automatically.
              </p>
            </div>
            
            <div>
              <div className="form-group mb-3">
                <label htmlFor="rejectionReason" className="form-label">
                  Rejection Reason (required for rejections)
                </label>
                <textarea
                  id="rejectionReason"
                  className="form-input"
                  rows="3"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection"
                  disabled={isSubmitting}
                ></textarea>
              </div>
              <button
                onClick={handleReject}
                className="btn btn-danger w-full flex items-center justify-center"
                disabled={isSubmitting}
              >
                <FontAwesomeIcon icon={faUserTimes} className="mr-2" />
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDetailsPage;