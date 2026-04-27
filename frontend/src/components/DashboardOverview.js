import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import '../css/DashboardOverview.css';

const ATTENDANCE_API = process.env.REACT_APP_API_URL + '/api/attendance';
const LEAVE_API = process.env.REACT_APP_API_URL + '/api/leave';
const HOLIDAYS_API = process.env.REACT_APP_API_URL + '/api/holidays';
const UPDATES_API = process.env.REACT_APP_API_URL + '/api/updates';

const DashboardOverview = () => {
  const { user } = useAuth();
  const [todayStatus, setTodayStatus] = useState(null);
  const [leaveStats, setLeaveStats] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [onLeaveToday, setOnLeaveToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [elapsed, setElapsed] = useState('00:00:00');
  const timerRef = useRef(null);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  };

  const startTimer = useCallback((checkInTime) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const update = () => {
      const now = new Date();
      const diff = Math.floor((now - new Date(checkInTime)) / 1000);
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    };
    update();
    timerRef.current = setInterval(update, 1000);
  }, []);

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const [todayRes, leaveRes, summaryRes, holidayRes, updatesRes, onLeaveRes] = await Promise.all([
        axios.get(`${ATTENDANCE_API}/today`),
        axios.get(`${LEAVE_API}/my/stats`),
        axios.get(`${ATTENDANCE_API}/my-summary`),
        axios.get(`${HOLIDAYS_API}/upcoming`),
        axios.get(UPDATES_API),
        axios.get(`${LEAVE_API}/on-leave-today`),
      ]);
      setTodayStatus(todayRes.data);
      setLeaveStats(leaveRes.data);
      setWeeklySummary(summaryRes.data);
      setUpcomingHolidays(Array.isArray(holidayRes.data) ? holidayRes.data.slice(0, 1) : []);
      setUpdates(Array.isArray(updatesRes.data) ? updatesRes.data.slice(0, 2) : []);
      setOnLeaveToday(Array.isArray(onLeaveRes.data) ? onLeaveRes.data : []);
      if (todayRes.data.checkedIn && todayRes.data.checkInTime) {
        startTimer(todayRes.data.checkInTime);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, startTimer]);

  useEffect(() => {
    fetchAll();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchAll]);

  const handlePunchIn = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await axios.post(`${ATTENDANCE_API}/check-in`);
      setMessage({ type: 'success', text: res.data.msg });
      fetchAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.msg || 'Failed to punch in' });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePunchOut = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await axios.post(`${ATTENDANCE_API}/check-out`);
      setMessage({ type: 'success', text: res.data.msg });
      if (timerRef.current) clearInterval(timerRef.current);
      fetchAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.msg || 'Failed to punch out' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatUpdateDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatHolidayDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', weekday: 'long', timeZone: 'Asia/Kolkata' });
  };

  const isPunchedIn = todayStatus?.checkedIn;
  const checkInTime = todayStatus?.checkInTime;
  const totalWeekHours = weeklySummary ? (weeklySummary.daysPresentThisWeek * 9) : 0;

  if (loading) {
    return (
      <div className="overview-container">
        <div className="overview-header">
          <h1>Overview</h1>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overview-container">
      <div className="overview-header">
        <h1>Overview</h1>
        <p>Welcome back. Here's what's happening today.</p>
      </div>

      {message && (
        <div className={`overview-message ${message.type}`}>{message.text}</div>
      )}

      <div className="overview-grid-top">
        {/* Punch Card */}
        <div className="overview-card punch-card">
          <div className="punch-status-row">
            <span className={`punch-badge ${isPunchedIn ? 'active' : 'inactive'}`}>
              <span className="punch-dot"></span>
              {isPunchedIn ? 'Punched In' : 'Not Punched In'}
            </span>
            <div className="punch-schedule">
              <span className="schedule-label">TODAY'S SCHEDULE</span>
              <span className="schedule-time">10:00 AM - 07:00 PM</span>
            </div>
          </div>

          <div className="punch-timer">
            <span className="timer-value">{isPunchedIn ? elapsed : '00:00:00'}</span>
            {isPunchedIn && checkInTime && (
              <span className="timer-since">Since {formatTime(checkInTime)} today</span>
            )}
            {!isPunchedIn && (
              <span className="timer-since">Ready to start your day</span>
            )}
          </div>

          <div className="punch-actions">
            {!isPunchedIn ? (
              <button className="punch-btn punch-in" onClick={handlePunchIn} disabled={actionLoading}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13.8 12H3"/></svg>
                {actionLoading ? 'Punching...' : 'Punch In'}
              </button>
            ) : (
              <button className="punch-btn punch-out" onClick={handlePunchOut} disabled={actionLoading}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                {actionLoading ? 'Punching...' : 'Punch Out'}
              </button>
            )}
            {isPunchedIn && (
              <div className="break-toggle">
                <span className="break-label">On Break</span>
                <label className="toggle-switch">
                  <input type="checkbox" />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Leave Balance Card */}
        <div className="overview-card leave-balance-card">
          <div className="leave-balance-header">
            <h3>Leave Balance</h3>
            <Link to="/dashboard/leave" className="leave-request-link">Request</Link>
          </div>
          <div className="leave-balance-items">
            <div className="leave-balance-item">
              <div className="leave-icon casual">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
              </div>
              <span className="leave-type-name">Casual Leave</span>
              <span className="leave-type-count">{leaveStats?.remaining ?? 0}</span>
            </div>
            <div className="leave-balance-item">
              <div className="leave-icon sick">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>
              </div>
              <span className="leave-type-name">Sick Leave</span>
              <span className="leave-type-count">8</span>
            </div>
            <div className="leave-balance-item">
              <div className="leave-icon paid">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <span className="leave-type-name">Paid Leave</span>
              <span className="leave-type-count">12</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overview-grid-bottom">
        {/* This Week Card */}
        <div className="overview-card week-card">
          <h3>This Week</h3>
          <div className="week-stat">
            <span className="week-stat-label">TOTAL WORKING HOURS</span>
            <div className="week-stat-value">
              <span className="week-hours">{totalWeekHours}</span>
              <span className="week-hours-total">/ 45 hrs</span>
            </div>
            <div className="week-progress-bar">
              <div className="week-progress-fill" style={{ width: `${Math.min((totalWeekHours / 45) * 100, 100)}%` }}></div>
            </div>
          </div>
          <div className="week-subcard" style={{ marginTop: '16px' }}>
            <span className="week-stat-label">AVG PUNCH-IN TIME</span>
            <div className="week-stat-value">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span className="week-hours" style={{ fontSize: '22px', marginLeft: '6px' }}>09:30 AM</span>
            </div>
          </div>
        </div>

        {/* Updates Card */}
        <div className="overview-card updates-card">
          <h3>Updates</h3>
          {updates.length === 0 ? (
            <p className="empty-text">No updates available</p>
          ) : (
            <ul className="overview-updates-list">
              {updates.map((u, i) => (
                <li key={u._id} className="overview-update-item">
                  <span className={`update-dot ${i === 0 ? 'new' : ''}`}></span>
                  <div>
                    <span className="overview-update-title">{u.title}</span>
                    <p className="overview-update-desc">{u.content?.slice(0, 80)}{u.content?.length > 80 ? '...' : ''}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Upcoming Holiday Card */}
        <div className="overview-card holiday-card">
          <h3>Upcoming Holiday</h3>
          {upcomingHolidays.length === 0 ? (
            <p className="empty-text">No upcoming holidays</p>
          ) : (
            <div className="holiday-highlight">
              <div className="holiday-icon-big">
                <img src="/images/holiday.png" alt="Holiday" />
              </div>
              <div className="holiday-info">
                <span className="holiday-name-big">{upcomingHolidays[0].name}</span>
                <span className="holiday-date-big">{formatHolidayDate(upcomingHolidays[0].date)}</span>
              </div>
            </div>
          )}

          {/* Team on Leave Today */}
          <div className="team-on-leave">
            <span className="team-leave-label">Team on Leave Today</span>
            {onLeaveToday.length === 0 ? (
              <p className="empty-text small">No one on leave</p>
            ) : (
              <div className="team-leave-avatars">
                {onLeaveToday.slice(0, 3).map((l) => (
                  <div key={l._id} className="team-avatar" title={l.user?.name}>
                    {l.user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                ))}
                {onLeaveToday.length > 3 && (
                  <div className="team-avatar more">+{onLeaveToday.length - 3}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
