import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../css/Updates.css';

const UPDATES_API = process.env.REACT_APP_API_URL + '/api/updates';

const Updates = () => {
  const { user } = useAuth();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUpdates = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await axios.get(UPDATES_API);
      setUpdates(Array.isArray(res.data) ? res.data : []);
      localStorage.setItem('lastSeenUpdatesTime', new Date().toISOString());
    } catch (err) { console.error('Updates fetch error:', err); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchUpdates(); }, [fetchUpdates]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatFullDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group by month for archive
  const getArchiveMonths = () => {
    const months = {};
    updates.forEach(u => {
      const d = new Date(u.createdAt);
      const key = `${d.toLocaleDateString('en-US', { month: 'long' })} ${d.getFullYear()}`;
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months).slice(0, 3);
  };

  if (loading) return <div className="up"><h1 className="up-title">Announcements</h1><p className="up-subtitle">Loading...</p></div>;

  return (
    <div className="up">
      <div className="up-header">
        <div>
          <h1 className="up-title">Announcements</h1>
          <p className="up-subtitle">Stay informed with the latest organizational updates.</p>
        </div>
      </div>

      <div className="up-layout">
        {/* Main Feed */}
        <div className="up-feed">
          {updates.length === 0 ? (
            <div className="up-card up-empty"><p>No announcements yet</p></div>
          ) : (
            updates.map((u, i) => (
              <article key={u._id} className={`up-card up-article ${i === 0 ? 'pinned' : ''}`}>
                <div className="up-article-top">
                  <div className="up-article-meta">
                    {i === 0 && (
                      <span className="up-pinned-badge">
                        <span className="material-symbols-outlined" style={{fontSize:16}}>push_pin</span>
                        Pinned
                      </span>
                    )}
                    <span className="up-date">
                      <span className="material-symbols-outlined" style={{fontSize:14}}>schedule</span>
                      {formatDate(u.createdAt)}
                    </span>
                  </div>
                  <span className="up-tag">{i === 0 ? 'Policy' : i % 2 === 0 ? 'News' : 'Event'}</span>
                </div>

                <h2 className={`up-article-title ${i === 0 ? 'large' : ''}`}>{u.title}</h2>
                <p className="up-article-body">{u.content}</p>

                {i === 0 && u.createdByName && (
                  <div className="up-article-footer">
                    <div className="up-author">
                      <div className="up-author-avatar">{(u.createdByName || 'A').charAt(0)}</div>
                      <span className="up-author-name">{u.createdByName}</span>
                    </div>
                    <a className="up-read-more" href="#">Read Full Policy <span className="material-symbols-outlined" style={{fontSize:18}}>arrow_forward</span></a>
                  </div>
                )}

                {i !== 0 && (
                  <div className="up-article-action">
                    <a className="up-read-more" href="#">Read More <span className="material-symbols-outlined" style={{fontSize:18}}>arrow_forward</span></a>
                  </div>
                )}
              </article>
            ))
          )}
        </div>

        {/* Sidebar */}
        <aside className="up-sidebar">
          {/* Categories */}
          <div className="up-card">
            <h3 className="up-sidebar-title">
              <span className="material-symbols-outlined" style={{fontSize:20}}>category</span>
              Categories
            </h3>
            <ul className="up-cat-list">
              <li className="up-cat-item"><span>Policy Updates</span><span className="up-cat-count">{updates.length}</span></li>
              <li className="up-cat-item"><span>Company News</span><span className="up-cat-count">0</span></li>
              <li className="up-cat-item"><span>Events & Summits</span><span className="up-cat-count">0</span></li>
              <li className="up-cat-item"><span>System Maintenance</span><span className="up-cat-count">0</span></li>
            </ul>
          </div>

          {/* Archive */}
          <div className="up-card">
            <h3 className="up-sidebar-title">
              <span className="material-symbols-outlined" style={{fontSize:20}}>history</span>
              Archive
            </h3>
            <ul className="up-archive-list">
              {getArchiveMonths().map(([month]) => (
                <li key={month} className="up-archive-item">
                  <span className="material-symbols-outlined" style={{fontSize:18}}>folder</span>
                  {month}
                </li>
              ))}
            </ul>
            <button className="up-view-older">View Older</button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Updates;
