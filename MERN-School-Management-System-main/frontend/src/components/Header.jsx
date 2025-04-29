import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faSignOutAlt, faUserCircle, faTachometerAlt } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, userRole, user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold text-blue-600 transition-colors hover:text-blue-700">
            Teacher<span className="text-teal-500">Portal</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              Home
            </Link>

            {isAuthenticated ? (
              <>
                {userRole === 'teacher' && (
                  <>
                    <Link to="/teacher/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors">
                      Dashboard
                    </Link>
                    <Link to="/teacher/profile" className="text-gray-700 hover:text-blue-600 transition-colors">
                      Profile
                    </Link>
                  </>
                )}

                {userRole === 'admin' && (
                  <Link to="/admin/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors">
                    Dashboard
                  </Link>
                )}

                <div className="flex items-center">
                  <span className="text-gray-600 mr-2">
                    {userRole === 'teacher' ? `${user?.firstName} ${user?.lastName}` : user?.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="btn btn-danger flex items-center"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Register
                </Link>
                <Link to="/admin/login" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Admin Login
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700 focus:outline-none"
            onClick={toggleMenu}
          >
            <FontAwesomeIcon icon={isOpen ? faTimes : faBars} size="lg" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 slide-in">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-blue-600 transition-colors py-2"
                onClick={toggleMenu}
              >
                Home
              </Link>

              {isAuthenticated ? (
                <>
                  {userRole === 'teacher' && (
                    <>
                      <Link 
                        to="/teacher/dashboard" 
                        className="flex items-center text-gray-700 hover:text-blue-600 transition-colors py-2"
                        onClick={toggleMenu}
                      >
                        <FontAwesomeIcon icon={faTachometerAlt} className="mr-2" />
                        Dashboard
                      </Link>
                      <Link 
                        to="/teacher/profile" 
                        className="flex items-center text-gray-700 hover:text-blue-600 transition-colors py-2"
                        onClick={toggleMenu}
                      >
                        <FontAwesomeIcon icon={faUserCircle} className="mr-2" />
                        Profile
                      </Link>
                    </>
                  )}

                  {userRole === 'admin' && (
                    <Link 
                      to="/admin/dashboard" 
                      className="flex items-center text-gray-700 hover:text-blue-600 transition-colors py-2"
                      onClick={toggleMenu}
                    >
                      <FontAwesomeIcon icon={faTachometerAlt} className="mr-2" />
                      Dashboard
                    </Link>
                  )}

                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-gray-600 mb-2">
                      {userRole === 'teacher' ? `${user?.firstName} ${user?.lastName}` : user?.name}
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        toggleMenu();
                      }}
                      className="btn btn-danger flex items-center"
                    >
                      <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-gray-700 hover:text-blue-600 transition-colors py-2"
                    onClick={toggleMenu}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="btn btn-primary my-2"
                    onClick={toggleMenu}
                  >
                    Register
                  </Link>
                  <Link 
                    to="/admin/login" 
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors py-2"
                    onClick={toggleMenu}
                  >
                    Admin Login
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;