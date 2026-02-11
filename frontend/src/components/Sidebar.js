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
    <div className={`sidebar collapsed ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
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
          title="Dashboard"
        >
          <img src="/images/dashboard.png" alt="Dashboard" className="nav-icon" />
          <span className="nav-item-tooltip">Dashboard</span>
        </NavLink>
        <NavLink 
          to="/dashboard/attendance" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
          title="My Attendance"
        >
          <img src="/images/appointment.png" alt="My Attendance" className="nav-icon" />
          <span className="nav-item-tooltip">My Attendance</span>
        </NavLink>
        <NavLink 
          to="/dashboard/leave-request" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
          title="Leave Requests"
        >
          <img src="/images/anonymous.png" alt="Leave Requests" className="nav-icon" />
          <span className="nav-item-tooltip">Leave Requests</span>
        </NavLink>
        <NavLink 
          to="/dashboard/updates" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
          title="Updates"
        >
          <img src="/images/share.png" alt="Updates" className="nav-icon" />
          <span className="nav-item-tooltip">Updates</span>
        </NavLink>
        <NavLink 
          to="/dashboard/organizations" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
          title="Organizations"
        >
          <img src="/images/division.png" alt="Organizations" className="nav-icon" />
          <span className="nav-item-tooltip">Organizations</span>
        </NavLink>
        <NavLink 
          to="/dashboard/profile" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
          title="Profile"
        >
          <img src="/images/user-profile.png" alt="Profile" className="nav-icon" />
          <span className="nav-item-tooltip">Profile</span>
        </NavLink>
        {isAdmin() && (
          <NavLink 
            to="/dashboard/admin-panel" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
            title="Admin Panel"
          >
            <img src="/images/optimization.png" alt="Admin Panel" className="nav-icon" />
            <span className="nav-item-tooltip">Admin Panel</span>
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
        <button className="sign-out-btn" onClick={handleLogout} title="Sign Out">
          <span className="nav-item-tooltip">Sign Out</span>
          <img src="/images/log-out-new.png" alt="Sign Out" className="sign-out-icon" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
