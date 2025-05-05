import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container, Row, Col, Card, ListGroup, Button, Badge, Form,
  Modal, Alert, Spinner, Nav, ProgressBar
} from 'react-bootstrap';
import {
  PersonCircle, Book, Calendar, Envelope, Telephone,
  PencilSquare, Lock, Speedometer2, BoxArrowRight,
  Bell, GraphUp, Lightning, Award, CheckCircle, GearFill, 
  FileEarmarkText, People, ChevronRight
} from 'react-bootstrap-icons';

const Home = () => {
  const [teacherDetails, setTeacherDetails] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [feedback, setFeedback] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("teacherToken");
      try {
        const res = await axios.get("http://localhost:5000/teachers/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeacherDetails(res.data);
        setFormData(res.data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch teacher profile", error);
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async () => {
    const token = localStorage.getItem("teacherToken");
    try {
      const res = await axios.put("http://localhost:5000/teachers/profile", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeacherDetails(res.data);
      setEditMode(false);
      setFeedback("Profile updated successfully ✅");
      setTimeout(() => setFeedback(""), 3000);
    } catch (error) {
      console.error("Error updating profile", error);
      setFeedback("Error updating profile ❌");
      setTimeout(() => setFeedback(""), 3000);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    const token = localStorage.getItem("teacherToken");
    try {
      await axios.put(`http://localhost:5000/teachers/${teacherDetails._id}/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPasswordSuccess("Password successfully updated");
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (error) {
      console.error("Error changing password", error);
      setPasswordError(error.response?.data?.message || "Failed to update password. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("teacherToken");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center">
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Loading your profile...</span>
      </div>
    );
  }

  if (!teacherDetails) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">
          Unable to load profile. Please try logging in again.
        </Alert>
        <Button variant="primary" onClick={() => navigate("/login")}>
          Back to Login
        </Button>
      </Container>
    );
  }
  const handleExportPlanning = () => {
    window.open(' http://localhost:5000/export-schedule?format=pdf&download=true', '_blank');
  };

  const renderOverviewTab = () => (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">Dashboard Overview</h3>
        <div className="d-flex align-items-center">
          <Badge bg="success" className="me-2 px-3 py-2">
            <CheckCircle className="me-1" /> Active Account
          </Badge>
          <Button variant="outline-primary" size="sm" className="ms-2" onClick={() => setEditMode(true)}>
            <PencilSquare className="me-1" /> Edit Profile
          </Button>
        </div>
      </div>

      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100 dashboard-card">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                  <FileEarmarkText className="text-primary fs-3" />
                </div>
                <div>
                  <h5 className="mb-0">Upcoming Exams</h5>
                  <p className="text-muted small mb-0">Next 7 days</p>
                </div>
              </div>
              <h2 className="display-6 fw-bold mb-0">3</h2>
              <div className="mt-auto text-end">
                <a href="#" className="text-decoration-none">View all <ChevronRight /></a>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100 dashboard-card">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <div className="bg-success bg-opacity-10 p-3 rounded-3 me-3">
                  <People className="text-success fs-3" />
                </div>
                <div>
                  <h5 className="mb-0">Total Students</h5>
                  <p className="text-muted small mb-0">Under your supervision</p>
                </div>
              </div>
              <h2 className="display-6 fw-bold mb-0">124</h2>
              <div className="mt-auto text-end">
                <a href="#" className="text-decoration-none">View all <ChevronRight /></a>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100 dashboard-card">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <div className="bg-warning bg-opacity-10 p-3 rounded-3 me-3">
                  <Award className="text-warning fs-3" />
                </div>
                <div>
                  <h5 className="mb-0">Completed Exams</h5>
                  <p className="text-muted small mb-0">This semester</p>
                </div>
              </div>
              <h2 className="display-6 fw-bold mb-0">18</h2>
              <div className="mt-auto text-end">
                <a href="#" className="text-decoration-none">View all <ChevronRight /></a>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 pt-4 pb-0 px-4">
              <h4 className="fw-bold mb-0">Upcoming Schedule</h4>
            </Card.Header>
            <Card.Body className="px-4">
              <ListGroup variant="flush">
                <ListGroup.Item className="px-0 py-3 border-bottom">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                      <Calendar className="text-primary" />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between">
                        <h6 className="mb-0 fw-bold">Final Mathematics Exam</h6>
                        <Badge bg="primary" className="rounded-pill">Tomorrow</Badge>
                      </div>
                      <p className="text-muted mb-0 small">Room 302 • 9:00 AM - 11:00 AM</p>
                    </div>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="px-0 py-3 border-bottom">
                  <div className="d-flex align-items-center">
                    <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                      <Calendar className="text-success" />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between">
                        <h6 className="mb-0 fw-bold">Physics Mid-term</h6>
                        <Badge bg="success" className="rounded-pill">May 07</Badge>
                      </div>
                      <p className="text-muted mb-0 small">Room 105 • 1:00 PM - 3:00 PM</p>
                    </div>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="px-0 py-3">
                  <div className="d-flex align-items-center">
                    <div className="bg-info bg-opacity-10 p-3 rounded me-3">
                      <Calendar className="text-info" />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between">
                        <h6 className="mb-0 fw-bold">Chemistry Practical Exam</h6>
                        <Badge bg="info" className="rounded-pill">May 10</Badge>
                      </div>
                      <p className="text-muted mb-0 small">Lab 3 • 10:00 AM - 12:30 PM</p>
                    </div>
                  </div>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
            <Card.Footer className="bg-white border-0 text-center">
              <Button variant="outline-primary" size="sm">View Full Schedule</Button>
            </Card.Footer>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 pt-4 pb-0 px-4">
              <h4 className="fw-bold mb-0">Quick Stats</h4>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-1">
                  <span className="fw-semibold">Exam Completion</span>
                  <span>70%</span>
                </div>
                <ProgressBar now={70} variant="success" className="rounded-pill" />
              </div>
              
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-1">
                  <span className="fw-semibold">Papers Graded</span>
                  <span>45%</span>
                </div>
                <ProgressBar now={45} variant="warning" className="rounded-pill" />
              </div>
              
              <div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="fw-semibold">Semester Progress</span>
                  <span>85%</span>
                </div>
                <ProgressBar now={85} variant="info" className="rounded-pill" />
              </div>
            </Card.Body>
          </Card>
          
          <Card className="border-0 shadow-sm bg-gradient-primary text-white">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center mb-4">
                <Lightning className="fs-3 me-2" />
                <h4 className="mb-0 fw-bold">Need Help?</h4>
              </div>
              <p>Access resources, support, and training materials to enhance your teaching experience.</p>
              <Button variant="light" className="w-100">Access Support Center</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );

  const renderProfileTab = () => (
    <>
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white border-0 pt-4 px-4">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="fw-bold mb-0">Profile Information</h3>
            {!editMode && (
              <Button variant="primary" onClick={() => setEditMode(true)}>
                <PencilSquare className="me-2" /> Edit
              </Button>
            )}
          </div>
        </Card.Header>

        <Card.Body className="p-4">
          {editMode ? (
            <>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control name="firstName" value={formData.firstName || ''} onChange={handleChange} className="py-2" />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control name="lastName" value={formData.lastName || ''} onChange={handleChange} className="py-2" />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control name="email" value={formData.email || ''} onChange={handleChange} className="py-2" />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control name="phone" value={formData.phone || ''} onChange={handleChange} className="py-2" />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Subject</Form.Label>
                    <Form.Control name="subject" value={formData.subject || ''} onChange={handleChange} className="py-2" />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Member Since</Form.Label>
                    <Form.Control value={new Date(teacherDetails.createdAt).toLocaleDateString()} disabled className="py-2" />
                  </Form.Group>
                
                </Col>
              </Row>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button variant="outline-secondary" onClick={() => setEditMode(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleUpdate}>Save Changes</Button>
              </div>

              {feedback && (
                <Alert variant={feedback.includes("✅") ? "success" : "danger"} className="mt-3">
                  {feedback}
                </Alert>
              )}
            </>
          ) : (
            <Row className="g-4">
              <Col md={6}>
                <div className="bg-light p-4 rounded-3 h-100">
                  <h3 className="fs-5 fw-semibold mb-4">Personal Information</h3>
                  <div className="mb-3 d-flex">
                    <PersonCircle className="me-3 text-primary fs-4" />
                    <div>
                      <div className="text-muted small">Full Name</div>
                      <p className="fw-semibold mb-0">{teacherDetails.firstName} {teacherDetails.lastName}</p>
                    </div>
                  </div>
                  <div className="mb-3 d-flex">
                    <Envelope className="me-3 text-primary fs-4" />
                    <div>
                      <div className="text-muted small">Email Address</div>
                      <p className="fw-semibold mb-0">{teacherDetails.email}</p>
                    </div>
                  </div>
                  <div className="mb-0 d-flex">
                    <Telephone className="me-3 text-primary fs-4" />
                    <div>
                      <div className="text-muted small">Phone Number</div>
                      <p className="fw-semibold mb-0">{teacherDetails.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="bg-light p-4 rounded-3 h-100">
                  <h3 className="fs-5 fw-semibold mb-4">Professional Details</h3>
                  <div className="mb-3 d-flex">
                    <Book className="me-3 text-primary fs-4" />
                    <div>
                      <div className="text-muted small">Subject</div>
                      <p className="fw-semibold mb-0">{teacherDetails.subject || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="mb-3 d-flex">
                    <Calendar className="me-3 text-primary fs-4" />
                    <div>
                      <div className="text-muted small">Member Since</div>
                      <p className="fw-semibold mb-0">{new Date(teacherDetails.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                </div>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 pt-4 px-4">
          <h3 className="fw-bold mb-0">Account Security</h3>
        </Card.Header>
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 mb-3">
            <div className="d-flex align-items-center">
              <Lock className="me-3 text-primary fs-4" />
              <div>
                <h5 className="mb-0">Password</h5>
                <p className="text-muted mb-0 small">Last changed: 30 days ago</p>
              </div>
            </div>
            <Button variant="outline-primary" onClick={() => setShowPasswordModal(true)}>
              Change Password
            </Button>
          </div>
          
          
        </Card.Body>
      </Card>
    </>
  );

  return (
    <div className="bg-light min-vh-100">
      <Container fluid className="p-0">
        <div className="bg-primary text-white py-4 px-4">
          <Container>
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <div className="bg-white p-2 rounded-circle me-3">
                  <PersonCircle className="text-primary fs-3" />
                </div>
                <div>
                  <h1 className="h3 fw-bold mb-0">{teacherDetails.firstName} {teacherDetails.lastName}</h1>
                  <p className="mb-0 opacity-75">{teacherDetails.subject} Teacher</p>
                </div>
              </div>
              <div className="d-none d-md-flex align-items-center">
                <Button variant="light" size="sm" className="d-flex align-items-center" onClick={handleLogout}>
                  <BoxArrowRight className="me-2" /> Logout
                </Button>
                
              </div>
            </div>
          </Container>
        </div>
        
        <Container className="py-4">
          <Nav variant="pills" className="mb-4" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Nav.Item>
              <Nav.Link eventKey="overview" className="fw-semibold">
                <Speedometer2 className="me-2" /> Overview
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="profile" className="fw-semibold">
                <PersonCircle className="me-2" /> Profile
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="exams" className="fw-semibold">
                <FileEarmarkText className="me-2" /> Exams Affectaion
              </Nav.Link>
            </Nav.Item>
           
          </Nav>
          
          {activeTab === "overview" && renderOverviewTab()}
          {activeTab === "profile" && renderProfileTab()}
          {activeTab === "exams" && (
            <div className="text-center py-5">
              <FileEarmarkText className="text-primary mb-3" style={{ fontSize: "3rem" }} />
              <h3>Exam Management</h3>
              <p className="text-muted">View and manage your upcoming exams here.</p>
              <button onClick={handleExportPlanning}>
    Exporter Planning
  </button> 
            </div>
          )}
          {activeTab === "students" && (
            <div className="text-center py-5">
              <People className="text-primary mb-3" style={{ fontSize: "3rem" }} />
              <h3>Student Management</h3>
              <p className="text-muted">Access your student lists and performance reports.</p>
              <Button variant="primary">View Students</Button>
            </div>
          )}
        </Container>
      </Container>

      {/* Password Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold"><Lock className="me-2" /> Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          {passwordError && <Alert variant="danger">{passwordError}</Alert>}
          {passwordSuccess && <Alert variant="success">{passwordSuccess}</Alert>}
          <Form onSubmit={handlePasswordSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Current Password</Form.Label>
              <Form.Control
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
                className="py-2"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                className="py-2"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                className="py-2"
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="outline-secondary" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Update Password</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <style jsx>{`
        .bg-gradient-primary {
          background: linear-gradient(135deg, #4361ee, #3f37c9);
        }
        .dashboard-card:hover {
          transform: translateY(-5px);
          transition: transform 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default Home;