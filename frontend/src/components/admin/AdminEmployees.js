import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import '../../css/admin/AdminEmployees.css';

const API_BASE = 'http://localhost:3000/api/auth';

const AdminEmployees = () => {
  const { createUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/users`);
      setUsers(res.data || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.msg || 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setSubmitting(true);
    const result = await createUser(
      formData.name,
      formData.email,
      formData.password,
      formData.role
    );
    setSubmitting(false);

    if (result.success) {
      setMessage({ type: 'success', text: 'User created successfully' });
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'employee',
      });
      fetchUsers();
      setModalOpen(false);
    } else {
      setMessage({ type: 'error', text: result.error });
    }
  };

  const openModal = () => {
    setModalOpen(true);
    setMessage({ type: '', text: '' });
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'employee',
    });
  };

  const getInitials = (name) => {
    return (name || '')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="admin-employees">
      <div className="employees-card">
        <div className="card-header-section">
          <h2 className="section-title">Employee Directory</h2>
          <button type="button" className="create-user-btn" onClick={openModal}>
            Create User
          </button>
        </div>

        {message.text && (
          <div className={`admin-message ${message.type}`}>{message.text}</div>
        )}

        <div className="table-container">
          {loading ? (
            <p className="admin-loading">Loading users...</p>
          ) : (
            <table className="employees-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-row">
                      No users yet. Create one as admin.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className="employee-cell">
                          <div className="avatar">{getInitials(u.name)}</div>
                          <div className="employee-name-info">
                            <span className="employee-name">{u.name}</span>
                            <span className="employee-username">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge role-${u.role}`}>{u.role}</span>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className="status-badge active">
                          <span className="status-dot" />
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3>Create User</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="admin-modal-hint">As an admin, you can create new employees or other admins. Choose the role below.</p>
            {message.text && (
              <div className={`admin-message ${message.type}`}>{message.text}</div>
            )}
            <form onSubmit={handleSubmit} className="admin-modal-form">
              <div className="form-group">
                <label htmlFor="create-name">Full Name</label>
                <input
                  id="create-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Full name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="create-email">Email</label>
                <input
                  id="create-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="email@example.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="create-role">Role</label>
                <select
                  id="create-role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="create-password">Password</label>
                <input
                  id="create-password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                />
              </div>
              <div className="form-group">
                <label htmlFor="create-confirmPassword">Confirm Password</label>
                <input
                  id="create-confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Confirm password"
                />
              </div>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-modal-btn secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-modal-btn primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmployees;
