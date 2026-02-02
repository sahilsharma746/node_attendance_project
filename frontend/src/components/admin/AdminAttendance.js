import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../../css/admin/AdminAttendance.css';

const API_BASE = 'http://localhost:3002/api/attendance';


const AdminAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState('');
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterUser) params.set('user', filterUser);
      params.set('month', filterMonth);
      params.set('year', filterYear);
      const res = await axios.get(`${API_BASE}/records?${params.toString()}`);
      setAttendanceRecords(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch attendance records:', err);
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filterUser, filterMonth, filterYear]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return (
    <div className="admin-attendance">
      <div className="attendance-card">
        <div className="card-header-section">
          <h2 className="section-title">Attendance Records</h2>
          <div className="filters">
            <select className="filter-select" value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
              <option value="">All Users</option>
            </select>
            <select className="filter-select" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
            <select className="filter-select" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
              {[2026, 2025, 2024].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="table-container">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check In (IST)</th>
                <th>Check Out (IST)</th>
                <th>Status</th>
                <th>Late By</th>
                <th>Breaks</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="loading-cell">Loading...</td>
                </tr>
              ) : attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-cell">No attendance records for this period</td>
                </tr>
              ) : (
                attendanceRecords.map((attendance) => (
                  <tr key={attendance._id || attendance.date}>
                    <td>{attendance.user ? attendance.user.name : '-'}</td>
                    <td>{attendance.date}</td>
                    <td>{attendance.checkIn}</td>
                    <td>{attendance.checkOut || '-'}</td>
                    <td>{attendance.status}</td>
                    <td>{attendance.lateBy ?? '-'}</td>
                    <td>{attendance.breaks ?? '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="attendance-card">
        <div className="card-header-section">
          <div className="title-with-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 10C18.3333 5.39763 14.6024 1.66667 10 1.66667C5.39763 1.66667 1.66667 5.39763 1.66667 10C1.66667 14.6024 5.39763 18.3333 10 18.3333Z" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 5V10L13.3333 11.6667" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h2 className="section-title">Break Timing Summary (January 2026)</h2>
          </div>
        </div>
        <div className="summary-cards-grid">
          <div className="summary-card-item">
            <div className="summary-value">0</div>
            <div className="summary-label">Total Breaks</div>
          </div>
          <div className="summary-card-item">
            <div className="summary-value">0</div>
            <div className="summary-label">Active Breaks</div>
          </div>
          <div className="summary-card-item">
            <div className="summary-value">0h 0m</div>
            <div className="summary-label">Total Duration</div>
          </div>
          <div className="summary-card-item">
            <div className="summary-value">0 / 0</div>
            <div className="summary-label">Break / Outside</div>
          </div>
        </div>
        <div className="empty-break-records">
          <p>No break records found for this period</p>
        </div>
      </div>

      <div className="attendance-card">
        <div className="card-header-section">
          <div className="title-with-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 10C18.3333 5.39763 14.6024 1.66667 10 1.66667C5.39763 1.66667 1.66667 5.39763 1.66667 10C1.66667 14.6024 5.39763 18.3333 10 18.3333Z" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 5V10L13.3333 11.6667" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h2 className="section-title">Late Arrivals Today (IST)</h2>
          </div>
        </div>
        <div className="empty-late-arrivals">
          <p>No late arrivals today</p>
        </div>
      </div>

      <div className="attendance-card">
        <div className="card-header-section">
          <h2 className="section-title">Attendance Summary (January 2026)</h2>
        </div>
        <div className="table-container">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Days Present</th>
                <th>Days on Leave</th>
                <th>Total Working Days</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="employee-cell">
                    <div className="avatar admin-avatar"></div>
                    <span></span>
                  </div>
                </td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>
                  <div className="employee-cell">
                    <div className="avatar">
                      <span></span>
                    </div>
                    <span></span>
                  </div>
                </td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAttendance;
