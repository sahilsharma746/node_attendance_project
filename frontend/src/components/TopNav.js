import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';
import '../css/TopNav.css';

const UPDATES_API = process.env.REACT_APP_API_URL + '/api/updates';
const LEAVE_API = process.env.REACT_APP_API_URL + '/api/leave';

const TopNav = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);
  const helpRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const [updatesRes, leavesRes] = await Promise.all([
        axios.get(UPDATES_API),
        axios.get(`${LEAVE_API}/my`),
      ]);
      const items = [];

      // Recent updates as notifications
      const updates = Array.isArray(updatesRes.data) ? updatesRes.data.slice(0, 3) : [];
      updates.forEach(u => {
        items.push({ id: u._id, type: 'update', title: u.title, time: u.createdAt, icon: 'campaign' });
      });

      // Recent leave status changes
      const leaves = Array.isArray(leavesRes.data) ? leavesRes.data.slice(0, 5) : [];
      leaves.forEach(l => {
        if (l.status === 'approved' || l.status === 'rejected') {
          items.push({ id: l._id, type: 'leave', title: `Leave ${l.status}: ${l.type} (${l.startDateStr})`, time: l.createdAt, icon: l.status === 'approved' ? 'check_circle' : 'cancel' });
        }
      });

      items.sort((a, b) => new Date(b.time) - new Date(a.time));
      setNotifications(items.slice(0, 6));

      // Check unread based on last seen time
      const lastSeen = localStorage.getItem('lastSeenNotifTime');
      const unread = lastSeen ? items.filter(n => new Date(n.time) > new Date(lastSeen)).length : items.length;
      setUnreadCount(Math.min(unread, 9));
    } catch (err) { /* silent */ }
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (helpRef.current && !helpRef.current.contains(e.target)) setHelpOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleNotif = () => {
    setNotifOpen(!notifOpen);
    setHelpOpen(false);
    if (!notifOpen) {
      localStorage.setItem('lastSeenNotifTime', new Date().toISOString());
      setUnreadCount(0);
    }
  };

  const toggleHelp = () => {
    setHelpOpen(!helpOpen);
    setNotifOpen(false);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.floor((now - d) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <header className="topnav">
      <div className="topnav-right">
        {/* Notifications */}
        <div className="topnav-dropdown-wrap" ref={notifRef}>
          <button className="topnav-icon-btn" title="Notifications" onClick={toggleNotif}>
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && <span className="topnav-notification-dot">{unreadCount}</span>}
          </button>
          {notifOpen && (
            <div className="topnav-dropdown notif-dropdown">
              <div className="topnav-dropdown-header">
                <span>Notifications</span>
              </div>
              {notifications.length === 0 ? (
                <div className="topnav-dropdown-empty">No notifications</div>
              ) : (
                <div className="topnav-dropdown-list">
                  {notifications.map(n => (
                    <div key={n.id} className="topnav-notif-item" onClick={() => {
                      setNotifOpen(false);
                      navigate(n.type === 'leave' ? '/dashboard/leave-request' : '/dashboard/updates');
                    }}>
                      <span className={`material-symbols-outlined topnav-notif-icon ${n.type}`} style={{ fontVariationSettings: "'FILL' 1" }}>{n.icon}</span>
                      <div className="topnav-notif-content">
                        <span className="topnav-notif-title">{n.title}</span>
                        <span className="topnav-notif-time">{formatTime(n.time)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Help */}
        <div className="topnav-dropdown-wrap" ref={helpRef}>
          <button className="topnav-icon-btn" title="Help" onClick={toggleHelp}>
            <span className="material-symbols-outlined">help</span>
          </button>
          {helpOpen && (
            <div className="topnav-dropdown help-dropdown">
              <div className="topnav-dropdown-header"><span>Quick Help</span></div>
              <div className="topnav-dropdown-list">
                <div className="topnav-help-item" onClick={() => { setHelpOpen(false); navigate('/dashboard/leave-request'); }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>event_busy</span>
                  <span>How to apply for leave</span>
                </div>
                <div className="topnav-help-item" onClick={() => { setHelpOpen(false); navigate('/dashboard/attendance'); }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>schedule</span>
                  <span>Punch in / Punch out</span>
                </div>
                <div className="topnav-help-item" onClick={() => { setHelpOpen(false); navigate('/dashboard/attendance-sheet'); }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>calendar_month</span>
                  <span>View team calendar</span>
                </div>
                <div className="topnav-help-item" onClick={() => { setHelpOpen(false); navigate('/dashboard/profile'); }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>settings</span>
                  <span>Account settings</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="topnav-separator"></div>
        <NavLink to="/dashboard/profile" className="topnav-user">
          <div className="topnav-avatar">
            {user?.profilePic ? (
              <img src={user.profilePic} alt="" />
            ) : (
              <span className="topnav-avatar-initials">
                {(user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            )}
          </div>
          <span className="topnav-username">{user?.name?.split(' ')[0] || 'User'}</span>
          <span className="material-symbols-outlined topnav-chevron">expand_more</span>
        </NavLink>
      </div>
    </header>
  );
};

export default TopNav;
