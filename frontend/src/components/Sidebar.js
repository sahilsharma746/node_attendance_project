import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import '../css/Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>ATTENDANCE SYSTEM</h1>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink 
          to="/" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          end
        >
          <img src="/images/system.png" alt="Dashboard" className="nav-icon" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink 
          to="/attendance" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <img src="/images/attendance.png" alt="My Attendance" className="nav-icon" />
          <span>My Attendance</span>
        </NavLink>
        <NavLink 
          to="/leave-request" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <img src="/images/request-for-proposal.png" alt="Leave Requests" className="nav-icon" />
          <span>Leave Requests</span>
        </NavLink>
        <NavLink 
          to="/updates" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <img src="/images/updated.png" alt="Updates" className="nav-icon" />
          <span>Updates</span>
        </NavLink>
        <NavLink 
          to="/organization" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <img src="/images/business.png" alt="Organization" className="nav-icon" />
          <span>Organization</span>
          </NavLink>
        <NavLink 
          to="/admin-panel" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <img src="/images/admin-panel.png" alt="Admin Panel" className="nav-icon" />
          <span>Admin Panel</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="theme-toggle">
          <img src="/images/moon.png" alt="Theme" className="theme-icon" />
        </div>
        <div className="user-profile">
          <div className="user-avatar">A</div>
          <div className="user-info">
            <div className="user-name">admin</div>
            <div className="user-role">Admin</div>
          </div>
        </div>
        <button className="sign-out-btn">
          <span>Sign Out</span>
          <img src="/images/log-out.png" alt="Sign Out" className="sign-out-icon" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
