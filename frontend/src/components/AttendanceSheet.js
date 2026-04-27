import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../css/CalendarPage.css';

const LEAVE_API = process.env.REACT_APP_API_URL + '/api/leave';
const HOLIDAYS_API = process.env.REACT_APP_API_URL + '/api/holidays';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const CalendarPage = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const [leavesRes, holidaysRes] = await Promise.all([
        axios.get(`${LEAVE_API}/my`),
        axios.get(`${HOLIDAYS_API}?year=${year}`),
      ]);
      setLeaves(Array.isArray(leavesRes.data) ? leavesRes.data : []);
      setHolidays(Array.isArray(holidaysRes.data) ? holidaysRes.data : []);
    } catch (err) { console.error('Calendar fetch error:', err); }
    finally { setLoading(false); }
  }, [user, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const cells = [];
  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, isOtherMonth: true });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, isOtherMonth: false });
  }
  // Next month days
  const remaining = 35 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, isOtherMonth: true });
  }

  // Get events for a specific day
  const getEventsForDay = (day) => {
    if (!day || day.isOtherMonth) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
    const events = [];

    // Check holidays
    holidays.forEach(h => {
      const hDate = new Date(h.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      if (hDate === dateStr) {
        events.push({ type: 'holiday', label: h.name });
      }
    });

    // Check leaves
    leaves.forEach(l => {
      const start = l.startDateStr;
      const end = l.endDateStr;
      if (dateStr >= start && dateStr <= end) {
        const name = user?.name?.split(' ')[0] || 'You';
        const statusLabel = l.status === 'approved' ? 'Approved' : l.status === 'pending' ? 'Pending' : 'Rejected';
        events.push({ type: l.status, label: `${name} (${statusLabel})` });
      }
    });

    return events;
  };

  const getEventClass = (type) => {
    if (type === 'holiday') return 'cal-event-holiday';
    if (type === 'approved') return 'cal-event-approved';
    if (type === 'pending') return 'cal-event-pending';
    return 'cal-event-default';
  };

  // Events this month for sidebar
  const monthEvents = [];
  holidays.forEach(h => {
    const hDate = new Date(h.date);
    if (hDate.getMonth() === month && hDate.getFullYear() === year) {
      monthEvents.push({ date: hDate, label: h.name, type: 'Public Holiday', color: 'holiday' });
    }
  });

  if (loading) return <div className="cal"><h1 className="cal-title">Team Calendar</h1><p className="cal-subtitle">Loading...</p></div>;

  return (
    <div className="cal">
      {/* Header */}
      <div className="cal-header">
        <div>
          <h1 className="cal-title">Team Calendar</h1>
          <p className="cal-subtitle">Manage schedules, leaves, and corporate events.</p>
        </div>
        <div className="cal-view-toggle">
          <button className="cal-view-btn active">Month</button>
          <button className="cal-view-btn">Week</button>
        </div>
      </div>

      <div className="cal-layout">
        {/* Main Calendar */}
        <div className="cal-main">
          {/* Navigation */}
          <div className="cal-nav">
            <h3 className="cal-month-title">{monthName}</h3>
            <div className="cal-nav-actions">
              <button className="cal-today-btn" onClick={goToday}>Today</button>
              <div className="cal-arrows">
                <button className="cal-arrow-btn" onClick={prevMonth}>
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="cal-arrow-btn" onClick={nextMonth}>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          {/* Days Header */}
          <div className="cal-days-header">
            {DAYS.map(d => <div key={d} className="cal-day-name">{d}</div>)}
          </div>

          {/* Calendar Grid */}
          <div className="cal-grid">
            {cells.map((cell, i) => {
              const events = getEventsForDay(cell);
              return (
                <div key={i} className={`cal-cell ${cell.isOtherMonth ? 'other-month' : ''} ${!cell.isOtherMonth && isToday(cell.day) ? 'today' : ''}`}>
                  <span className={`cal-day-num ${!cell.isOtherMonth && isToday(cell.day) ? 'today' : ''}`}>{cell.day}</span>
                  {events.slice(0, 2).map((ev, j) => (
                    <div key={j} className={`cal-event ${getEventClass(ev.type)}`}>{ev.label}</div>
                  ))}
                  {events.length > 2 && <span className="cal-more">+{events.length - 2} more</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="cal-sidebar">
          {/* Legend */}
          <div className="cal-card">
            <h3 className="cal-card-title">Calendar Legend</h3>
            <div className="cal-legend-list">
              <div className="cal-legend-item"><div className="cal-legend-dot approved"></div><span>Approved Leaves</span></div>
              <div className="cal-legend-item"><div className="cal-legend-dot pending"></div><span>Pending Leaves</span></div>
              <div className="cal-legend-item"><div className="cal-legend-dot holiday"></div><span>Public Holidays</span></div>
              <div className="cal-legend-item"><div className="cal-legend-dot event"></div><span>Company Events</span></div>
            </div>
          </div>

          {/* Events this Month */}
          <div className="cal-card cal-events-card">
            <div className="cal-events-header">
              <h3 className="cal-card-title">Events this Month</h3>
              <button className="cal-add-btn"><span className="material-symbols-outlined" style={{fontSize:18}}>add</span></button>
            </div>
            {monthEvents.length === 0 ? (
              <p className="cal-empty">No events this month</p>
            ) : (
              <div className="cal-events-list">
                {monthEvents.map((ev, i) => (
                  <div key={i} className="cal-event-item">
                    <div className={`cal-event-date-box ${ev.color}`}>
                      <span className="cal-event-month">{ev.date.toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="cal-event-day">{String(ev.date.getDate()).padStart(2, '0')}</span>
                    </div>
                    <div className="cal-event-info">
                      <span className="cal-event-name">{ev.label}</span>
                      <span className="cal-event-type">{ev.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
