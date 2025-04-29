import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faPhone, faBook, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import api from '../../utils/api';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    qualifications: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
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
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (!formData.subject) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.qualifications) {
      newErrors.qualifications = 'Qualifications are required';
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
      const response = await api.post('/api/teachers', formData);
      setIsSuccess(true);
      toast.success('Registration request submitted successfully!');
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        qualifications: '',
      });
      
      // Redirect to success message
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto fade-in">
        <div className="card border-green-500 bg-green-50">
          <div className="text-center mb-6">
            <div className="inline-block bg-green-100 text-green-500 p-3 rounded-full">
              <FontAwesomeIcon icon={faGraduationCap} size="3x" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-green-700 mb-4">Registration Successful!</h1>
          <p className="text-center text-gray-700 mb-6">
            Your registration request has been submitted successfully. The administrator will review your application and you will be notified via email when your account is approved.
          </p>
          <div className="text-center">
            <Link to="/" className="btn btn-primary">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto fade-in">
      <div className="card">
        <h1 className="text-2xl font-bold text-center mb-6">Teacher Pre-Registration</h1>
        <p className="text-gray-600 text-center mb-6">
          Please fill out the form below to submit your registration request. Once approved, you will receive login credentials via email.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">
                <FontAwesomeIcon icon={faUser} className="mr-2" />
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className={`form-input ${errors.firstName ? 'border-red-500' : ''}`}
                placeholder="Enter your first name"
                value={formData.firstName}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.firstName && <div className="form-error">{errors.firstName}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName" className="form-label">
                <FontAwesomeIcon icon={faUser} className="mr-2" />
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                className={`form-input ${errors.lastName ? 'border-red-500' : ''}`}
                placeholder="Enter your last name"
                value={formData.lastName}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.lastName && <div className="form-error">{errors.lastName}</div>}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
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
              <label htmlFor="phone" className="form-label">
                <FontAwesomeIcon icon={faPhone} className="mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className={`form-input ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.phone && <div className="form-error">{errors.phone}</div>}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="subject" className="form-label">
              <FontAwesomeIcon icon={faBook} className="mr-2" />
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              className={`form-input ${errors.subject ? 'border-red-500' : ''}`}
              placeholder="Enter your teaching subject"
              value={formData.subject}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {errors.subject && <div className="form-error">{errors.subject}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="qualifications" className="form-label">
              <FontAwesomeIcon icon={faGraduationCap} className="mr-2" />
              Qualifications
            </label>
            <textarea
              id="qualifications"
              name="qualifications"
              rows="4"
              className={`form-input ${errors.qualifications ? 'border-red-500' : ''}`}
              placeholder="Enter your qualifications and teaching experience"
              value={formData.qualifications}
              onChange={handleChange}
              disabled={isSubmitting}
            ></textarea>
            {errors.qualifications && <div className="form-error">{errors.qualifications}</div>}
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary w-full py-3 mt-4"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Registration Request'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;