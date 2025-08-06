import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from '../pages/Login/Register';
import Login from '../pages/Login/Login';
import SelectCompany from '../pages/SelectCompany';
import InterviewRoom from '../pages/InterviewRoom';
import FinalReport from '../pages/FinalReport';
import Introduction from '../pages/Introduction';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/select-company" element={<SelectCompany />} />
        <Route path="/interview" element={<InterviewRoom />} />
        <Route path="/report" element={<FinalReport />} />
        <Route path="/introduction" element={<Introduction />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
