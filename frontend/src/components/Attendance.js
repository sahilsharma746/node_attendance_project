import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getAttendanceStatus } from '../utils/attendanceCalculator';
import '../css/Attendance.css';

const API_BASE = 'http://localhost:3002/api/attendance';

const Attendance = () => {
  const { user } = useAuth();
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const getCurrentDate = () => {
    const today = new Date();
    const weekday = today.toLocaleDateString('en-US', { weekday: 'long' });
    const month = today.toLocaleDateString('en-US', { month: 'long' });
    const day = today.getDate();
    const ordinal = getOrdinalSuffix(day);
    return `${weekday}, ${month} ${day}${ordinal}`;
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const fetchTodayAndHistory = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const [todayRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE}/today`),
        axios.get(`${API_BASE}/history`),
      ]);
      setCheckedIn(todayRes.data.checkedIn);
      setCheckInTime(todayRes.data.checkInTime ? new Date(todayRes.data.checkInTime) : null);
      setAttendanceHistory(historyRes.data || []);
    } catch (err) {
      console.error('Failed to load attendance:', err);
      setAttendanceHistory([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTodayAndHistory();
  }, [fetchTodayAndHistory]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      await axios.post(`${API_BASE}/check-in`);
      await fetchTodayAndHistory();
      setMessage('Checked in successfully.');
      setTimeout(() => {
        setMessage(null);
      }, 2000);
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Failed to check in.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!checkedIn) return;
    setActionLoading(true);
    setMessage(null);
    try {
      await axios.post(`${API_BASE}/check-out`);
      await fetchTodayAndHistory();
      setMessage('Checked out successfully.');
      setTimeout(() => {
        setMessage(null);
      }, 2000);
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Failed to check out.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <div className="header-left">
          <h1 className="attendance-title">Your Attendance Record</h1>
          <p className="attendance-subtitle">Manage check-ins and view history</p>
        </div>
      </div>

      <div className="attendance-content">
        <div className="current-day-card">
          <div className="card-left">
            <div className="clock-icon">
            <img src="/images/clock.png" alt="Clock" className="clock-icon-image" />
            </div>
            <div className="date-info">
              <div className="current-date">{getCurrentDate()}</div>
              <div className="status-message">
                {checkedIn
                  ? (() => {
                      const status = getAttendanceStatus(checkInTime, null);
                      return `${formatTime(checkInTime)} — ${status.statusMessage}`;
                    })()
                  : "You haven't checked in yet today"}
              </div>
            </div>
          </div>
          <div className="card-right">
            {message && (
              <span className={`attendance-message ${message.includes('Failed') ? 'error' : ''}`}>
                {message}
              </span>
            )}
            <button
              className={`check-in-btn ${checkedIn ? 'disabled' : ''}`}
              onClick={handleCheckIn}
              disabled={checkedIn || actionLoading}
            >
              {actionLoading && !checkedIn ? 'Checking in...' : 'Check In'}
            </button>
            <button
              className={`check-out-btn ${!checkedIn ? 'disabled' : ''}`}
              onClick={handleCheckOut}
              disabled={!checkedIn || actionLoading}
            >
              {actionLoading && checkedIn ? 'Checking out...' : 'Check Out'}
            </button>
          </div>
        </div>

        <div className="attendance-history-card">
          <div className="history-header">
           <img src="/images/calendar.png" alt="History" className="history-icon-image" />
            <h2 className="history-title">Attendance History</h2>
          </div>
          <div className="history-table-container">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="empty-table-cell">
                      Loading...
                    </td>
                  </tr>
                ) : attendanceHistory.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-table-cell">
                      No records found
                    </td>
                  </tr>
                ) : (
                  attendanceHistory.map((record) => (
                    <tr key={record.id}>
                      <td>{record.date}</td>
                      <td>{record.checkIn}</td>
                      <td>{record.checkOut || '—'}</td>
                      <td>
                        <span className="status-badge">{record.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Attendance;
