import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/Sidebar.css';

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleNavClick = () => {
    if (window.innerWidth <= 768) onClose();
  };

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
    <div className={`sidebar ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
      <div className="sidebar-header">
        <h1>ATTENDANCE SYSTEM</h1>
        <button
          type="button"
          className="sidebar-close"
          onClick={onClose}
          aria-label="Close menu"
        >
          ×
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          end
          onClick={handleNavClick}
        >
          <img src="/images/icons8-dashboard-48.png" alt="Dashboard" className="nav-icon" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink 
          to="/dashboard/attendance" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
        >
          <img src="/images/icons8-attendance-40.png" alt="My Attendance" className="nav-icon" />
          <span>My Attendance</span>
        </NavLink>
        <NavLink 
          to="/dashboard/leave-request" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
        >
          <img src="/images/icons8-leave-house-48.png" alt="Leave Requests" className="nav-icon" />
          <span>Leave Requests</span>
        </NavLink>
        <NavLink 
          to="/dashboard/updates" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
        >
          <img src="/images/icons8-update-64.png" alt="Updates" className="nav-icon" />
          <span>Updates</span>
        </NavLink>
        <NavLink 
          to="/dashboard/organizations" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
        >
          <img src="/images/icons8-organisation-50.png" alt="Organization" className="nav-icon" />
          <span>Organizations</span>
          </NavLink>
        <NavLink 
          to="/dashboard/profile" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
        >
          <img src="/images/icons8-image-100.png" alt="Profile" className="nav-icon" />
          <span>Profile</span>
        </NavLink>
        {isAdmin() && (
          <NavLink 
            to="/dashboard/admin-panel" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <img src="/images/icons8-admin.gif" alt="Admin Panel" className="nav-icon" />
            <span>Admin Panel</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            {user?.profilePic ? (
              <img src={user.profilePic} alt="" />
            ) : (
              getInitials(user?.name)
            )}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-role">{getRoleDisplay(user?.role)}</div>
          </div>
        </div>
        <button className="sign-out-btn" onClick={handleLogout}>
          <span>Sign Out</span>
          <img src="/images/icons8-logoff-company-server-portal-for-businessman-website-64.png" alt="Sign Out" className="sign-out-icon" />
        </button>
      </div>
    </div>
  );
};


export default Sidebar;
