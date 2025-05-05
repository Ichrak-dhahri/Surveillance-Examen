import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
  Grade as GradeIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

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
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.subject) newErrors.subject = 'Subject is required';
    if (!formData.qualifications) newErrors.qualifications = 'Qualifications are required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const { data } = await axios.post('http://localhost:5000/teachers/register', formData);
      setIsSubmitting(false);
      setIsSuccess(true);
      toast.success(data.message || 'Registration request submitted successfully!');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        qualifications: '',
      });
      setTimeout(() => navigate('/'), 5000);
    } catch (error) {
      setIsSubmitting(false);
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  if (isSuccess) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Paper elevation={6} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" fontWeight="bold" color="success.main">
            Registration Successful!
          </Typography>
          <Typography sx={{ mt: 2, mb: 3 }}>
            Your registration request has been submitted. This is a simulated message without backend integration.
          </Typography>
          <Button variant="contained" component={Link} to="/" color="primary">
            Return to Home
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" px={2}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 800, width: '100%' }}>
        <Typography variant="h4" textAlign="center" gutterBottom fontWeight="bold">
          Teacher Pre-Registration
        </Typography>
        <Typography variant="body1" textAlign="center" sx={{ mb: 3 }}>
          Please fill out the form below to submit your registration request.
          Once approved, you will receive login credentials via email.
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {[
              { label: 'First Name', name: 'firstName', icon: <PersonIcon /> },
              { label: 'Last Name', name: 'lastName', icon: <PersonIcon /> },
              { label: 'Email Address', name: 'email', icon: <EmailIcon /> },
              { label: 'Phone Number', name: 'phone', icon: <PhoneIcon /> },
              { label: 'Subject', name: 'subject', icon: <SchoolIcon /> },
            ].map((field, index) => (
              <Grid item xs={12} md={6} key={index}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label={field.label}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  error={Boolean(errors[field.name])}
                  helperText={errors[field.name]}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">{field.icon}</InputAdornment>,
                  }}
                />
              </Grid>
            ))}

            <Grid item xs={12}>
              <TextField
                fullWidth
                variant="outlined"
                multiline
                rows={4}
                label="Qualifications"
                name="qualifications"
                value={formData.qualifications}
                onChange={handleChange}
                disabled={isSubmitting}
                error={Boolean(errors.qualifications)}
                helperText={errors.qualifications}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <GradeIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                type="submit"
                sx={{ py: 1.5 }}
                disabled={isSubmitting}
                startIcon={isSubmitting && <CircularProgress size={20} />}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Registration Request'}
              </Button>
            </Grid>
          </Grid>
        </form>

        <Box textAlign="center" mt={4}>
          <Typography variant="body2">
            Already have an account?{' '}
            <Link to="/Teacherlogin" style={{ color: '#1976d2', textDecoration: 'none' }}>
              Login here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegisterPage;
