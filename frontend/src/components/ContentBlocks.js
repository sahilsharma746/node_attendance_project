import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getAttendanceStatus } from '../utils/attendanceCalculator';
import '../css/ContentBlocks.css';

const LEAVE_API = 'http://localhost:3000/api/leave';
const HOLIDAYS_API = 'http://localhost:3000/api/holidays';
const UPDATES_API = 'http://localhost:3000/api/updates';
const ATTENDANCE_API = 'http://localhost:3000/api/attendance';

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
  const { user } = useAuth();
  const [onLeaveToday, setOnLeaveToday] = useState([]);
  const [onLeaveLoading, setOnLeaveLoading] = useState(true);
  const [onLeaveError, setOnLeaveError] = useState(null);
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [holidaysLoading, setHolidaysLoading] = useState(true);
  const [holidaysError, setHolidaysError] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [updatesLoading, setUpdatesLoading] = useState(true);
  const [updatesError, setUpdatesError] = useState(null);
  const [checkInStatus, setCheckInStatus] = useState(null);
  const [checkInLoading, setCheckInLoading] = useState(true);
  const [checkInError, setCheckInError] = useState(null);
  const [employeesInOffice, setEmployeesInOffice] = useState([]);
  const [employeesInOfficeLoading, setEmployeesInOfficeLoading] = useState(true);
  const [employeesInOfficeError, setEmployeesInOfficeError] = useState(null);

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

  useEffect(() => {
    const fetchCheckInStatus = async () => {
      if (!user) {
        setCheckInLoading(false);
        return;
      }
      try {
        setCheckInError(null);
        const res = await axios.get(`${ATTENDANCE_API}/today`);
        setCheckInStatus({
          checkedIn: res.data.checkedIn,
          checkInTime: res.data.checkInTime ? new Date(res.data.checkInTime) : null,
          record: res.data.record,
        });
      } catch (err) {
        setCheckInStatus(null);
        setCheckInError(err.response?.data?.msg || err.message || 'Failed to load check-in status');
      } finally {
        setCheckInLoading(false);
      }
    };
    fetchCheckInStatus();
  }, [user]);

  useEffect(() => {
    const fetchEmployeesInOffice = async () => {
      if (!user) {
        setEmployeesInOfficeLoading(false);
        return;
      }
      try {
        setEmployeesInOfficeError(null);
        const res = await axios.get(`${ATTENDANCE_API}/in-office`);
        setEmployeesInOffice(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setEmployeesInOffice([]);
        const msg = err.response?.status === 404
          ? 'Employees in office not available. Restart the backend server.'
          : (err.response?.data?.msg || err.message || 'Failed to load employees in office');
        setEmployeesInOfficeError(msg);
      } finally {
        setEmployeesInOfficeLoading(false);
      }
    };
    fetchEmployeesInOffice();
  }, [user]);

  return (
    <div className="content-blocks">
      <div className="content-column">
        <div className="content-block">
          <div className="block-header">
            <h3>Today's Status</h3>
          </div>
          <div className="block-content">
            {checkInLoading ? (
              <div className="empty-state">
                <p>Loading...</p>
              </div>
            ) : checkInError ? (
              <div className="empty-state on-leave-error">
                <p>{checkInError}</p>
              </div>
            ) : !checkInStatus || !checkInStatus.checkInTime ? (
              <div className="status-display">
                <div className="status-icon-large">
                  <img src="/images/wall-clock.png" alt="Not Checked In" />
                </div>
                <div className="status-text">
                  <div className="status-title">Not Checked In</div>
                  <div className="status-subtitle">Check in to record your attendance</div>
                </div>
              </div>
            ) : (() => {
              const status = getAttendanceStatus(checkInStatus.checkInTime, null);
              const formatTime = (date) => {
                return new Date(date).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                });
              };
              const displayStatus = checkInStatus.record?.status || status.statusMessage;
              const isLate = checkInStatus.record?.isLate || status.isLate;
              
              return (
                <div className="status-display">
                  <div className="status-icon-large">
                    <img src={checkInStatus.checkedIn ? "/images/clock.png" : "/images/wall-clock.png"} alt={checkInStatus.checkedIn ? "Checked In" : "Checked Out"} />
                  </div>
                  <div className="status-text">
                    <div className="status-title">
                      {checkInStatus.checkedIn ? "Checked In" : "Checked Out"}
                    </div>
                    <div className="status-subtitle">
                      {formatTime(checkInStatus.checkInTime)}
                    </div>
                    {displayStatus && (
                      <div className="status-message" style={{ 
                        marginTop: '8px', 
                        fontSize: '12px', 
                        color: isLate ? '#dc2626' : '#22c55e',
                        fontWeight: 500
                      }}>
                        {displayStatus}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
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
            {employeesInOfficeLoading ? (
              <div className="empty-state">
                <p>Loading...</p>
              </div>
            ) : employeesInOfficeError ? (
              <div className="empty-state on-leave-error">
                <p>{employeesInOfficeError}</p>
              </div>
            ) : employeesInOffice.length === 0 ? (
              <div className="empty-state">
                <p>No employees currently in office</p>
              </div>
            ) : (
              <ul className="on-leave-list">
                {employeesInOffice.map((employee) => (
                  <li key={employee._id} className="on-leave-item" style={{ borderLeftColor: employee.isLate ? '#dc2626' : '#22c55e' }}>
                    <span className="on-leave-name">{employee.user?.name || 'Unknown'}</span>
                    <span className="on-leave-meta">
                      Checked in: {employee.checkIn}
                    </span>
                    <span className="on-leave-meta" style={{ 
                      color: employee.isLate ? '#dc2626' : '#22c55e',
                      fontWeight: 500,
                      marginTop: '2px'
                    }}>
                      {employee.status}
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
