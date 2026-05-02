import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/Organizations.css';

const API_BASE = process.env.REACT_APP_API_URL;

const Organizations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [onLeaveToday, setOnLeaveToday] = useState([]);
  const [upcomingLeaves, setUpcomingLeaves] = useState([]);
  const [inOffice, setInOffice] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const [usersRes, leaveRes, officeRes] = await Promise.all([
        axios.get(`${API_BASE}/api/auth/users`),
        axios.get(`${API_BASE}/api/leave/on-leave-today`),
        axios.get(`${API_BASE}/api/attendance/in-office`),
      ]);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setOnLeaveToday(Array.isArray(leaveRes.data) ? leaveRes.data : []);
      setInOffice(Array.isArray(officeRes.data) ? officeRes.data : []);
    } catch (err) { console.error('Team fetch error:', err); }
    finally { setLoading(false); }
    // Fetch upcoming leaves in background (non-blocking)
    axios.get(`${API_BASE}/api/leave/upcoming`)
      .then(res => setUpcomingLeaves(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const getStatus = (u) => {
    const onLeave = onLeaveToday.find(l => l.user?._id === u._id || l.user?.email === u.email);
    if (onLeave) return 'leave';
    const office = inOffice.find(e => e.user?._id === u._id || e.user?.email === u.email);
    if (office) return 'available';
    return 'offline';
  };

  const getStatusBadge = (status) => {
    if (status === 'available') return { label: 'Available', className: 'tm-badge-available', icon: null };
    if (status === 'leave') return { label: 'On Leave', className: 'tm-badge-leave', icon: 'flight_takeoff' };
    return { label: 'Offline', className: 'tm-badge-offline', icon: null };
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
    });
  };

  const filteredUsers = users.filter(u => {
    if (statusFilter === 'all') return true;
    return getStatus(u) === statusFilter;
  });

  const upcomingLeavesDisplay = upcomingLeaves.slice(0, 5);

  if (loading) return <div className="tm"><h1 className="tm-title">Team Availability Today</h1><p className="tm-subtitle">Loading...</p></div>;

  return (
    <div className="tm">
      <div className="tm-header">
        <div>
          <h1 className="tm-title">Team Availability Today</h1>
          <p className="tm-subtitle">Real-time overview of your workforce status.</p>
        </div>
        <div className="tm-header-actions">
          <button className="tm-btn-outline" onClick={() => {
            const rows = [['Name', 'Role', 'Status']];
            filteredUsers.forEach(u => {
              rows.push([u.name, u.role || 'Employee', getStatus(u)]);
            });
            const csv = rows.map(r => r.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'team-report.csv'; a.click();
            URL.revokeObjectURL(url);
          }}>
            <span className="material-symbols-outlined" style={{fontSize:18}}>download</span>
            Export Report
          </button>
        </div>
      </div>

      <div className="tm-layout">
        {/* Sidebar Filters */}
        <div className="tm-sidebar">
          <div className="tm-card">
            <h2 className="tm-card-title">Filters</h2>
            <div className="tm-filter-section">
              <label className="tm-filter-label">Status</label>
              <div className="tm-filter-chips">
                <button className={`tm-chip ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>All</button>
                <button className={`tm-chip ${statusFilter === 'available' ? 'active' : ''}`} onClick={() => setStatusFilter('available')}>Available</button>
                <button className={`tm-chip ${statusFilter === 'leave' ? 'active' : ''}`} onClick={() => setStatusFilter('leave')}>On Leave</button>
                <button className={`tm-chip ${statusFilter === 'offline' ? 'active' : ''}`} onClick={() => setStatusFilter('offline')}>Offline</button>
              </div>
            </div>
          </div>

          <div className="tm-card">
            <div className="tm-upcoming-header">
              <h2 className="tm-card-title tm-card-title-sm">Upcoming Leaves</h2>
              <span className="material-symbols-outlined tm-icon-muted">calendar_month</span>
            </div>
            {upcomingLeavesDisplay.length === 0 ? (
              <p className="tm-empty-text">No upcoming leaves</p>
            ) : (
              <div className="tm-upcoming-list">
                {upcomingLeavesDisplay.map(l => (
                  <div key={l._id} className="tm-upcoming-item">
                    <div className="tm-upcoming-avatar">
                      {l.user?.profilePic ? <img src={l.user.profilePic} alt="" /> : getInitials(l.user?.name)}
                    </div>
                    <div className="tm-upcoming-info">
                      <span className="tm-upcoming-name">{l.user?.name || 'Unknown'}</span>
                      <span className="tm-upcoming-dates">{l.startDateStr} {l.startDateStr !== l.endDateStr ? `- ${l.endDateStr}` : ''}</span>
                    </div>
                    <span className="tm-upcoming-type">{l.type}</span>
                  </div>
                ))}
              </div>
            )}
            <button className="tm-view-all-btn" onClick={() => navigate('/dashboard/attendance-sheet')}>View All Schedule</button>
          </div>
        </div>

        {/* Team Grid */}
        <div className="tm-grid">
          {filteredUsers.length === 0 ? (
            <div className="tm-card tm-empty-card"><p className="tm-empty-text">No team members found</p></div>
          ) : (
            filteredUsers.map(u => {
              const status = getStatus(u);
              const badge = getStatusBadge(status);
              return (
                <div key={u._id} className={`tm-card tm-member-card ${status === 'leave' ? 'on-leave' : ''}`}>
                  <div className={`tm-member-badge ${badge.className}`}>
                    {badge.icon && <span className="material-symbols-outlined" style={{fontSize:14}}>{badge.icon}</span>}
                    {!badge.icon && status === 'available' && <div className="tm-badge-dot"></div>}
                    <span>{badge.label}</span>
                  </div>
                  <div className="tm-member-avatar">
                    {u.profilePic ? (
                      <img src={u.profilePic} alt="" className={status === 'leave' ? 'grayscale' : ''} />
                    ) : (
                      <div className={`tm-avatar-initials ${status === 'leave' ? 'grayscale' : ''}`}>{getInitials(u.name)}</div>
                    )}
                  </div>
                  <h3 className="tm-member-name">{u.name || u.email}</h3>
                  <p className="tm-member-role">{u.role === 'admin' ? 'Administrator' : u.role === 'employee' ? 'Employee' : 'Team Member'}</p>
                  <div className="tm-member-info">
                    {status === 'leave' ? (
                      <div className="tm-info-center">
                        <span className="tm-info-label">Status</span>
                        <span className="tm-info-value">On Leave</span>
                      </div>
                    ) : (
                      <>
                        <div className="tm-info-left">
                          <span className="tm-info-label">Status</span>
                          <span className="tm-info-value">{status === 'available' ? 'In Office' : 'Offline'}</span>
                        </div>
                        <div className="tm-info-right">
                          <span className="tm-info-label">Local Time</span>
                          <span className="tm-info-value">{getCurrentTime()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Organizations;
