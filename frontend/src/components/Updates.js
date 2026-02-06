import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/Updates.css';

const API_BASE = 'http://localhost:3002/api/updates';

const formatUpdateDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const Updates = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        setError(null);
        const res = await axios.get(API_BASE);
        setUpdates(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setUpdates([]);
        setError(err.response?.data?.msg || err.message || 'Failed to load updates');
      } finally {
        setLoading(false);
      }
    };
    fetchUpdates();
  }, []);
  

  return (
    <div className="updates-container">
      <div className="updates-header">
        <h1 className="updates-title">Updates</h1>
        <p className="updates-subtitle">Stay informed about the latest updates</p>
      </div>
      <div className="updates-card">
        <div className="updates-card-header">
          <img src="/images/updated.png" alt="Updates" className="updates-card-header-icon" />
          <h2 className="card-title">Latest Updates</h2>
        </div>
        <div className="updates-card-content">
          {loading ? (
            <div className="empty-state">
              <div className="empty-state-title">Loading...</div>
            </div>
          ) : error ? (
            <div className="empty-state">
              <div className="empty-state-title updates-error-text">{error}</div>
            </div>
          ) : updates.length === 0 ? (
            <div className="empty-state">
              <img src="/images/notification.png" alt="Updates" className="empty-state-icon" />
              <div className="empty-state-title">No updates available</div>
              <div className="empty-state-subtitle">Check back later for updates</div>
            </div>
          ) : (
            <ul className="updates-list-page">
              {updates.map((u) => (
                <li key={u._id} className="updates-list-item">
                  <span className="updates-list-item-title">{u.title}</span>
                  {u.content && <p className="updates-list-item-content">{u.content}</p>}
                  <span className="updates-list-item-meta">
                    {u.createdByName || 'Admin'} · {formatUpdateDate(u.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Updates;