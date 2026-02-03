import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../../css/admin/AdminAttendance.css';

const API_BASE = 'http://localhost:3002/api/attendance';
const AUTH_BASE = 'http://localhost:3002/api/auth';

function timeToInput(dateStrOrDate) {
  if (!dateStrOrDate) return '';
  const d = new Date(dateStrOrDate);
  if (Number.isNaN(d.getTime())) return '';
  const h = d.getHours();
  const m = d.getMinutes();
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const AdminAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState('');
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({ checkInTime: '', checkOutTime: '' });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterUser) params.set('user', filterUser);
      params.set('month', filterMonth);
      params.set('year', filterYear);
      const res = await axios.get(`${API_BASE}/records?${params.toString()}`);
      setAttendanceRecords(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch attendance records:', err);
      setError(err.response?.data?.msg || 'Failed to load records');
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filterUser, filterMonth, filterYear]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${AUTH_BASE}/users`);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openEdit = (record) => {
    const dateStr = record.dateStr || (record.date && new Date(record.date).toISOString().slice(0, 10));
    if (!dateStr) return;
    setEditingRecord(record);
    setEditForm({
      checkInTime: timeToInput(record.checkInRaw || record.checkIn),
      checkOutTime: timeToInput(record.checkOutRaw || record.checkOut) || '',
    });
    setEditModalOpen(true);
    setError('');
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingRecord(null);
    setEditForm({ checkInTime: '', checkOutTime: '' });
    setError('');
  };

  const handleUpdateAttendance = async (e) => {
    e.preventDefault();
    if (!editingRecord?.dateStr || !editForm.checkInTime) {
      setError('Date and check-in time are required.');
      return;
    }
    setUpdateLoading(true);
    setError('');
    try {
      const dateStr = editingRecord.dateStr;
      const checkIn = `${dateStr}T${editForm.checkInTime}:00`;
      const checkOut = editForm.checkOutTime ? `${dateStr}T${editForm.checkOutTime}:00` : null;
      await axios.patch(`${API_BASE}/records/${editingRecord._id}`, {
        checkIn,
        checkOut,
      });
      closeEditModal();
      fetchRecords();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update record');
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="admin-attendance">
      <div className="attendance-card">
        <div className="card-header-section">
          <h2 className="section-title">Attendance Records</h2>
          <div className="filters">
            <select className="filter-select" value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
              <option value="">All Users</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>{u.name || u.email}</option>
              ))}
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
        {error && !editModalOpen && <div className="attendance-error">{error}</div>}
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="loading-cell">Loading...</td>
                </tr>
              ) : attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-cell">No attendance records for this period</td>
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
                    <td>
                      <button
                        type="button"
                        className="attendance-edit-btn"
                        onClick={() => openEdit(attendance)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editModalOpen && editingRecord && (
        <div className="attendance-modal-overlay" onClick={closeEditModal}>
          <div className="attendance-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="attendance-modal-title">Edit Attendance</h3>
            <p className="attendance-modal-subtitle">
              {editingRecord.user?.name} · {editingRecord.date}
            </p>
            {error && <div className="attendance-error">{error}</div>}
            <form onSubmit={handleUpdateAttendance} className="attendance-edit-form">
              <div className="form-group">
                <label htmlFor="edit-check-in">Check In (time)</label>
                <input
                  id="edit-check-in"
                  type="time"
                  value={editForm.checkInTime}
                  onChange={(e) => setEditForm((f) => ({ ...f, checkInTime: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-check-out">Check Out (time, optional)</label>
                <input
                  id="edit-check-out"
                  type="time"
                  value={editForm.checkOutTime}
                  onChange={(e) => setEditForm((f) => ({ ...f, checkOutTime: e.target.value }))}
                />
              </div>
              <div className="attendance-modal-actions">
                <button type="button" className="attendance-btn-cancel" onClick={closeEditModal}>
                  Cancel
                </button>
                <button type="submit" className="attendance-btn-save" disabled={updateLoading}>
                  {updateLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
