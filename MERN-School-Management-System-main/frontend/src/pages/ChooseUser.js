import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { UserCog, Users, GraduationCap, Loader2 } from 'lucide-react';
import { loginUser } from '../redux/userRelated/userHandle';
import Popup from '../components/Popup';

const ChooseUser = ({ visitor }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const password = "zxc";

  const { status, currentUser, currentRole } = useSelector(state => state.user);

  const [loader, setLoader] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState("");

  const navigateHandler = (user) => {
    if (user === "Admin") {
      if (visitor === "guest") {
        const email = "yogendra@12";
        const fields = { email, password };
        setLoader(true);
        dispatch(loginUser(fields, user));
      } else {
        navigate('/Adminlogin');
      }
    } else if (user === "Student") {
      if (visitor === "guest") {
        const rollNum = "1";
        const studentName = "Dipesh Awasthi";
        const fields = { rollNum, studentName, password };
        setLoader(true);
        dispatch(loginUser(fields, user));
      } else {
        navigate('/Studentlogin');
      }
    } else if (user === "Teacher") {
      if (visitor === "guest") {
        const email = "tony@12";
        const fields = { email, password };
        setLoader(true);
        dispatch(loginUser(fields, user));
      } else {
        navigate('/Teacherlogin');
      }
    }
  };

  useEffect(() => {
    if (status === 'success' || currentUser !== null) {
      if (currentRole === 'Admin') {
        navigate('/Admin/dashboard');
      } else if (currentRole === 'Student') {
        navigate('/Student/dashboard');
      } else if (currentRole === 'Teacher') {
        navigate('/Teacher/dashboard');
      }
    } else if (status === 'error') {
      setLoader(false);
      setMessage("Network Error");
      setShowPopup(true);
    }
  }, [status, currentRole, navigate, currentUser]);

  const userCards = [
    {
      title: 'Admin',
      icon: UserCog,
      description: 'Login as an administrator to access the dashboard to manage app data.',
      onClick: () => navigateHandler("Admin")
    },
    {
      title: 'Teacher',
      icon: Users,
      description: 'Login as a teacher to Consult the exam schedule',
      onClick: () => navigateHandler("Teacher")
    },
   
  ];

  return (
    <div className="min-vh-100 bg-gradient-custom d-flex align-items-center py-5">
      <div className="container">
        <h2 className="text-center mb-5 display-5 fw-bold text-primary">Choose Your Role</h2>
        <div className="row justify-content-center g-4">
          {userCards.map((card, index) => (
            <div key={index} className="col-12 col-md-6 col-lg-4">
              <div className="card card-hover h-100 p-4" onClick={card.onClick}>
                <div className="icon-wrapper">
                  <card.icon size={28} />
                </div>
                <div className="card-body text-center">
                  <h3 className="card-title h4 mb-3">{card.title}</h3>
                  <p className="card-text text-muted">{card.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {loader && (
        <div className="position-fixed top-0 start-0 w-100 h-100 loading-backdrop d-flex align-items-center justify-content-center">
          <div className="spinner-wrapper">
            <Loader2 className="animate-spin" size={40} />
            <span>Please Wait</span>
          </div>
        </div>
      )}
      
      <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
    </div>
  );
};

export default ChooseUser;