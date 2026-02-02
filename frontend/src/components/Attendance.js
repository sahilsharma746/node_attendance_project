import React, { useState } from 'react';
import '../css/Attendance.css';

const Attendance = () => {
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const getCurrentDate = () => {
    const today = new Date();
    const weekday = today.toLocaleDateString('en-US', { weekday: 'long' });
    const month = today.toLocaleDateString('en-US', { month: 'long' });
    const day = today.getDate();
    const ordinal = getOrdinalSuffix(day);
    return `${weekday}, ${month} ${day}${ordinal}`;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleCheckIn = () => {
    const now = new Date();
    setCheckedIn(true);
    setCheckInTime(now);
  };

  const handleCheckOut = () => {
    if (checkInTime) {
      const checkOutTime = new Date();
      const newRecord = {
        date: checkInTime.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        checkIn: formatTime(checkInTime),
        checkOut: formatTime(checkOutTime),
        status: 'Present',
      };
      setAttendanceHistory([newRecord, ...attendanceHistory]);
      setCheckedIn(false);
      setCheckInTime(null);
    }
  };

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <div className="header-left">
          <h1 className="attendance-title">Your Attendance Record</h1>
          <p className="attendance-subtitle">Manage check-ins and view history</p>
        </div>
      </div>

      <div className="attendance-content">
        <div className="current-day-card">
          <div className="card-left">
            <div className="clock-icon">
            <img src="/images/clock.png" alt="Clock" className="clock-icon-image" />
            </div>
            <div className="date-info">
              <div className="current-date">{getCurrentDate()}</div>
              <div className="status-message">
                {checkedIn
                  ? `Checked in at ${formatTime(checkInTime)}`
                  : "You haven't checked in yet today"}
              </div>
            </div>
          </div>
          <div className="card-right">
            <button
              className={`check-in-btn ${checkedIn ? 'disabled' : ''}`}
              onClick={handleCheckIn}
              disabled={checkedIn}
            >
              Check In
            </button>
            <button
              className={`check-out-btn ${!checkedIn ? 'disabled' : ''}`}
              onClick={handleCheckOut}
              disabled={!checkedIn}
            >
              Check Out
            </button>
          </div>
        </div>

        <div className="attendance-history-card">
          <div className="history-header">
           <img src="/images/calendar.png" alt="History" className="history-icon-image" />
            <h2 className="history-title">Attendance History</h2>
          </div>
          <div className="history-table-container">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceHistory.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-table-cell">
                      No records found
                    </td>
                  </tr>
                ) : (
                  attendanceHistory.map((record, index) => (
                    <tr key={index}>
                      <td>{record.date}</td>
                      <td>{record.checkIn}</td>
                      <td>{record.checkOut}</td>
                      <td>
                        <span className="status-badge">{record.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
