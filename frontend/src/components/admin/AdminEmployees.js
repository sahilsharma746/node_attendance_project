import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import '../../css/admin/AdminEmployees.css';

const API_BASE = process.env.REACT_APP_API_URL + '/api/auth';

const AdminEmployees = () => {
  const { createUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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

  const handleDelete = async (userToDelete) => {
    if (!window.confirm(`Delete employee "${userToDelete.name}"? This cannot be undone.`)) return;
    setDeletingId(userToDelete._id);
    setMessage({ type: '', text: '' });
    try {
      await axios.delete(`${API_BASE}/users/${userToDelete._id}`);
      setMessage({ type: 'success', text: 'Employee deleted successfully' });
      fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.msg || 'Failed to delete employee' });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = searchQuery === '' ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter(u => u.role === 'admin').length;
  const employeeCount = users.filter(u => u.role === 'employee').length;

  return (
    <div className="admin-employees">
      {/* Header */}
      <div className="emp-header">
        <div>
          <h1 className="emp-title">Employee Directory</h1>
          <p className="emp-subtitle">Manage your team members and their roles.</p>
        </div>
        <button type="button" className="emp-create-btn" onClick={openModal}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
          Create User
        </button>
      </div>

      {message.text && (
        <div className={`admin-message ${message.type}`}>{message.text}</div>
      )}

      {/* Stats */}
      <div className="emp-stats">
        <div className="emp-stat-card">
          <span className="emp-stat-num">{users.length}</span>
          <span className="emp-stat-label">Total Members</span>
        </div>
        <div className="emp-stat-card">
          <span className="emp-stat-num">{adminCount}</span>
          <span className="emp-stat-label">Admins</span>
        </div>
        <div className="emp-stat-card">
          <span className="emp-stat-num">{employeeCount}</span>
          <span className="emp-stat-label">Employees</span>
        </div>
      </div>

      {/* Filters */}
      <div className="emp-filters">
        <div className="emp-search">
          <span className="material-symbols-outlined emp-search-icon">search</span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="emp-search-input"
          />
        </div>
        <div className="emp-role-chips">
          <button className={`emp-chip ${roleFilter === 'all' ? 'active' : ''}`} onClick={() => setRoleFilter('all')}>All</button>
          <button className={`emp-chip ${roleFilter === 'admin' ? 'active' : ''}`} onClick={() => setRoleFilter('admin')}>Admins</button>
          <button className={`emp-chip ${roleFilter === 'employee' ? 'active' : ''}`} onClick={() => setRoleFilter('employee')}>Employees</button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <p className="admin-loading">Loading users...</p>
      ) : filteredUsers.length === 0 ? (
        <div className="emp-empty-card"><p>No team members found</p></div>
      ) : (
        <div className="emp-grid">
          {filteredUsers.map((u) => (
            <div key={u._id} className="emp-card">
              <div className={`emp-role-badge role-${u.role}`}>
                {u.role === 'admin' ? 'Admin' : 'Employee'}
              </div>
              <div className="emp-card-avatar">
                {u.profilePic ? (
                  <img src={u.profilePic} alt="" />
                ) : (
                  <div className="emp-avatar-initials">{getInitials(u.name)}</div>
                )}
              </div>
              <h3 className="emp-card-name">{u.name}</h3>
              <p className="emp-card-email">{u.email}</p>
              <div className="emp-card-footer">
                <span className="emp-status-badge">
                  <span className="emp-status-dot"></span>
                  Active
                </span>
                <button
                  type="button"
                  className="emp-delete-btn"
                  onClick={() => handleDelete(u)}
                  disabled={deletingId === u._id}
                  title="Delete employee"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                  {deletingId === u._id ? 'Deleting...' : 'Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create User Modal */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Create User</h3>
              <button type="button" className="admin-modal-close" onClick={() => setModalOpen(false)} aria-label="Close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="admin-modal-hint">As an admin, you can create new employees or other admins.</p>
            {message.text && (
              <div className={`admin-message ${message.type}`}>{message.text}</div>
            )}
            <form onSubmit={handleSubmit} className="admin-modal-form">
              <div className="form-group">
                <label htmlFor="create-name">Full Name</label>
                <input id="create-name" name="name" value={formData.name} onChange={handleChange} required placeholder="Full name" />
              </div>
              <div className="form-group">
                <label htmlFor="create-email">Email</label>
                <input id="create-email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="email@example.com" />
              </div>
              <div className="form-group">
                <label htmlFor="create-role">Role</label>
                <select id="create-role" name="role" value={formData.role} onChange={handleChange}>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="create-password">Password</label>
                <input id="create-password" name="password" type="password" value={formData.password} onChange={handleChange} required minLength={6} placeholder="Min 6 characters" />
              </div>
              <div className="form-group">
                <label htmlFor="create-confirmPassword">Confirm Password</label>
                <input id="create-confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required minLength={6} placeholder="Confirm password" />
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="admin-modal-btn secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="admin-modal-btn primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmployees;
