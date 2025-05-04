import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faCheck, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const ChangePasswordPage = () => {
  const { isFirstLogin, updateFirstLoginStatus } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear any errors for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await api.put('/teachers/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      // Update first login status in context
      updateFirstLoginStatus(false);
      
      toast.success('Password changed successfully');
      
      // Redirect to dashboard
      navigate('/teacher/dashboard');
    } catch (error) {
      console.error('Error changing password:', error);
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto fade-in">
      <div className="card">
        <h1 className="text-2xl font-bold text-center mb-6">Change Password</h1>
        
        {isFirstLogin && (
          <div className="alert alert-info mb-6 flex items-start">
            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-3 mt-1" />
            <div>
              <p className="font-semibold">First Login Detected</p>
              <p>You need to change your temporary password before you can access your account.</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="currentPassword" className="form-label">
              <FontAwesomeIcon icon={faLock} className="mr-2" />
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              className={`form-input ${errors.currentPassword ? 'border-red-500' : ''}`}
              placeholder="Enter your current password"
              value={formData.currentPassword}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {errors.currentPassword && <div className="form-error">{errors.currentPassword}</div>}
            {isFirstLogin && (
              <p className="text-sm text-gray-600 mt-1">
                Use the temporary password sent to your email
              </p>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="newPassword" className="form-label">
              <FontAwesomeIcon icon={faLock} className="mr-2" />
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              className={`form-input ${errors.newPassword ? 'border-red-500' : ''}`}
              placeholder="Enter your new password"
              value={formData.newPassword}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {errors.newPassword && <div className="form-error">{errors.newPassword}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              <FontAwesomeIcon icon={faCheck} className="mr-2" />
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className={`form-input ${errors.confirmPassword ? 'border-red-500' : ''}`}
              placeholder="Confirm your new password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
          </div>
          
          <button
            type="submit"
            className="btn btn-primary w-full py-3 mt-4"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;