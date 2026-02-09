import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../../css/admin/AdminHolidays.css';

const API_BASE = 'http://localhost:3000/api/holidays';

const AdminHolidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', date: '', description: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ year: yearFilter });
      const res = await axios.get(`${API_BASE}?${params.toString()}`);
      setHolidays(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to load holidays');
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  }, [yearFilter]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const openAdd = () => {
    setEditingId(null);
    setForm({
      name: '',
      date: new Date().toISOString().slice(0, 10),
      description: '',
    });
    setModalOpen(true);
  };

  const openEdit = (h) => {
    setEditingId(h._id);
    setForm({
      name: h.name,
      date: h.date,
      description: h.description || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm({ name: '', date: '', description: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Holiday name is required');
      return;
    }
    if (!form.date) {
      setError('Date is required');
      return;
    }
    setSubmitLoading(true);
    setError('');
    try {
      if (editingId) {
        await axios.patch(`${API_BASE}/${editingId}`, {
          name: form.name.trim(),
          date: form.date,
          description: form.description.trim(),
        });
      } else {
        await axios.post(API_BASE, {
          name: form.name.trim(),
          date: form.date,
          description: form.description.trim(),
        });
      }
      closeModal();
      fetchHolidays();
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.msg || err.message;
      if (status === 404) {
        setError('Holidays API not found. Restart the backend server and try again.');
      } else if (status === 401 || status === 403) {
        setError('You must be logged in as admin to save holidays.');
      } else {
        setError(msg || 'Failed to save holiday');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;
    setError('');
    try {
      await axios.delete(`${API_BASE}/${id}`);
      fetchHolidays();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete holiday');
    }
  };

  return (
    <div className="admin-holidays">
      <div className="holidays-card">
        <div className="card-header-section">
          <h2 className="section-title">Holidays List</h2>
          <div className="holidays-header-actions">
            <select
              className="filter-select year-select"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              {[2026, 2025, 2024, 2023].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button type="button" className="add-holiday-btn" onClick={openAdd}>
              Add Holiday
            </button>
          </div>
        </div>
        {error && <div className="holidays-error">{error}</div>}
        <div className="table-container">
          <table className="holidays-table">
            <thead>
              <tr>
                <th>Holiday Name</th>
                <th>Date</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="empty-table-cell">Loading...</td>
                </tr>
              ) : holidays.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-table-cell">
                    No holidays added yet. Click &quot;Add Holiday&quot; to add one.
                  </td>
                </tr>
              ) : (
                holidays.map((h) => (
                  <tr key={h._id}>
                    <td>{h.name}</td>
                    <td>{h.dateDisplay || h.date}</td>
                    <td>{h.description || '–'}</td>
                    <td>
                      <div className="holiday-actions">
                        <button
                          type="button"
                          className="holiday-btn holiday-btn-edit"
                          onClick={() => openEdit(h)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="holiday-btn holiday-btn-delete"
                          onClick={() => handleDelete(h._id)}
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
        <div className="holiday-modal-overlay" onClick={closeModal}>
          <div className="holiday-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="holiday-modal-title">
              {editingId ? 'Edit Holiday' : 'Add Holiday'}
            </h3>
            {error && <div className="holidays-error holiday-modal-error">{(error)}</div>}
            <form onSubmit={handleSubmit} className="holiday-form">
              <div className="form-group">
                <label htmlFor="holiday-name">Holiday Name *</label>
                <input
                  id="holiday-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Diwali"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="holiday-date">Date *</label>
                <input
                  id="holiday-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="holiday-desc">Description (optional)</label>
                <textarea
                  id="holiday-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <div className="holiday-modal-actions">
                <button type="button" className="holiday-btn holiday-btn-cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="add-holiday-btn" disabled={submitLoading}>
                  {submitLoading ? 'Saving...' : editingId ? 'Update' : 'Add Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHolidays;
