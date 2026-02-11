import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../css/SummaryCards.css';

const ATTENDANCE_API = 'http://localhost:3000/api/attendance';
const LEAVE_API = 'http://localhost:3000/api/leave';

const SummaryCards = () => {
  const { user } = useAuth();
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [leaveStats, setLeaveStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardStats = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [attendanceRes, leaveRes] = await Promise.all([
        axios.get(`${ATTENDANCE_API}/my-summary`),
        axios.get(`${LEAVE_API}/my/stats`),
      ]);
      setAttendanceSummary(attendanceRes.data);
      setLeaveStats(leaveRes.data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setError(err.response?.data?.msg || err.message || 'Failed to load stats');
      setAttendanceSummary(null);
      setLeaveStats(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const daysPresent = attendanceSummary?.daysPresent ?? 0;
  const lateCount = attendanceSummary?.lateCount ?? 0;
  const daysPresentThisWeek = attendanceSummary?.daysPresentThisWeek ?? 0;
  const lateCountThisWeek = attendanceSummary?.lateCountThisWeek ?? 0;
  const casualLeaveRemaining = leaveStats?.remaining ?? 0;
  const pendingRequests = leaveStats?.pendingCount ?? 0;

  const weekChangeText =
    daysPresentThisWeek > 0
      ? `${daysPresentThisWeek} day${daysPresentThisWeek !== 1 ? 's' : ''} present this week`
      : 'No attendance this week';

  const lateSubtext =
    lateCount > 0
      ? lateCount === 1
        ? '1 late arrival this month'
        : `${lateCount} late arrivals this month`
      : 'All on time this month';

  if (loading) {
    return (
      <div className="summary-cards">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="summary-card summary-card-loading">
            <div className="card-icon">
              <div className="skeleton-icon" />
            </div>
            <div className="card-content">
              <div className="skeleton-label" />
              <div className="skeleton-value" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="summary-cards">
        <div className="summary-cards-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="summary-cards">
      <div className="summary-card">
        <div className="card-icon">
          <img src="/images/calendar.png" alt="Days Present" />
        </div>
        <div className="card-content">
          <div className="card-label">Days Present</div>
          <div className="card-value">{daysPresent}</div>
          <div className={`card-change ${daysPresentThisWeek > 0 ? 'green' : ''}`}>
            {weekChangeText}
          </div>
        </div>
      </div>

      <div className="summary-card">
        <div className="card-icon">
          <img src="/images/wall-clock.png" alt="Late Arrivals" />
        </div>
        <div className="card-content">
          <div className="card-label">Late Arrivals</div>
          <div className="card-value">{lateCount}</div>
          <div className={`card-change ${lateCount > 0 ? 'orange' : 'green'}`}>
            {lateSubtext}
          </div>
        </div>
      </div>

      {/* <div className="summary-card">
        <div className="card-icon">
          <img src="/images/leave.png" alt="Leave Balance" />
        </div>
        <div className="card-content">
          <div className="card-label">Casual Leave</div>
          <div className="card-value">{casualLeaveRemaining}</div>
          {leaveStats != null && (
            <div className="card-change" style={{ color: '#6b7280' }}>
              {leaveStats.usedThisYear} used this year
            </div>
          )}
        </div>
      </div> */}

      {/* <div className="summary-card">
        <div className="card-icon">
          <img src="/images/warning.png" alt="Pending Requests" />
        </div>
        <div className="card-content">
          <div className="card-label">Pending Requests</div>
          <div className="card-value">{pendingRequests}</div>
          <div className={`card-change ${pendingRequests > 0 ? 'orange' : ''}`}>
            {pendingRequests === 0
              ? 'No pending requests'
              : `${pendingRequests} awaiting approval`}
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default SummaryCards;
