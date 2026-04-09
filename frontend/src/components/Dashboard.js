import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import Attendance from './Attendance';
import LeaveRequest from './LeaveRequest';
import Updates from './Updates';
import Organizations from './Organizations';
import Profile from './Profile';
import AdminPanel from './AdminPanel';
import AttendanceSheet from './AttendanceSheet';
import Analytics from './Analytics';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/Dashboard.css';
import '../css/WelcomeBanner.css';

const AdminRoute = ({ children }) => {
  const { isAdmin } = useAuth();
  return isAdmin() ? children : <Navigate to="/dashboard" replace />;
};

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 769px)');
    const onChange = (e) => {
      if (e.matches) setSidebarOpen(false);
    };

    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {!sidebarOpen && (
        <button
          type="button"
          className="sidebar-toggle"
          aria-label="Open menu"
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
      )}

      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className="dashboard-content">
        <div className="welcome-banner">
          <div className="welcome-left">
            <p className="welcome-label">Welcome to</p>
            <h2 className="welcome-company">Cloveode Technologies Pvt Ltd</h2>
            <p className="welcome-tagline">Software & Web Development Company</p>
          </div>
          <div className="welcome-right">
            <span className="welcome-icon">&#60;/&#62;</span>
          </div>
        </div>

        <Routes>
        <Route index element={<MainContent />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="attendance-sheet" element={<AttendanceSheet />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="leave-request" element={<LeaveRequest />} />
        <Route path="updates" element={<Updates />} />
        <Route path="organizations" element={<Organizations />} />
        <Route path="profile" element={<Profile />} />
        <Route
          path="admin-panel/*"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />
      </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
