import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../css/CalendarPage.css';

const LEAVE_API = process.env.REACT_APP_API_URL + '/api/leave';
const HOLIDAYS_API = process.env.REACT_APP_API_URL + '/api/holidays';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const CalendarPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month'); // 'month' or 'week'
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const [leavesRes, holidaysRes] = await Promise.all([
        axios.get(`${LEAVE_API}/team-calendar?year=${year}&month=${month + 1}`),
        axios.get(`${HOLIDAYS_API}?year=${year}`),
      ]);
      setLeaves(Array.isArray(leavesRes.data) ? leavesRes.data : []);
      setHolidays(Array.isArray(holidaysRes.data) ? holidaysRes.data : []);
    } catch (err) { console.error('Calendar fetch error:', err); }
    finally { setLoading(false); }
  }, [user, year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const prevMonth = () => {
    if (view === 'week') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
    } else {
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };
  const nextMonth = () => {
    if (view === 'week') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
    } else {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };
  const goToday = () => setCurrentDate(new Date());

  // Build calendar grid
  const today = new Date();
  const isToday = (d, m, y) => d === today.getDate() && m === today.getMonth() && y === today.getFullYear();

  // Get events for a specific date
  const getEventsForDate = (day, cellMonth, cellYear) => {
    const dateStr = `${cellYear}-${String(cellMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const events = [];

    // Check holidays
    holidays.forEach(h => {
      const hDate = new Date(h.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      if (hDate === dateStr) {
        events.push({ type: 'holiday', label: h.name, details: h });
      }
    });

    // Check leaves
    leaves.forEach(l => {
      const start = l.startDateStr;
      const end = l.endDateStr;
      if (dateStr >= start && dateStr <= end) {
        const name = l.user?.name?.split(' ')[0] || 'Unknown';
        const statusLabel = l.status === 'approved' ? 'Approved' : 'Pending';
        events.push({
          type: l.status,
          label: `${name} - ${l.type}`,
          statusLabel,
          details: l,
        });
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

  // Build month grid cells
  const buildMonthCells = () => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const cells = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = month - 1 < 0 ? 11 : month - 1;
      const y = month - 1 < 0 ? year - 1 : year;
      cells.push({ day: d, month: m, year: y, isOtherMonth: true });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, month, year, isOtherMonth: false });
    }
    // Next month days to fill grid
    const totalCells = cells.length <= 35 ? 35 : 42;
    const remaining = totalCells - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const m = month + 1 > 11 ? 0 : month + 1;
      const y = month + 1 > 11 ? year + 1 : year;
      cells.push({ day: d, month: m, year: y, isOtherMonth: true });
    }
    return cells;
  };

  // Build week grid cells
  const buildWeekCells = () => {
    const dayOfWeek = currentDate.getDay();
    const startOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - dayOfWeek);
    const cells = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i);
      cells.push({
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        isOtherMonth: d.getMonth() !== month,
      });
    }
    return cells;
  };

  const cells = view === 'month' ? buildMonthCells() : buildWeekCells();

  // Week view title
  const getWeekTitle = () => {
    const dayOfWeek = currentDate.getDay();
    const startOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 6);
    const startStr = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} – ${endStr}`;
  };

  // Events this month for sidebar
  const monthEvents = [];
  holidays.forEach(h => {
    const hDate = new Date(h.date);
    if (hDate.getMonth() === month && hDate.getFullYear() === year) {
      monthEvents.push({ date: hDate, label: h.name, type: 'Public Holiday', color: 'holiday' });
    }
  });

  // Unique leaves this month for sidebar
  const seenLeaves = new Set();
  leaves.forEach(l => {
    if (!seenLeaves.has(l._id) && l.status === 'approved') {
      seenLeaves.add(l._id);
      const startDate = new Date(l.startDate);
      const name = l.user?.name?.split(' ')[0] || 'Unknown';
      monthEvents.push({
        date: startDate,
        label: `${name} - ${l.type} leave`,
        type: l.isHalfDay ? 'Half Day Leave' : `${l.days} day${l.days > 1 ? 's' : ''} leave`,
        color: 'event',
      });
    }
  });

  monthEvents.sort((a, b) => a.date - b.date);

  // Selected day details
  const selectedDayEvents = selectedDay
    ? getEventsForDate(selectedDay.day, selectedDay.month, selectedDay.year)
    : [];

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
          <button className={`cal-view-btn ${view === 'month' ? 'active' : ''}`} onClick={() => setView('month')}>Month</button>
          <button className={`cal-view-btn ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}>Week</button>
        </div>
      </div>

      <div className="cal-layout">
        {/* Main Calendar */}
        <div className="cal-main">
          {/* Navigation */}
          <div className="cal-nav">
            <h3 className="cal-month-title">{view === 'month' ? monthName : getWeekTitle()}</h3>
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
            {DAYS.map(d => <div key={d} className={`cal-day-name ${d === 'SUN' || d === 'SAT' ? 'weekend' : ''}`}>{d}</div>)}
          </div>

          {/* Calendar Grid */}
          <div className={`cal-grid ${view === 'week' ? 'week-view' : ''}`}>
            {cells.map((cell, i) => {
              const events = getEventsForDate(cell.day, cell.month, cell.year);
              const isTodayCell = isToday(cell.day, cell.month, cell.year);
              const isSelected = selectedDay && selectedDay.day === cell.day && selectedDay.month === cell.month && selectedDay.year === cell.year;
              const dayOfWeek = new Date(cell.year, cell.month, cell.day).getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              return (
                <div
                  key={i}
                  className={`cal-cell ${cell.isOtherMonth ? 'other-month' : ''} ${isTodayCell ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isWeekend ? 'weekend' : ''}`}
                  onClick={() => setSelectedDay(cell)}
                >
                  <span className={`cal-day-num ${isTodayCell ? 'today' : ''}`}>{cell.day}</span>
                  {events.slice(0, view === 'week' ? 5 : 2).map((ev, j) => (
                    <div key={j} className={`cal-event ${getEventClass(ev.type)}`} title={ev.label}>
                      {ev.label}
                    </div>
                  ))}
                  {events.length > (view === 'week' ? 5 : 2) && (
                    <span className="cal-more">+{events.length - (view === 'week' ? 5 : 2)} more</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="cal-sidebar">
          {/* Selected Day Detail */}
          {selectedDay && (
            <div className="cal-card cal-detail-card">
              <div className="cal-detail-header">
                <h3 className="cal-card-title" style={{ fontSize: 18 }}>
                  {new Date(selectedDay.year, selectedDay.month, selectedDay.day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <button className="cal-close-btn" onClick={() => setSelectedDay(null)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                </button>
              </div>
              {selectedDayEvents.length === 0 ? (
                <p className="cal-empty">No events on this day</p>
              ) : (
                <div className="cal-detail-list">
                  {selectedDayEvents.map((ev, i) => (
                    <div key={i} className={`cal-detail-item ${getEventClass(ev.type)}`}>
                      <span className="cal-detail-label">{ev.label}</span>
                      {ev.statusLabel && <span className="cal-detail-status">{ev.statusLabel}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
              <button className="cal-add-btn" onClick={() => navigate('/dashboard/leave-request')} title="Apply for leave">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
              </button>
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
