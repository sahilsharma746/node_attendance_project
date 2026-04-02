import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../css/Sidebar.css';

const API_BASE = process.env.REACT_APP_API_URL;

const Icons = {
  dashboard: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  attendance: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M9 16l2 2 4-4" />
    </svg>
  ),
  attendanceSheet: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  ),
  leave: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  ),
  updates: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  organization: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  profile: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  admin: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  logout: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [newUpdates, setNewUpdates] = useState(0);

  const fetchCounts = useCallback(async () => {
    if (!user) return;
    try {
      // Fetch new updates count for all users
      const updatesRes = await axios.get(`${API_BASE}/api/updates`);
      const updates = Array.isArray(updatesRes.data) ? updatesRes.data : [];
      const lastSeenUpdates = localStorage.getItem('lastSeenUpdatesTime');
      if (lastSeenUpdates) {
        const unseen = updates.filter(u => new Date(u.createdAt) > new Date(lastSeenUpdates));
        setNewUpdates(unseen.length);
      } else {
        setNewUpdates(updates.length);
      }

    } catch (err) {
      // silently fail
    }
  }, [user]);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [fetchCounts]);

  // Mark updates as seen when visiting updates page
  useEffect(() => {
    if (location.pathname === '/dashboard/updates') {
      localStorage.setItem('lastSeenUpdatesTime', new Date().toISOString());
      setNewUpdates(0);
    }
  }, [location.pathname]);

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
          <span className="nav-icon">{Icons.dashboard}</span>
          <span className="nav-item-tooltip">Dashboard</span>
        </NavLink>
        <NavLink
          to="/dashboard/attendance"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
          title="My Attendance"
        >
          <span className="nav-icon">{Icons.attendance}</span>
          <span className="nav-item-tooltip">My Attendance</span>
        </NavLink>
        <NavLink
          to="/dashboard/attendance-sheet"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
          title="Attendance Sheet"
        >
          <span className="nav-icon">{Icons.attendanceSheet}</span>
          <span className="nav-item-tooltip">Attendance Sheet</span>
        </NavLink>
        <NavLink
          to="/dashboard/leave-request"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
          title="Leave Requests"
        >
          <span className="nav-icon">{Icons.leave}</span>
          <span className="nav-item-tooltip">Leave Requests</span>
        </NavLink>
        <NavLink
          to="/dashboard/updates"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
          title="Updates"
        >
          <span className="nav-icon">
            {Icons.updates}
            {newUpdates > 0 && (
              <span className="nav-badge">{newUpdates > 9 ? '9+' : newUpdates}</span>
            )}
          </span>
          <span className="nav-item-tooltip">Updates</span>
        </NavLink>
        <NavLink
          to="/dashboard/organizations"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
          title="Organizations"
        >
          <span className="nav-icon">{Icons.organization}</span>
          <span className="nav-item-tooltip">Organizations</span>
        </NavLink>
        <NavLink
          to="/dashboard/profile"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
          title="Profile"
        >
          <span className="nav-icon">{Icons.profile}</span>
          <span className="nav-item-tooltip">Profile</span>
        </NavLink>
        {isAdmin() && (
          <NavLink
            to="/dashboard/admin-panel"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
            title="Admin Panel"
          >
            <span className="nav-icon">{Icons.admin}</span>
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
          <span className="sign-out-icon">{Icons.logout}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
