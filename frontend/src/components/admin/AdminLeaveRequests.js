import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../css/admin/AdminLeaveRequests.css';

const API_BASE = 'http://localhost:3000/api/leave';

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const AdminLeaveRequests = () => {
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [reviewNote, setReviewNote] = useState({});
  const [error, setError] = useState('');

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError('');
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        axios.get(`${API_BASE}/admin?status=pending`),
        axios.get(`${API_BASE}/admin?status=approved`),
        axios.get(`${API_BASE}/admin?status=rejected`),
      ]);
      setPending(pendingRes.data);
      setApproved(approvedRes.data);
      setRejected(rejectedRes.data);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleReview = async (id, action) => {
    setActionLoading(id);
    setError('');
    try {
      await axios.patch(`${API_BASE}/admin/${id}`, {
        action,
        adminNote: reviewNote[id] || undefined,
      });
      setReviewNote((prev) => ({ ...prev, [id]: '' }));
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update request');
    } finally {
      setActionLoading(null);
    }
  };

  const setNote = (id, value) => {
    setReviewNote((prev) => ({ ...prev, [id]: value }));
  };

  const renderLeaveItem = (leave, showActions = false) => (
    <div key={leave._id} className="admin-leave-item">
      <div className="admin-leave-item-header">
        <span className="admin-leave-user">
          {leave.user ? `${leave.user.name} (${leave.user.email})` : 'Unknown'}
        </span>
        <span className={`admin-leave-status admin-leave-status-${leave.status}`}>{leave.status}</span>
      </div>
      <div className="admin-leave-dates">
        {formatDisplayDate(leave.startDateStr)} – {formatDisplayDate(leave.endDateStr)}
      </div>
      <div className="admin-leave-meta">
        <span className="admin-leave-type">{leave.type}</span>
        <span className="admin-leave-days">{leave.days} day{leave.days !== 1 ? 's' : ''}</span>
      </div>
      {leave.reason && <div className="admin-leave-reason">{leave.reason}</div>}
      {leave.adminNote && <div className="admin-leave-admin-note">Note: {leave.adminNote}</div>}
      {showActions && (
        <div className="admin-leave-actions">
          <input
            type="text"
            className="admin-leave-note-input"
            placeholder="Note (optional)"
            value={reviewNote[leave._id] || ''}
            onChange={(e) => setNote(leave._id, e.target.value)}
          />
          <div className="admin-leave-buttons">
            <button
              type="button"
              className="admin-leave-btn admin-leave-btn-approve"
              onClick={() => handleReview(leave._id, 'approve')}
              disabled={actionLoading === leave._id}
            >
              {actionLoading === leave._id ? '...' : 'Approve'}
            </button>
            <button
              type="button"
              className="admin-leave-btn admin-leave-btn-reject"
              onClick={() => handleReview(leave._id, 'reject')}
              disabled={actionLoading === leave._id}
            >
              {actionLoading === leave._id ? '...' : 'Reject'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="admin-leave-requests">
        <div className="admin-leave-loading">Loading leave requests...</div>
      </div>
    );
  }

  return (
    <div className="admin-leave-requests">
      {error && <div className="admin-leave-error">{error}</div>}
      <div className="leave-card pending-card">
        <div className="card-header">
          <div className="card-icon pending-icon">
            <img src="/images/pending.png" alt="Pending Approvals" className="card-icon-image" />
          </div>
          <div className="card-title-section">
            <h3 className="card-title">Pending Approvals</h3>
            <p className="card-subtitle">Requires your attention</p>
          </div>
        </div>
        <div className="card-content">
          {pending.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <img src="/images/pending.png" alt="Pending Approvals" className="empty-icon-image" />
              </div>
              <p className="empty-text">All caught up! No pending requests</p>
            </div>
          ) : (
            <div className="admin-leave-list">
              {pending.map((leave) => renderLeaveItem(leave, true))}
            </div>
          )}
        </div>
      </div>

      <div className="leave-card approved-card">
        <div className="card-header">
          <div className="card-icon approved-icon">
            <img src="/images/mark.png" alt="Approved Leaves" className="card-icon-image" />
          </div>
          <div className="card-title-section">
            <h3 className="card-title">Approved Leaves</h3>
            <p className="card-subtitle">Successfully approved requests</p>
          </div>
        </div>
        <div className="card-content">
          {approved.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <img src="/images/document.png" alt="Approved Leaves" className="empty-icon-image" />
              </div>
              <p className="empty-text">No approved leaves yet</p>
            </div>
          ) : (
            <div className="admin-leave-list">
              {approved.map((leave) => renderLeaveItem(leave))}
            </div>
          )}
        </div>
      </div>

      <div className="leave-card rejected-card">
        <div className="card-header">
          <div className="card-icon rejected-icon">
            <img src="/images/rejected.png" alt="Rejected Leaves" className="card-icon-image" />
          </div>
          <div className="card-title-section">
            <h3 className="card-title">Rejected Leaves</h3>
            <p className="card-subtitle">Declined leave requests</p>
          </div>
        </div>
        <div className="card-content">
          {rejected.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <img src="/images/document.png" alt="Rejected Leaves" className="empty-icon-image" />
              </div>
              <p className="empty-text">No rejected leaves</p>
            </div>
          ) : (
            <div className="admin-leave-list">
              {rejected.map((leave) => renderLeaveItem(leave))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLeaveRequests;
