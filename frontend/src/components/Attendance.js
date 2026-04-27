import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../css/Attendance.css';

const API_BASE = process.env.REACT_APP_API_URL + '/api/attendance';

const Attendance = () => {
  const { user } = useAuth();
  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [elapsed, setElapsed] = useState({ hours: 0, minutes: 0 });
  const timerRef = useRef(null);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata',
    });
  };

  const getTodayDisplay = () => {
    const d = new Date();
    return d.toLocaleDateString('en-US', {
      weekday: 'long', month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata',
    });
  };

  const startTimer = useCallback((checkInTime) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const update = () => {
      const diff = Math.floor((new Date() - new Date(checkInTime)) / 1000);
      let totalMin = Math.floor(diff / 60);
      if (totalMin > 1080) {
        const cin = new Date(checkInTime).toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Kolkata' });
        const now = new Date().toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Kolkata' });
        const [ch, cm] = cin.split(':').map(Number);
        const [nh, nm] = now.split(':').map(Number);
        totalMin = Math.max(0, (nh * 60 + nm) - (ch * 60 + cm));
      }
      setElapsed({ hours: Math.floor(totalMin / 60), minutes: totalMin % 60 });
    };
    update();
    timerRef.current = setInterval(update, 60000);
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const [todayRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE}/today`),
        axios.get(`${API_BASE}/history`),
      ]);
      setTodayStatus(todayRes.data);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      if (todayRes.data.checkedIn && todayRes.data.checkInTime) {
        startTimer(todayRes.data.checkInTime);
      }
    } catch (err) {
      console.error('Attendance fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, startTimer]);

  useEffect(() => {
    fetchData();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchData]);

  const handlePunchIn = async () => {
    setActionLoading(true); setMessage(null);
    try {
      const res = await axios.post(`${API_BASE}/check-in`);
      setMessage({ type: 'success', text: res.data.msg });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.msg || 'Failed to punch in' });
    } finally { setActionLoading(false); }
  };

  const handlePunchOut = async () => {
    setActionLoading(true); setMessage(null);
    try {
      const res = await axios.post(`${API_BASE}/check-out`);
      setMessage({ type: 'success', text: res.data.msg });
      if (timerRef.current) clearInterval(timerRef.current);
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.msg || 'Failed to punch out' });
    } finally { setActionLoading(false); }
  };

  const isPunchedIn = todayStatus?.checkedIn;
  const checkInTime = todayStatus?.checkInTime;
  const todayRecord = todayStatus?.record;

  const getWorkHoursDisplay = (record) => {
    if (!record) return '0h 00m';
    const mins = record.totalWorkMinutes || 0;
    return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
  };

  const getStatusBadge = (record) => {
    if (!record.checkOut) return { label: 'In Progress', className: 'status-in-progress' };
    const checkIn = record.checkIn || '';
    const timeMatch = checkIn.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1]);
      const isPM = checkIn.includes('PM');
      const hour24 = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);
      if (hour24 > 10 || (hour24 === 10 && parseInt(timeMatch[2]) > 5)) {
        return { label: 'Late', className: 'status-late' };
      }
    }
    return { label: 'On Time', className: 'status-on-time' };
  };

  // Build weekly data from history
  const buildWeeklyData = () => {
    const days = ['M', 'T', 'W', 'T', 'F'];
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    return days.map((label, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().slice(0, 10);
      const record = history.find(r => {
        const rDate = new Date(r.date);
        return rDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) === dateStr;
      });
      const hours = record ? (record.totalWorkMinutes || 0) / 60 : 0;
      const isToday = i === ((dayOfWeek + 6) % 7);
      const isFuture = date > now;
      return { label, hours, maxHours: 9, isToday, isFuture };
    });
  };

  const weeklyData = buildWeeklyData();

  if (loading) {
    return (
      <div className="att-container">
        <div className="att-header"><h1>Attendance</h1><p>Loading...</p></div>
      </div>
    );
  }

  return (
    <div className="att-container">
      {/* Page Header */}
      <div className="att-header">
        <div>
          <h1>Attendance</h1>
          <p>Manage your daily logs and timesheets.</p>
        </div>
        <div className="att-date-badge">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>calendar_today</span>
          {getTodayDisplay()}
        </div>
      </div>

      {message && <div className={`att-message ${message.type}`}>{message.text}</div>}

      {/* Top Section: Status + Summary */}
      <div className="att-top-grid">
        {/* Large Status Card */}
        <div className="att-card att-status-card">
          <div className="att-status-bg-shape"></div>
          <div className="att-status-top">
            <div>
              <div className="att-current-status">
                <div className={`att-status-dot ${isPunchedIn ? 'active' : ''}`}></div>
                <span className="att-status-label">Current Status</span>
              </div>
              <h2 className="att-status-text">{isPunchedIn ? 'Punched In' : 'Not Punched In'}</h2>
              {checkInTime && <p className="att-status-since">Since {formatTime(checkInTime)}</p>}
            </div>
            <div className="att-status-icon-circle">
              <span className="material-symbols-outlined att-timer-icon">timer</span>
            </div>
          </div>
          <div className="att-status-actions">
            {!isPunchedIn ? (
              <button className="att-punch-btn" onClick={handlePunchIn} disabled={actionLoading}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span>
                {actionLoading ? 'Punching...' : 'Punch In'}
              </button>
            ) : (
              <button className="att-punch-btn" onClick={handlePunchOut} disabled={actionLoading}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
                {actionLoading ? 'Punching...' : 'Punch Out'}
              </button>
            )}
            <button className="att-break-btn">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>free_breakfast</span>
              Start Break
            </button>
          </div>
        </div>

        {/* Today's Summary Card */}
        <div className="att-card att-summary-card">
          <h3>Today's Summary</h3>
          <div className="att-summary-items">
            <div className="att-summary-row">
              <div className="att-summary-label">
                <span className="material-symbols-outlined">work_history</span>
                <span>Total Hours</span>
              </div>
              <span className="att-summary-value">
                {isPunchedIn ? `${elapsed.hours}h ${String(elapsed.minutes).padStart(2, '0')}m` :
                  todayRecord ? getWorkHoursDisplay(todayRecord) : '0h 00m'}
              </span>
            </div>
            <div className="att-summary-row">
              <div className="att-summary-label">
                <span className="material-symbols-outlined">coffee_maker</span>
                <span>Break Time</span>
              </div>
              <span className="att-summary-value">0m</span>
            </div>
            <div className="att-summary-row no-border">
              <div className="att-summary-label">
                <span className="material-symbols-outlined">schedule</span>
                <span>Overtime</span>
              </div>
              <span className="att-summary-value muted">0h 00m</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Overview */}
      <div className="att-card">
        <div className="att-weekly-header">
          <div>
            <h3>Weekly Overview</h3>
            <p>Hours worked this week vs scheduled</p>
          </div>
        </div>
        <div className="att-weekly-chart">
          {weeklyData.map((day, i) => (
            <div key={i} className={`att-bar-col ${day.isToday ? 'today' : ''}`}>
              <div className="att-bar-track">
                {!day.isFuture && (
                  <div className="att-bar-bg" style={{ height: '100%' }}>
                    <div
                      className={`att-bar-fill ${day.isToday ? 'current' : ''}`}
                      style={{ height: `${Math.min((day.hours / day.maxHours) * 100, 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>
              <span className={`att-bar-label ${day.isToday ? 'today' : ''}`}>{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Attendance Logs */}
      <div className="att-card">
        <div className="att-logs-header">
          <h3>Recent Attendance Logs</h3>
          <button className="att-filter-btn">
            <span className="material-symbols-outlined">filter_list</span>
          </button>
        </div>
        <div className="att-table-wrapper">
          <table className="att-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Punch In</th>
                <th>Punch Out</th>
                <th>Break Time</th>
                <th>Total Hours</th>
                <th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={6} className="att-empty">No attendance records found</td></tr>
              ) : (
                history.slice(0, 10).map((record) => {
                  const status = getStatusBadge(record);
                  return (
                    <tr key={record.id || record._id}>
                      <td className="font-medium">{record.date ? formatDate(new Date(record.date)) : record.date}</td>
                      <td>{record.checkIn || '--:--'}</td>
                      <td className={!record.checkOut ? 'muted italic' : ''}>{record.checkOut || '--:--'}</td>
                      <td className="muted">0m</td>
                      <td>{getWorkHoursDisplay(record)}</td>
                      <td className="text-right">
                        <span className={`att-status-badge ${status.className}`}>{status.label}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
