import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, Users } from 'lucide-react';

const Homepage = () => {
  return (
    <div className="min-vh-100 bg-gradient-custom d-flex align-items-center">
      <div className="container">
        <div className="row align-items-center g-4">
          {/* Left Column - Hero Image */}
          <div className="col-md-6 order-2 order-md-1">
            <img
              src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1200"
              alt="Students studying"
              className="img-fluid rounded-4 shadow"
            />
          </div>

          {/* Right Column - Content */}
          <div className="col-md-6 order-1 order-md-2">
            <div className="d-flex flex-column gap-4">
              <span className="badge badge-purple d-inline-flex align-items-center py-2 px-3 rounded-pill">
                <GraduationCap className="me-2" size={16} />
                ISSAT SOUSSE
              </span>

              <h1 className="display-4 fw-bold">
  WISHES YOU
  <span className="d-block text-purple mt-2">WELCOME</span>
</h1>

<p className="lead text-secondary">
  Let's take the initiative together, let's improve our ISSAT
</p>


              <div className="d-flex flex-column gap-3">
                <Link 
                  to="/choose"
                  className="btn btn-purple text-white d-flex align-items-center justify-content-center py-3"
                >
                  Login
                  <ArrowRight className="ms-2 btn-arrow-icon" size={16} />
                </Link>

                <div className="d-flex align-items-center justify-content-center gap-2 text-secondary">
                  <Users size={16} />
                  <span>Don't have an account?</span>
                  <Link 
                    to="/Adminregister" 
                    className="text-purple text-decoration-none fw-medium"
                  >
                    Sign up
                  </Link>
                </div>
              </div>

              <div className="row text-center mt-4">
                <div className="col-4">
                  <div className="stats-number">50+</div>
                  <div className="stats-label">Teachers</div>
                </div>
                <div className="col-4">
                  <div className="stats-number">1000+</div>
                  <div className="stats-label">Students</div>
                </div>
                <div className="col-4">
                  <div className="stats-number">15+</div>
                  <div className="stats-label">Programs</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;