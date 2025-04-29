import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserTie, faCheckCircle, faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';

const HomePage = () => {
  const { isAuthenticated, userRole } = useAuth();

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-teal-500 text-white py-16 px-4 rounded-lg mb-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Teacher Registration Portal</h1>
          <p className="text-xl mb-8">
            A streamlined platform for teacher pre-registration and account management.
          </p>
          {!isAuthenticated ? (
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register" className="btn bg-white text-blue-600 hover:bg-gray-100 text-lg py-3 px-8 rounded-full font-semibold">
                Register Now
              </Link>
              <Link to="/login" className="btn bg-transparent border-2 border-white text-white hover:bg-white/10 text-lg py-3 px-8 rounded-full font-semibold">
                Login
              </Link>
            </div>
          ) : (
            <Link 
              to={userRole === 'admin' ? '/admin/dashboard' : '/teacher/dashboard'} 
              className="btn bg-white text-blue-600 hover:bg-gray-100 text-lg py-3 px-8 rounded-full font-semibold"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-center mb-10">How It Works</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faUserTie} size="2x" />
            </div>
            <h3 className="text-xl font-semibold mb-3">1. Register</h3>
            <p className="text-gray-600">
              Complete the pre-registration form with your professional details and credentials.
            </p>
          </div>
          
          <div className="card text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faCheckCircle} size="2x" />
            </div>
            <h3 className="text-xl font-semibold mb-3">2. Get Approved</h3>
            <p className="text-gray-600">
              Administrators review and approve your application based on your qualifications.
            </p>
          </div>
          
          <div className="card text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faEnvelope} size="2x" />
            </div>
            <h3 className="text-xl font-semibold mb-3">3. Receive Email</h3>
            <p className="text-gray-600">
              Get your temporary password via email and access your new account.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16 px-4 rounded-lg mb-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Key Features</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex">
              <div className="mr-4 text-blue-600">
                <FontAwesomeIcon icon={faUserTie} size="2x" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Streamlined Registration</h3>
                <p className="text-gray-600">
                  Simple and intuitive pre-registration process designed specifically for teachers.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="mr-4 text-blue-600">
                <FontAwesomeIcon icon={faCheckCircle} size="2x" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Administrative Review</h3>
                <p className="text-gray-600">
                  Thorough screening process ensures only qualified teachers are approved.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="mr-4 text-blue-600">
                <FontAwesomeIcon icon={faEnvelope} size="2x" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Automated Notifications</h3>
                <p className="text-gray-600">
                  Receive timely email updates about your application status.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="mr-4 text-blue-600">
                <FontAwesomeIcon icon={faLock} size="2x" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Secure Account Setup</h3>
                <p className="text-gray-600">
                  Enhanced security with temporary password and mandatory password change on first login.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Ready to Join?</h2>
        <p className="text-xl text-gray-600 mb-8">
          Start your registration process today and become a part of our teaching community.
        </p>
        {!isAuthenticated ? (
          <Link to="/register" className="btn btn-primary text-lg py-3 px-10 rounded-full">
            Register Now
          </Link>
        ) : (
          <p className="text-lg font-medium text-blue-600">
            You're already registered! Head to your dashboard to manage your account.
          </p>
        )}
      </section>
    </div>
  );
};

export default HomePage;