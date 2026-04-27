import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../css/Sidebar.css';

const API_BASE = process.env.REACT_APP_API_URL;

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/dashboard/attendance', label: 'Attendance', icon: 'fingerprint' },
  { to: '/dashboard/leave-request', label: 'Leave', icon: 'event_busy' },
  { to: '/dashboard/attendance-sheet', label: 'Calendar', icon: 'calendar_month' },
  { to: '/dashboard/organizations', label: 'Team', icon: 'group' },
  { to: '/dashboard/updates', label: 'Updates', icon: 'campaign', hasBadge: true },
];

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const [newUpdates, setNewUpdates] = useState(0);

  const fetchCounts = useCallback(async () => {
    if (!user) return;
    try {
      const updatesRes = await axios.get(`${API_BASE}/api/updates`);
      const updates = Array.isArray(updatesRes.data) ? updatesRes.data : [];
      const lastSeenUpdates = localStorage.getItem('lastSeenUpdatesTime');
      if (lastSeenUpdates) {
        const unseen = updates.filter(u => new Date(u.createdAt) > new Date(lastSeenUpdates));
        setNewUpdates(unseen.length);
      } else {
        setNewUpdates(updates.length);
      }
    } catch (err) {}
  }, [user]);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  useEffect(() => {
    if (location.pathname === '/dashboard/updates') {
      localStorage.setItem('lastSeenUpdatesTime', new Date().toISOString());
      setNewUpdates(0);
    }
  }, [location.pathname]);

  const handleNavClick = () => {
    if (window.innerWidth <= 768) onClose();
  };

  return (
    <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <img src="/images/systum-logo.png" alt="Cloveode" className="logo-img" />
          </div>
          <div className="logo-text">
            <span className="logo-name">Cloveode</span>
            <span className="logo-tier">Technologies</span>
          </div>
        </div>
        <button className="sidebar-close" onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="material-symbols-outlined nav-icon-material">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.hasBadge && newUpdates > 0 && (
              <span className="nav-badge">{newUpdates > 9 ? '9+' : newUpdates}</span>
            )}
          </NavLink>
        ))}
        {isAdmin() && (
          <NavLink
            to="/dashboard/admin-panel"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="material-symbols-outlined nav-icon-material">shield_person</span>
            <span className="nav-label">Admin Panel</span>
          </NavLink>
        )}
      </div>

      <div className="sidebar-footer">
        <NavLink to="/dashboard/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
          <span className="material-symbols-outlined nav-icon-material">settings</span>
          <span className="nav-label">Settings</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default Sidebar;
