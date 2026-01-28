import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import AdminLeaveRequests from './admin/AdminLeaveRequests';
import AdminAttendance from './admin/AdminAttendance';
import AdminEmployees from './admin/AdminEmployees';
import AdminHolidays from './admin/AdminHolidays';
import AdminNotifications from './admin/AdminNotifications';
import '../css/AdminPanel.css';

const AdminPanel = () => {
  return (
    <div className="admin-panel-container">
      <div className="admin-header">
        <h1 className="admin-title">Admin Panel</h1>
        <p className="admin-subtitle">Manage employees and approve requests</p>
      </div>

      <div className="admin-nav-tabs">
        <NavLink 
          to="/dashboard/admin-panel/leave-requests" 
          className={({ isActive }) => `admin-nav-tab ${isActive ? 'active' : ''}`}
        >
          <img src="/images/request-for-proposal.png" alt="Leave Requests" className="admin-nav-tab-icon" />
          <span>Leave Requests</span>
        </NavLink>
        <NavLink 
          to="/dashboard/admin-panel/attendance" 
          className={({ isActive }) => `admin-nav-tab ${isActive ? 'active' : ''}`}
        >
          <img src="/images/attendance.png" alt="Attendance" className="admin-nav-tab-icon" />
          <span>Attendance</span>
        </NavLink>
        <NavLink 
          to="/dashboard/admin-panel/employees" 
          className={({ isActive }) => `admin-nav-tab ${isActive ? 'active' : ''}`}
        >
        <img src="/images/employee.png" alt="Employees" className="admin-nav-tab-icon" />
          <span>Employees</span>
        </NavLink>
        <NavLink 
          to="/dashboard/admin-panel/holidays" 
          className={({ isActive }) => `admin-nav-tab ${isActive ? 'active' : ''}`}
        >
         <img src="/images/holiday.png" alt="Holidays" className="admin-nav-tab-icon" />
          <span>Holidays</span>
        </NavLink>
        <NavLink 
          to="/dashboard/admin-panel/notifications" 
          className={({ isActive }) => `admin-nav-tab ${isActive ? 'active' : ''}`}
        >
          <img src="/images/notification.png" alt="Notifications" className="admin-nav-tab-icon" />
          <span>Notifications</span>
        </NavLink>
      </div>

      <div className="admin-content">
        <Routes>
          <Route index element={<AdminLeaveRequests />} />
          <Route path="leave-requests" element={<AdminLeaveRequests />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="employees" element={<AdminEmployees />} />
          <Route path="holidays" element={<AdminHolidays />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminPanel;
