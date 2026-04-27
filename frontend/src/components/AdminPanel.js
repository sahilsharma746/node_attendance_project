import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AdminLeaveRequests from './admin/AdminLeaveRequests';
import AdminAttendance from './admin/AdminAttendance';
import AdminEmployees from './admin/AdminEmployees';
import AdminHolidays from './admin/AdminHolidays';
import AdminUpdates from './admin/AdminUpdates';
import '../css/AdminPanel.css';

const API_BASE = process.env.REACT_APP_API_URL;

const AdminOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ employees: 0, pendingLeaves: 0, onLeave: 0, late: 0 });
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', urgent: false });
  const [postLoading, setPostLoading] = useState(false);
  const [postMsg, setPostMsg] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const [usersRes, leavesRes, onLeaveRes, attendanceRes] = await Promise.all([
        axios.get(`${API_BASE}/api/auth/users`),
        axios.get(`${API_BASE}/api/leave/admin?status=pending`),
        axios.get(`${API_BASE}/api/leave/on-leave-today`),
        axios.get(`${API_BASE}/api/attendance/records?month=${month}&year=${year}`),
      ]);
      const users = Array.isArray(usersRes.data) ? usersRes.data : [];
      const leaves = Array.isArray(leavesRes.data) ? leavesRes.data : [];
      const onLeave = Array.isArray(onLeaveRes.data) ? onLeaveRes.data : [];
      const records = Array.isArray(attendanceRes.data) ? attendanceRes.data : [];
      // Count late arrivals today (after 10:05 AM)
      const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      let lateCount = 0;
      records.forEach(r => {
        if (r.dateStr === todayStr && r.checkIn) {
          const match = r.checkIn.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (match) {
            let h = parseInt(match[1]);
            const m = parseInt(match[2]);
            const isPM = match[3].toUpperCase() === 'PM';
            if (isPM && h !== 12) h += 12;
            if (!isPM && h === 12) h = 0;
            if (h > 10 || (h === 10 && m > 5)) lateCount++;
          }
        }
      });
      setStats({ employees: users.length, pendingLeaves: leaves.length, onLeave: onLeave.length, late: lateCount });
      setPendingLeaves(leaves.slice(0, 3));
    } catch (err) { console.error('Admin fetch error:', err); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePost = async () => {
    if (!announcementForm.title.trim()) return;
    setPostLoading(true); setPostMsg(null);
    try {
      await axios.post(`${API_BASE}/api/updates`, { title: announcementForm.title, content: announcementForm.content });
      setPostMsg({ type: 'success', text: 'Posted!' });
      setAnnouncementForm({ title: '', content: '', urgent: false });
    } catch (err) { setPostMsg({ type: 'error', text: 'Failed to post' }); }
    finally { setPostLoading(false); }
  };

  const handleLeaveAction = async (id, action) => {
    try {
      await axios.patch(`${API_BASE}/api/leave/admin/${id}`, { action });
      fetchData();
    } catch (err) { console.error('Leave action error:', err); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '';
  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div className="adm">
      {/* Stats Cards */}
      <div className="adm-stats-grid">
        <div className="adm-stat-card">
          <div className="adm-stat-top"><div className="adm-stat-icon primary"><span className="material-symbols-outlined" style={{fontVariationSettings:"'FILL' 1"}}>group</span></div><span className="adm-stat-badge primary">+{stats.employees > 0 ? Math.min(stats.employees, 12) : 0} this month</span></div>
          <p className="adm-stat-label">Total Employees</p>
          <h3 className="adm-stat-value">{stats.employees.toLocaleString()}</h3>
        </div>
        <div className="adm-stat-card accent-left">
          <div className="adm-stat-top"><div className="adm-stat-icon neutral"><span className="material-symbols-outlined">pending_actions</span></div><span className="adm-stat-badge action"><span className="adm-pulse-dot"></span>Action Req</span></div>
          <p className="adm-stat-label">Leave Requests Pending</p>
          <h3 className="adm-stat-value">{stats.pendingLeaves}</h3>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-top"><div className="adm-stat-icon tertiary"><span className="material-symbols-outlined">beach_access</span></div><span className="adm-stat-meta">~{stats.employees > 0 ? Math.round((stats.onLeave / stats.employees) * 100) : 0}% of workforce</span></div>
          <p className="adm-stat-label">On Leave Today</p>
          <h3 className="adm-stat-value">{stats.onLeave}</h3>
        </div>
        <div className="adm-stat-card accent-left-red">
          <div className="adm-stat-top"><div className="adm-stat-icon error"><span className="material-symbols-outlined">timer_off</span></div><span className="adm-stat-badge error">+{stats.late} vs avg</span></div>
          <p className="adm-stat-label">Late Today</p>
          <h3 className="adm-stat-value">{stats.late}</h3>
        </div>
      </div>

      {/* Main Section */}
      <div className="adm-main-grid">
        {/* Pending Leave Table */}
        <div className="adm-card adm-leave-section">
          <div className="adm-leave-header">
            <div><h3 className="adm-card-title">Pending Leave Applications</h3><p className="adm-card-subtitle">Review and manage recent requests.</p></div>
            <NavLink to="/dashboard/admin-panel/leave-requests" className="adm-view-all">View All <span className="material-symbols-outlined" style={{fontSize:18}}>arrow_forward</span></NavLink>
          </div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Employee</th><th>Type & Dates</th><th>Duration</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {pendingLeaves.length === 0 ? (
                  <tr><td colSpan={4} className="adm-empty">No pending requests</td></tr>
                ) : pendingLeaves.map(l => (
                  <tr key={l._id}>
                    <td><div className="adm-emp-cell"><div className="adm-emp-avatar">{l.user?.profilePic ? <img src={l.user.profilePic} alt="" /> : getInitials(l.user?.name)}</div><div><p className="adm-emp-name">{l.user?.name || 'Unknown'}</p><p className="adm-emp-dept">{l.user?.role || 'Employee'}</p></div></div></td>
                    <td><p className="adm-leave-type">{l.type}</p><p className="adm-leave-dates">{formatDate(l.startDateStr)} - {formatDate(l.endDateStr)}</p></td>
                    <td><span className="adm-duration-badge">{l.days} Day{l.days !== 1 ? 's' : ''}</span></td>
                    <td className="text-right"><div className="adm-action-btns">
                      <button className="adm-reject-btn" onClick={() => handleLeaveAction(l._id, 'reject')} title="Reject"><span className="material-symbols-outlined" style={{fontSize:20}}>close</span></button>
                      <button className="adm-approve-btn" onClick={() => handleLeaveAction(l._id, 'approve')} title="Approve"><span className="material-symbols-outlined" style={{fontSize:20}}>check</span></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div className="adm-right-col">
          {/* Stats Chart */}
          <div className="adm-card">
            <h3 className="adm-card-title">Org-wide Statistics</h3>
            <p className="adm-card-subtitle">Monthly leave distribution trends.</p>
            <div className="adm-chart">
              {['J','F','M','A','M','J'].map((m, i) => (
                <div key={m} className="adm-chart-bar-col">
                  <div className="adm-chart-track"><div className={`adm-chart-fill ${i === 5 ? 'current' : ''}`} style={{height: `${[40,55,80,30,45,95][i]}%`}}></div></div>
                  <span className={`adm-chart-label ${i === 5 ? 'current' : ''}`}>{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Post Announcement */}
          <div className="adm-card adm-post-card">
            <div className="adm-post-header"><span className="material-symbols-outlined adm-post-icon">campaign</span><h3 className="adm-card-title-sm">Post New Announcement</h3></div>
            {postMsg && <div className={`adm-post-msg ${postMsg.type}`}>{postMsg.text}</div>}
            <div className="adm-post-form">
              <div className="adm-field"><label>Title</label><input type="text" placeholder="E.g., Office Closure" value={announcementForm.title} onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})} /></div>
              <div className="adm-field"><label>Message</label><textarea rows={3} placeholder="Enter details here..." value={announcementForm.content} onChange={e => setAnnouncementForm({...announcementForm, content: e.target.value})} /></div>
              <div className="adm-post-footer">
                <label className="adm-urgent-check"><input type="checkbox" checked={announcementForm.urgent} onChange={e => setAnnouncementForm({...announcementForm, urgent: e.target.checked})} /><span>Mark as Urgent</span></label>
                <button className="adm-post-btn" onClick={handlePost} disabled={postLoading}>{postLoading ? 'Posting...' : 'Post'} <span className="material-symbols-outlined" style={{fontSize:18}}>send</span></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const location = useLocation();
  const isIndex = location.pathname === '/dashboard/admin-panel' || location.pathname === '/dashboard/admin-panel/';

  return (
    <div className="admin-panel-container">
      {isIndex ? (
        <AdminOverview />
      ) : (
        <>
          <div className="admin-header">
            <h1 className="admin-title">Admin Panel</h1>
            <p className="admin-subtitle">Manage employees and approve requests</p>
          </div>
          <div className="admin-nav-tabs">
            <NavLink to="/dashboard/admin-panel/leave-requests" className={({ isActive }) => `admin-nav-tab ${isActive ? 'active' : ''}`}>
              <span className="material-symbols-outlined" style={{fontSize:18}}>description</span><span>Leave Requests</span>
            </NavLink>
            <NavLink to="/dashboard/admin-panel/attendance" className={({ isActive }) => `admin-nav-tab ${isActive ? 'active' : ''}`}>
              <span className="material-symbols-outlined" style={{fontSize:18}}>fingerprint</span><span>Attendance</span>
            </NavLink>
            <NavLink to="/dashboard/admin-panel/employees" className={({ isActive }) => `admin-nav-tab ${isActive ? 'active' : ''}`}>
              <span className="material-symbols-outlined" style={{fontSize:18}}>group</span><span>Employees</span>
            </NavLink>
            <NavLink to="/dashboard/admin-panel/holidays" className={({ isActive }) => `admin-nav-tab ${isActive ? 'active' : ''}`}>
              <span className="material-symbols-outlined" style={{fontSize:18}}>celebration</span><span>Holidays</span>
            </NavLink>
            <NavLink to="/dashboard/admin-panel/updates" className={({ isActive }) => `admin-nav-tab ${isActive ? 'active' : ''}`}>
              <span className="material-symbols-outlined" style={{fontSize:18}}>campaign</span><span>Updates</span>
            </NavLink>
          </div>
          <div className="admin-content">
            <Routes>
              <Route path="leave-requests" element={<AdminLeaveRequests />} />
              <Route path="attendance" element={<AdminAttendance />} />
              <Route path="employees" element={<AdminEmployees />} />
              <Route path="holidays" element={<AdminHolidays />} />
              <Route path="updates" element={<AdminUpdates />} />
            </Routes>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPanel;
