import React from 'react';
import { useSelector } from 'react-redux';
import { Card, Container } from 'react-bootstrap';

const AdminProfile = () => {
    const { currentUser } = useSelector((state) => state.user);

    return (
        <Container fluid className="min-vh-100 py-5 bg-light mt-5">
            <div className="d-flex justify-content-center align-items-center h-100">
                <Card className="profile-card border-0 shadow-lg" style={{ maxWidth: '400px', width: '100%' }}>
                    <Card.Body className="p-4">
                        <div className="text-center mb-4">
                            <div className="profile-avatar mb-3">
                                <div className="avatar-circle bg-primary d-flex align-items-center justify-content-center">
                                    <i className="bi bi-person-circle fs-1 text-white"></i>
                                </div>
                            </div>
                            <h2 className="fw-bold text-primary mb-1">Profil Administrateur</h2>
                            <div className="text-muted small">Gestion des examens</div>
                        </div>

                        <div className="profile-info">
                            <div className="info-item mb-3 p-3 bg-light rounded-3">
                                <div className="d-flex align-items-center">
                                    <i className="bi bi-person me-3 text-primary"></i>
                                    <div>
                                        <div className="text-muted small">Nom</div>
                                        <div className="fw-semibold">{currentUser.name}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="info-item mb-3 p-3 bg-light rounded-3">
                                <div className="d-flex align-items-center">
                                    <i className="bi bi-envelope me-3 text-primary"></i>
                                    <div>
                                        <div className="text-muted small">Email</div>
                                        <div className="fw-semibold">{currentUser.email}</div>
                                    </div>
                                </div>
                            </div>

                          
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </Container>
    );
};

export default AdminProfile;