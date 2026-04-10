import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/LeaveRequest.css';

const API_BASE = process.env.REACT_APP_API_URL + '/api/leave';

const LEAVE_TYPES = [
  { value: 'casual', label: 'Casual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'emergency', label: 'Emergency Leave' },
  { value: 'other', label: 'Other' },
];

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const LeaveRequest = () => {
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState({
    remaining: 0,
    usedThisYear: 0,
    pendingCount: 0,
    perMonth: 2,
    entitledSoFar: 0,
    currentMonth: 1,
    totalBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    type: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
    isHalfDay: false,
    halfDaySession: 'first_half',
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
        perMonth: statsRes.data.perMonth || 2,
        entitledSoFar: statsRes.data.entitledSoFar || 0,
        currentMonth: statsRes.data.currentMonth || 1,
        totalBalance: statsRes.data.totalBalance || 0,
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
    setForm({
      type: 'casual',
      startDate: '',
      endDate: '',
      reason: '',
      isHalfDay: false,
      halfDaySession: 'first_half',
    });
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setForm((prev) => {
        const next = { ...prev, [name]: checked };
        // When toggling half-day on, force endDate = startDate
        if (name === 'isHalfDay' && checked && prev.startDate) {
          next.endDate = prev.startDate;
        }
        return next;
      });
      return;
    }
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // For half day, keep endDate locked to startDate
      if (prev.isHalfDay && name === 'startDate') {
        next.endDate = value;
      }
      if (name === 'startDate' && prev.endDate && value > prev.endDate) {
        next.endDate = value;
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) {
      setError('Please select start and end dates');
      return;
    }
    if (form.isHalfDay && form.startDate !== form.endDate) {
      setError('Half-day leave must be on a single date');
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
        isHalfDay: form.isHalfDay,
        halfDaySession: form.isHalfDay ? form.halfDaySession : null,
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
          <div className="card-title">Casual Leave Balance</div>
          <div className="card-value">{stats.remaining}</div>
          <div className="card-subtitle">
            {stats.entitledSoFar} of {stats.totalBalance} entitled · {stats.usedThisYear} used
          </div>
        </div>
        <div className="summary-card">
          <div className="card-title">Monthly Allowance</div>
          <div className="card-value">{stats.perMonth}</div>
          <div className="card-subtitle">Unused days carry forward</div>
        </div>
        <div className="summary-card">
          <div className="card-title">Pending</div>
          <div className="card-value">{stats.pendingCount}</div>
          <div className="card-subtitle">Awaiting approval</div>
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
                    <span className="leave-item-days">
                      {leave.days} day{leave.days !== 1 ? 's' : ''}
                      {leave.isHalfDay && (
                        <> · {leave.halfDaySession === 'first_half' ? 'Morning' : 'Afternoon'}</>
                      )}
                    </span>
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
              <div className="form-group half-day-toggle">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isHalfDay"
                    checked={form.isHalfDay}
                    onChange={handleChange}
                  />
                  <span>Apply for half day</span>
                </label>
              </div>
              {form.isHalfDay && (
                <div className="form-group">
                  <label htmlFor="halfDaySession">Session</label>
                  <select
                    id="halfDaySession"
                    name="halfDaySession"
                    value={form.halfDaySession}
                    onChange={handleChange}
                    required
                  >
                    <option value="first_half">First Half (Morning)</option>
                    <option value="second_half">Second Half (Afternoon)</option>
                  </select>
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">{form.isHalfDay ? 'Date' : 'Start Date'}</label>
                  <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                {!form.isHalfDay && (
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
                )}
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
