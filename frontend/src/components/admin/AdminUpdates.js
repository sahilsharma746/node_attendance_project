import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../../css/admin/AdminUpdates.css';

const API_BASE = process.env.REACT_APP_API_URL + '/api/updates';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const AdminUpdates = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '' });
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchUpdates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(API_BASE);
      setUpdates(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to load updates');
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ title: '', content: '' });
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditingId(u._id);
    setForm({ title: u.title, content: u.content || '' });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm({ title: '', content: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setSubmitLoading(true);
    setError('');
    try {
      if (editingId) {
        await axios.patch(`${API_BASE}/${editingId}`, {
          title: form.title.trim(),
          content: form.content.trim(),
        });
      } else {
        await axios.post(API_BASE, {
          title: form.title.trim(),
          content: form.content.trim(),
        });
      }
      closeModal();
      fetchUpdates();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to save update');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this update?')) return;
    setError('');
    try {
      await axios.delete(`${API_BASE}/${id}`);
      fetchUpdates();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete update');
    }
  };

  return (
    <div className="admin-updates">
      <div className="updates-card">
        <div className="card-header-section">
          <h2 className="section-title">Latest Updates (Announcements)</h2>
          <button type="button" className="add-update-btn" onClick={openAdd}>
            Add Update
          </button>
        </div>
        {error && <div className="updates-error">{error}</div>}
        <div className="table-container">
          <table className="updates-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Content</th>
                <th>Posted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="empty-table-cell">Loading...</td>
                </tr>
              ) : updates.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-table-cell">
                    No updates yet. Click &quot;Add Update&quot; to post an announcement.
                  </td>
                </tr>
              ) : (
                updates.map((u) => (
                  <tr key={u._id}>
                    <td className="update-title-cell">{u.title}</td>
                    <td className="update-content-cell">{u.content || '–'}</td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>
                      <div className="update-actions">
                        <button
                          type="button"
                          className="update-btn update-btn-edit"
                          onClick={() => openEdit(u)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="update-btn update-btn-delete"
                          onClick={() => handleDelete(u._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="update-modal-overlay" onClick={closeModal}>
          <div className="update-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="update-modal-title">
              {editingId ? 'Edit Update' : 'Add Update'}
            </h3>
            <form onSubmit={handleSubmit} className="update-form">
              <div className="form-group">
                <label htmlFor="update-title">Title *</label>
                <input
                  id="update-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Office closed tomorrow"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="update-content">Content (optional)</label>
                <textarea
                  id="update-content"
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Details..."
                  rows={4}
                />
              </div>
              <div className="update-modal-actions">
                <button type="button" className="update-btn update-btn-cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="add-update-btn" disabled={submitLoading}>
                  {submitLoading ? 'Saving...' : editingId ? 'Update' : 'Add Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUpdates;
