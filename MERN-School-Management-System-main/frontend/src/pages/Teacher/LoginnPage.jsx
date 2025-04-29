import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope} from '@fortawesome/free-solid-svg-icons';

const LoginnPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { email, password } = formData;
      const success = await login(email, password, 'teacher');
      
      if (success) {
        // Redirect will be handled by the ProtectedRoute component
        // based on isFirstLogin and user role
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto fade-in">
      <div className="card">
        <h1 className="text-2xl font-bold text-center mb-6">Teacher Login</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={`form-input ${errors.email ? 'border-red-500' : ''}`}
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className={`form-input ${errors.password ? 'border-red-500' : ''}`}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary w-full py-3 mt-4"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline">
              Register here
            </Link>
          </p>
          <p className="text-gray-600 mt-2">
            <Link to="/admin/login" className="text-gray-500 hover:underline text-sm">
              Admin Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginnPage;