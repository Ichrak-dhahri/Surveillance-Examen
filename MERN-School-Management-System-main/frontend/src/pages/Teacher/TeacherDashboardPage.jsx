import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserCircle, 
  faBook, 
  faCalendarAlt, 
  faEnvelope, 
  faPhone,
  faEdit
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const TeacherDashboardPage = () => {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teacherDetails, setTeacherDetails] = useState(null);

  useEffect(() => {
    const fetchTeacherDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/teachers/profile');
        setTeacherDetails(response.data);
      } catch (error) {
        console.error('Error fetching teacher details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userRole === 'teacher') {
      fetchTeacherDetails();
    }
  }, [userRole]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!teacherDetails) {
    return (
      <div className="card text-center py-8">
        <p className="text-xl text-red-500">Failed to load teacher information</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h1 className="text-3xl font-bold mb-8">Teacher Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="bg-blue-600 text-white px-6 py-4">
              <h2 className="text-2xl font-bold">Welcome, {teacherDetails.firstName}!</h2>
              <p className="text-blue-100">Your teacher account is active</p>
            </div>

            <div className="p-6">
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold mb-4 border-b pb-2">Personal Information</h3>
                  
                  <div className="mb-3">
                    <div className="flex items-center text-gray-600 mb-1">
                      <FontAwesomeIcon icon={faUserCircle} className="mr-2" />
                      <span className="font-medium">Name:</span>
                    </div>
                    <p>{teacherDetails.firstName} {teacherDetails.lastName}</p>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center text-gray-600 mb-1">
                      <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                      <span className="font-medium">Email:</span>
                    </div>
                    <p>{teacherDetails.email}</p>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center text-gray-600 mb-1">
                      <FontAwesomeIcon icon={faPhone} className="mr-2" />
                      <span className="font-medium">Phone:</span>
                    </div>
                    <p>{teacherDetails.phone}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4 border-b pb-2">Professional Details</h3>
                  
                  <div className="mb-3">
                    <div className="flex items-center text-gray-600 mb-1">
                      <FontAwesomeIcon icon={faBook} className="mr-2" />
                      <span className="font-medium">Subject:</span>
                    </div>
                    <p>{teacherDetails.subject}</p>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center text-gray-600 mb-1">
                      <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                      <span className="font-medium">Member Since:</span>
                    </div>
                    <p>{new Date(teacherDetails.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <Link 
                      to="/teacher/profile" 
                      className="btn btn-outline mt-4 flex items-center justify-center w-full sm:w-auto"
                    >
                      <FontAwesomeIcon icon={faEdit} className="mr-2" />
                      Edit Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/teacher/profile" 
                  className="block px-4 py-2 bg-gray-50 hover:bg-blue-50 rounded-md text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faUserCircle} className="mr-2" />
                  Manage Profile
                </Link>
              </li>
              <li>
                <Link 
                  to="/change-password" 
                  className="block px-4 py-2 bg-gray-50 hover:bg-blue-50 rounded-md text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                  Change Password
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="card mt-6 bg-blue-50">
            <h3 className="text-lg font-semibold mb-2">Welcome to the Portal</h3>
            <p className="text-gray-700">
              Your account has been approved and is now active. Use the links above to manage your teacher profile.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardPage;