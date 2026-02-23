import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import Attendance from './Attendance';
import LeaveRequest from './LeaveRequest';
import Updates from './Updates';
import Organizations from './Organizations';
import Profile from './Profile';
import AdminPanel from './AdminPanel';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/Dashboard.css';

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

      <Routes>
        <Route index element={<MainContent />} />
        <Route path="attendance" element={<Attendance />} />
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
  );
};

export default Dashboard;
