import React from 'react';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import Attendance from './Attendance';
import LeaveRequest from './LeaveRequest';
import Updates from './Updates';
import { Routes, Route } from 'react-router-dom';
import '../css/Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <Routes>
        <Route index element={<MainContent />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leave-request" element={<LeaveRequest />} />
        <Route path="updates" element={<Updates />} />
      </Routes>
    </div>
  );
};

export default Dashboard;
