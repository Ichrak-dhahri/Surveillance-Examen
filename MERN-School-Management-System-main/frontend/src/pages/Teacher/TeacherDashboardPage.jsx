import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserCircle, 
  faBook, 
 
  faEnvelope, 
  faPhone,
  faEdit
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';

const TeacherDashboardPage = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get('/teachers/profile', {
          withCredentials: true,
        });
        setUser(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
  
    fetchProfile();
  }, [setUser]); // <-- added setUser to dependencies
  
 
  if (!user) {
    return <div className="container py-5 text-center">Loading profile...</div>;
  }
  
  return (
    <div className="container py-4 animate__animated animate__fadeIn">
      <h1 className="mb-4 fw-bold">Teacher Dashboard</h1>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card mb-4 shadow">
            <div className="card-header bg-primary text-white">
              <h2 className="fs-4 fw-bold mb-0">Welcome, {user.firstName}!</h2>
              <p className="text-white-50 mb-0">Your teacher account is active</p>
            </div>

            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h3 className="fs-5 fw-semibold mb-3 pb-2 border-bottom">Personal Information</h3>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center text-secondary mb-1">
                      <FontAwesomeIcon icon={faUserCircle} className="me-2" />
                      <span className="fw-medium">Name:</span>
                    </div>
                    <p className="mb-0">{user.firstName} {user.lastName}</p>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center text-secondary mb-1">
                      <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                      <span className="fw-medium">Email:</span>
                    </div>
                    <p className="mb-0">{user.email}</p>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center text-secondary mb-1">
                      <FontAwesomeIcon icon={faPhone} className="me-2" />
                      <span className="fw-medium">Phone:</span>
                    </div>
                    <p className="mb-0">{user.phone || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <h3 className="fs-5 fw-semibold mb-3 pb-2 border-bottom">Professional Details</h3>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center text-secondary mb-1">
                      <FontAwesomeIcon icon={faBook} className="me-2" />
                      <span className="fw-medium">Subject:</span>
                    </div>
                    <p className="mb-0">{user.subject || 'N/A'}</p>
                  </div>
                  
                 
                  
                  <div>
                    <Link 
                      to="" 
                      className="btn btn-outline-primary mt-3 d-flex align-items-center justify-content-center"
                    >
                      <FontAwesomeIcon icon={faEdit} className="me-2" />
                      Edit Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card mb-4 shadow">
            <div className="card-body">
              <h3 className="fs-5 fw-semibold mb-3">Quick Links</h3>
              
              <div className="list-group">
                <Link 
                  to="" 
                  className="list-group-item list-group-item-action d-flex align-items-center"
                >
                  <FontAwesomeIcon icon={faUserCircle} className="me-2" />
                  Manage Profile
                </Link>
                <Link 
                  to="" 
                  className="list-group-item list-group-item-action d-flex align-items-center"
                >
                  <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                  Change Password
                </Link>
              </div>
            </div>
          </div>
          
          <div className="card bg-light mb-4 shadow">
            <div className="card-body">
              <h3 className="fs-5 fw-semibold mb-2">Welcome to the Portal</h3>
              <p className="text-secondary mb-0">
                Your account has been approved and is now active. Use the links above to manage your teacher profile.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardPage;