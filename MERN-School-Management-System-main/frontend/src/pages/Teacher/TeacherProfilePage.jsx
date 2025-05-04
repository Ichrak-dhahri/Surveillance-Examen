import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faEnvelope, 
  faPhone, 
  faBook, 
  faGraduationCap,
  faSave,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const TeacherProfilePage = () => {
  const { updateUserData } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    qualifications: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchTeacherProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/teachers/profile');
        const { firstName, lastName, email, phone, subject, qualifications } = response.data;
        
        setFormData({
          firstName: firstName || '',
          lastName: lastName || '',
          email: email || '',
          phone: phone || '',
          subject: subject || '',
          qualifications: qualifications || ''
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear any errors for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
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
    
    try {
      setIsSubmitting(true);
      const response = await api.put('/teachers/profile', formData);
      
      // Update user data in context
      updateUserData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      });
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-3xl mx-auto fade-in">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-4 text-blue-600 hover:text-blue-700">
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <h1 className="text-3xl font-bold">Edit Profile</h1>
      </div>
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                value={formData.lastName}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.lastName && <div className="form-error">{errors.lastName}</div>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              value={formData.qualifications}
              onChange={handleChange}
              disabled={isSubmitting}
            ></textarea>
            {errors.qualifications && <div className="form-error">{errors.qualifications}</div>}
          </div>
          
          <div className="mt-6">
            <button
              type="submit"
              className="btn btn-primary flex items-center justify-center"
              disabled={isSubmitting}
            >
              <FontAwesomeIcon icon={faSave} className="mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherProfilePage;