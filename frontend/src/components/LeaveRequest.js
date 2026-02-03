import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/LeaveRequest.css';

const API_BASE = 'http://localhost:3002/api/leave';

const LEAVE_TYPES = [
  { value: 'casual', label: 'Casual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'annual', label: 'Emergency Leave' },
  { value: 'other', label: 'Other' },
];

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const LeaveRequest = () => {
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState({ remaining: 24, usedThisYear: 0, pendingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    type: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leavesRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/my`),
        axios.get(`${API_BASE}/my/stats`),
      ]);
      setLeaves(leavesRes.data);
      setStats({
        remaining: statsRes.data.remaining,
        usedThisYear: statsRes.data.usedThisYear,
        pendingCount: statsRes.data.pendingCount,
      });
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = () => {
    setError('');
    setForm({ type: 'casual', startDate: '', endDate: '', reason: '' });
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'startDate' && form.endDate && value > form.endDate) {
      setForm((prev) => ({ ...prev, endDate: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) {
      setError('Please select start and end dates');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await axios.post(API_BASE, {
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason.trim(),
      });
      closeModal();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusClass = (status) => {
    if (status === 'approved') return 'status-approved';
    if (status === 'rejected') return 'status-rejected';
    return 'status-pending';
  };

  if (loading) {
    return (
      <div className="leave-request-container">
        <div className="leave-loading">Loading leave data...</div>
      </div>
    );
  }

  return (
    <div className="leave-request-container">
      <div className="leave-request-header">
        <div className="header-left">
          <h1 className="leave-request-title">Leave Requests</h1>
          <p className="leave-request-subtitle">Track and manage your time off</p>
        </div>
        <button type="button" className="new-request-btn" onClick={openModal}>
          New Request
        </button>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-title">Total Balance</div>
          <div className="card-value">{stats.remaining}</div>
          <div className="card-subtitle">Days remaining</div>
        </div>
        <div className="summary-card">
          <div className="card-title">Used This Year</div>
          <div className="card-value">{stats.usedThisYear}</div>
          <div className="card-subtitle">Days taken</div>
        </div>
        <div className="summary-card">
          <div className="card-title">Pending</div>
          <div className="card-value">{stats.pendingCount}</div>
          <div className="card-subtitle">Requests awaiting approval</div>
        </div>
      </div>

      <div className="request-history-section">
        <div className="history-header">
          <img src="/images/calendar.png" alt="Calendar" className="history-icon-image" />
          <h2 className="history-title">Request History</h2>
        </div>
        <div className="history-content">
          {leaves.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No leave requests found</div>
              <div className="empty-state-subtitle">Create a new request to get started</div>
            </div>
          ) : (
            <ul className="leave-history-list">
              {leaves.map((leave) => (
                <li key={leave._id} className="leave-history-item">
                  <div className="leave-item-dates">
                    {formatDisplayDate(leave.startDateStr)} – {formatDisplayDate(leave.endDateStr)}
                  </div>
                  <div className="leave-item-meta">
                    <span className={`leave-status-badge ${getStatusClass(leave.status)}`}>
                      {leave.status}
                    </span>
                    <span className="leave-item-type">{leave.type}</span>
                    <span className="leave-item-days">{leave.days} day{leave.days !== 1 ? 's' : ''}</span>
                  </div>
                  {leave.reason && <div className="leave-item-reason">{leave.reason}</div>}
                  {leave.adminNote && leave.status === 'rejected' && (
                    <div className="leave-item-admin-note">Note: {leave.adminNote}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showModal && (
        <div className="leave-modal-overlay" onClick={closeModal}>
          <div className="leave-modal" onClick={(e) => e.stopPropagation()}>
            <div className="leave-modal-header">
              <h2 className="leave-modal-title">New Leave Request</h2>
              <button type="button" className="leave-modal-close" onClick={closeModal} aria-label="Close">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="leave-modal-form">
              {error && <div className="leave-form-error">{error}</div>}
              <div className="form-group">
                <label htmlFor="type">Leave Type</label>
                <select
                  id="type"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  required
                >
                  {LEAVE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">Start Date</label>
                  <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="endDate">End Date</label>
                  <input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={form.endDate}
                    onChange={handleChange}
                    min={form.startDate || undefined}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="reason">Reason (optional)</label>
                <textarea
                  id="reason"
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Brief reason for leave"
                />
              </div>
              <div className="leave-modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequest;
