import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import Homepage from './pages/Homepage';
import AdminDashboard from './pages/admin/AdminDashboard';
import LoginPage from './pages/LoginPage';
import AdminRegisterPage from './pages/admin/AdminRegisterPage';
import ChooseUser from './pages/ChooseUser';
import AddTeacher from './pages/admin/TeacherRelated/AddTeacher';
import ShowTeachers from './pages/admin/TeacherRelated/showTeachers';
import AdminHomePage from './pages/admin/AdminHomePage';
import MakePlan from './pages/admin/Plan/MakePlan';

import RegisterPage from "./pages/Teacher/RegisterPage.jsx"

//import AdminDashboardPage from './pages/Teacher/AdminDashboardPage';


import Home from './pages/Teacher/home.jsx';

const App = () => {
  const { currentRole } = useSelector(state => state.user);

  return (
    <Router>
      {currentRole === null &&
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/choose" element={<ChooseUser visitor="normal" />} />
          <Route path="/Adminlogin" element={<LoginPage role="Admin" />} />
          <Route path="/Adminregister" element={<AdminRegisterPage />} />
          <Route path="/Admin/Teachers" element={<AddTeacher />} />
          <Route path="/Admin/showTeacher" element={<ShowTeachers />} />
          <Route path="/Admin/homePage" element={<AdminHomePage />} />
          <Route path="/Teacherlogin" element={<LoginPage role="Teacher" />} />
          <Route path="/Admin/Plan" element={<MakePlan />} />
          <Route path="/Register" element={<RegisterPage />} />
  <Route path="/Admin/dashboard" element={<AdminDashboard />} /> 
          <Route path="/Home" element={<Home role="Teacher" />} />

          
          <Route path='*' element={<Navigate to="/" />} />
        </Routes>
      }

      {currentRole === "Admin" &&
        <AdminDashboard />
      }
    </Router>
  );
};

export default App;
