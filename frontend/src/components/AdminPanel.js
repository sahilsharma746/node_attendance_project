import React from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import AdminLeaveRequests from './admin/AdminLeaveRequests';
import AdminAttendance from './admin/AdminAttendance';
import AdminEmployees from './admin/AdminEmployees';
import AdminHolidays from './admin/AdminHolidays';
import AdminUpdates from './admin/AdminUpdates';
import '../css/AdminPanel.css';

const TabIcons = {
  leave: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  ),
  attendance: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M9 16l2 2 4-4" />
    </svg>
  ),
  employees: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  holidays: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    </svg>
  ),
  updates: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
};

const AdminPanel = () => {
  const location = useLocation();
  const isAdminPanelIndex = location.pathname === '/dashboard/admin-panel' || location.pathname === '/dashboard/admin-panel/';

  return (
    <div className="admin-panel-container">
      <div className="admin-header">
        <h1 className="admin-title">Admin Panel</h1>
        <p className="admin-subtitle">Manage employees and approve requests</p>
      </div>

      <div className="admin-nav-tabs">
        <NavLink
          to="/dashboard/admin-panel/leave-requests"
          className={({ isActive }) => `admin-nav-tab ${isActive || isAdminPanelIndex ? 'active' : ''}`}
        >
          <span className="admin-nav-tab-icon">{TabIcons.leave}</span>
          <span>Leave Requests</span>
        </NavLink>
        <NavLink
          to="/dashboard/admin-panel/attendance"
          className={({ isActive }) => `admin-nav-tab ${isActive ? 'active' : ''}`}
        >
          <span className="admin-nav-tab-icon">{TabIcons.attendance}</span>
          <span>Attendance</span>
        </NavLink>
        <NavLink
          to="/dashboard/admin-panel/employees"
          className={({ isActive }) => `admin-nav-tab ${isActive ? 'active' : ''}`}
        >
          <span className="admin-nav-tab-icon">{TabIcons.employees}</span>
          <span>Employees</span>
        </NavLink>
        <NavLink
          to="/dashboard/admin-panel/holidays"
          className={({ isActive }) => `admin-nav-tab ${isActive ? 'active' : ''}`}
        >
          <span className="admin-nav-tab-icon">{TabIcons.holidays}</span>
          <span>Holidays</span>
        </NavLink>
        <NavLink
          to="/dashboard/admin-panel/updates"
          className={({ isActive }) => `admin-nav-tab ${isActive ? 'active' : ''}`}
        >
          <span className="admin-nav-tab-icon">{TabIcons.updates}</span>
          <span>Updates</span>
        </NavLink>
      </div>

      <div className="admin-content">
        <Routes>
          <Route index element={<AdminLeaveRequests />} />
          <Route path="leave-requests" element={<AdminLeaveRequests />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="employees" element={<AdminEmployees />} />
          <Route path="holidays" element={<AdminHolidays />} />
          <Route path="updates" element={<AdminUpdates />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminPanel;
