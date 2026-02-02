import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplay = (role) => {
    if (!role) return 'User';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>ATTENDANCE SYSTEM</h1>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          end
        >
          <img src="/images/system.png" alt="Dashboard" className="nav-icon" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink 
          to="/dashboard/attendance" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <img src="/images/attendance.png" alt="My Attendance" className="nav-icon" />
          <span>My Attendance</span>
        </NavLink>
        <NavLink 
          to="/dashboard/leave-request" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <img src="/images/request-for-proposal.png" alt="Leave Requests" className="nav-icon" />
          <span>Leave Requests</span>
        </NavLink>
        <NavLink 
          to="/dashboard/updates" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <img src="/images/updated.png" alt="Updates" className="nav-icon" />
          <span>Updates</span>
        </NavLink>
        <NavLink 
          to="/dashboard/organizations" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <img src="/images/business.png" alt="Organization" className="nav-icon" />
          <span>Organizations</span>
          </NavLink>
        {isAdmin() && (
          <NavLink 
            to="/dashboard/admin-panel" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <img src="/images/admin-panel.png" alt="Admin Panel" className="nav-icon" />
            <span>Admin Panel</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">{getInitials(user?.name)}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-role">{getRoleDisplay(user?.role)}</div>
          </div>
        </div>
        <button className="sign-out-btn" onClick={handleLogout}>
          <span>Sign Out</span>
          <img src="/images/log-out.png" alt="Sign Out" className="sign-out-icon" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
