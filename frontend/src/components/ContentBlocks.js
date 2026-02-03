import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/ContentBlocks.css';

const LEAVE_API = 'http://localhost:3002/api/leave';
const HOLIDAYS_API = 'http://localhost:3002/api/holidays';
const UPDATES_API = 'http://localhost:3002/api/updates';

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatUpdateDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ContentBlocks = () => {
  const [onLeaveToday, setOnLeaveToday] = useState([]);
  const [onLeaveLoading, setOnLeaveLoading] = useState(true);
  const [onLeaveError, setOnLeaveError] = useState(null);
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [holidaysLoading, setHolidaysLoading] = useState(true);
  const [holidaysError, setHolidaysError] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [updatesLoading, setUpdatesLoading] = useState(true);
  const [updatesError, setUpdatesError] = useState(null);

  useEffect(() => {
    const fetchOnLeaveToday = async () => {
      try {
        setOnLeaveError(null);
        const res = await axios.get(`${LEAVE_API}/on-leave-today`);
        setOnLeaveToday(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setOnLeaveToday([]);
        setOnLeaveError(err.response?.data?.msg || err.message || 'Failed to load team on leave');
      } finally {
        setOnLeaveLoading(false);
      }
    };
    fetchOnLeaveToday();
  }, []);

  useEffect(() => {
    const fetchUpcomingHolidays = async () => {
      try {
        setHolidaysError(null);
        const res = await axios.get(`${HOLIDAYS_API}/upcoming`);
        setUpcomingHolidays(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setUpcomingHolidays([]);
        setHolidaysError(err.response?.data?.msg || err.message || 'Failed to load holidays');
      } finally {
        setHolidaysLoading(false);
      }
    };
    fetchUpcomingHolidays();
  }, []);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        setUpdatesError(null);
        const res = await axios.get(UPDATES_API);
        setUpdates(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setUpdates([]);
        setUpdatesError(err.response?.data?.msg || err.message || 'Failed to load updates');
      } finally {
        setUpdatesLoading(false);
      }
    };
    fetchUpdates();
  }, []);

  return (
    <div className="content-blocks">
      <div className="content-column">
        <div className="content-block">
          <div className="block-header">
            <h3>Today's Status</h3>
            
             
          </div>
          <div className="block-content">
            <div className="status-display">
              <div className="status-icon-large">
               <img src="/images/wall-clock.png" alt="Not Checked In" />
              </div>
              <div className="status-text">
                <div className="status-title">Not Checked In</div>
                <div className="status-subtitle">Check In Time</div>
              </div>
            </div>
          </div>
        </div>

        <div className="content-block">
          <div className="block-header">
            <h3>
              <img src="/images/updated.png" alt="Latest Updates" className="block-header-icon" />
              Latest Updates
            </h3>
          </div>
          <div className="block-content">
            {updatesLoading ? (
              <div className="empty-state">
                <p>Loading...</p>
              </div>
            ) : updatesError ? (
              <div className="empty-state on-leave-error">
                <p>{updatesError}</p>
              </div>
            ) : updates.length === 0 ? (
              <div className="empty-state">
                <p>No updates available</p>
              </div>
            ) : (
              <ul className="updates-list">
                {updates.map((u) => (
                  <li key={u._id} className="update-item">
                    <span className="update-title">{u.title}</span>
                    {u.content && <p className="update-content">{u.content}</p>}
                    <span className="update-meta">
                      {u.createdByName || 'Admin'} · {formatUpdateDate(u.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="content-block">
          <div className="block-header">
            <h3>
              <img src="/images/clock.png" alt="Employees on Break" className="block-header-icon" />
              Employees on Break
            </h3>
          </div>
          <div className="block-content">
            <div className="empty-state">
              <p>No employees currently on break</p>
            </div>
          </div>
        </div>
      </div>

      <div className="content-column">
        <div className="content-block">
          <div className="block-header">
            <h3>
             <img src="/images/holiday.png" alt="Upcoming Holidays" className="block-header-icon" />
              Upcoming Holidays
            </h3>
          </div>
          <div className="block-content">
            {holidaysLoading ? (
              <div className="empty-state">
                <p>Loading...</p>
              </div>
            ) : holidaysError ? (
              <div className="empty-state on-leave-error">
                <p>{holidaysError}</p>
              </div>
            ) : upcomingHolidays.length === 0 ? (
              <div className="empty-state">
                <p>No upcoming holidays</p>
              </div>
            ) : (
              <ul className="holidays-list">
                {upcomingHolidays.map((h) => (
                  <li key={h._id} className="holiday-item">
                    <span className="holiday-name">{h.name}</span>
                    <span className="holiday-date">{h.dateDisplay || formatDisplayDate(h.date)}</span>
                    {h.description && <span className="holiday-desc">{h.description}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="content-block">
          <div className="block-header">
            <h3>
              <img src="/images/employee.png" alt="Employees in Office" className="block-header-icon" />
              Employees in Office
            </h3>
          </div>
          <div className="block-content">
            <div className="empty-state">
              <p>No employees currently in office</p>
            </div>
          </div>
        </div>

        <div className="content-block">
          <div className="block-header">
            <h3>
              <img src="/images/team.png" alt="Team Members on Leave" className="block-header-icon" />
              Team Members on Leave
            </h3>
          </div>
          <div className="block-content">
            {onLeaveLoading ? (
              <div className="empty-state">
                <p>Loading...</p>
              </div>
            ) : onLeaveError ? (
              <div className="empty-state on-leave-error">
                <p>{onLeaveError}</p>
              </div>
            ) : onLeaveToday.length === 0 ? (
              <div className="empty-state">
                <p>No team members on leave today</p>
              </div>
            ) : (
              <ul className="on-leave-list">
                {onLeaveToday.map((leave) => (
                  <li key={leave._id} className="on-leave-item">
                    <span className="on-leave-name">{leave.user?.name || 'Unknown'}</span>
                    <span className="on-leave-meta">
                      {leave.type} · {formatDisplayDate(leave.startDateStr)} – {formatDisplayDate(leave.endDateStr)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentBlocks;
