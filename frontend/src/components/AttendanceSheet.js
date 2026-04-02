import React, { useState, useEffect } from 'react';
import '../css/AttendanceSheet.css';

const SHEET_CSV_URL = process.env.REACT_APP_SHEET_CSV_URL;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const parseCSV = (text) => {
  const lines = text.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes;
      } else if (line[i] === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += line[i];
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
};

const parseMonthFromHeader = (header) => {
  // Handles formats like "01-Apr", "1-Apr", "01-Jul", "1-January", etc.
  const match = header.match(/\d{1,2}[- /](.*)/);
  if (!match) return null;
  const monthStr = match[1].trim();
  const idx = SHORT_MONTHS.findIndex(
    (m) => monthStr.toLowerCase().startsWith(m.toLowerCase())
  );
  return idx !== -1 ? idx : null;
};

const categorize = (value) => {
  if (!value) return null;
  const v = value.toUpperCase().trim();
  if (v === 'P') return 'present';
  if (v === 'A') return 'absent';
  if (v === 'WFH') return 'wfh';
  if (v === 'HOLIDAY' || v === 'H') return 'holiday';
  if (['ML', 'EL', 'CL', 'SL', 'L', 'PL', 'LEAVE'].includes(v)) return 'leave';
  if (v === '') return null;
  return 'other';
};

const AttendanceSheet = () => {
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [view, setView] = useState('summary'); // 'summary' or 'daily'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(SHEET_CSV_URL);
        if (!res.ok) throw new Error('Failed to fetch attendance data');
        const text = await res.text();
        const { headers, rows } = parseCSV(text);
        setHeaders(headers);
        setRows(rows);

        // Auto-select the latest month
        const months = new Set();
        headers.slice(1).forEach((h) => {
          const m = parseMonthFromHeader(h);
          if (m !== null) months.add(m);
        });
        const monthArr = [...months];
        if (monthArr.length > 0) {
          setSelectedMonth(monthArr[monthArr.length - 1]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Get available months from headers
  const availableMonths = [];
  const seenMonths = new Set();
  headers.slice(1).forEach((h) => {
    const m = parseMonthFromHeader(h);
    if (m !== null && !seenMonths.has(m)) {
      seenMonths.add(m);
      availableMonths.push(m);
    }
  });

  // Get column indices for selected month
  const getMonthColumns = (month) => {
    const cols = [];
    headers.forEach((h, i) => {
      if (i === 0) return;
      if (parseMonthFromHeader(h) === month) cols.push(i);
    });
    return cols;
  };

  // Build summary data for selected month
  const buildSummary = (month) => {
    const cols = getMonthColumns(month);
    const totalDays = cols.length;

    return rows.map((row) => {
      const name = row[0] || '';
      let present = 0, absent = 0, wfh = 0, leave = 0, holiday = 0, other = 0;

      cols.forEach((ci) => {
        const cat = categorize(row[ci]);
        if (cat === 'present') present++;
        else if (cat === 'absent') absent++;
        else if (cat === 'wfh') wfh++;
        else if (cat === 'leave') leave++;
        else if (cat === 'holiday') holiday++;
        else if (cat === 'other') other++;
      });

      return { name, totalDays, present, absent, wfh, leave, holiday, other };
    }).filter((r) => r.name);
  };

  // Build daily data for selected month
  const getDailyData = (month) => {
    const cols = getMonthColumns(month);
    const dayHeaders = cols.map((ci) => headers[ci]);
    const dayRows = rows.map((row) => ({
      name: row[0] || '',
      days: cols.map((ci) => row[ci] || ''),
    })).filter((r) => r.name);
    return { dayHeaders, dayRows };
  };

  const getCellClass = (value) => {
    const cat = categorize(value);
    if (cat === 'present') return 'cell-present';
    if (cat === 'absent') return 'cell-absent';
    if (cat === 'leave') return 'cell-leave';
    if (cat === 'holiday') return 'cell-holiday';
    if (cat === 'wfh') return 'cell-wfh';
    return '';
  };

  if (loading) {
    return (
      <div className="sheet-container">
        <div className="sheet-loading">Loading attendance data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sheet-container">
        <div className="sheet-error">
          <p>Failed to load attendance data.</p>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="sheet-retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const summary = selectedMonth !== null ? buildSummary(selectedMonth) : [];
  const daily = selectedMonth !== null ? getDailyData(selectedMonth) : { dayHeaders: [], dayRows: [] };

  return (
    <div className="sheet-container">
      <div className="sheet-header">
        <div>
          <h1 className="sheet-title">Attendance Sheet</h1>
          <p className="sheet-subtitle">Team attendance overview</p>
        </div>
      </div>

      {/* Month Tabs */}
      <div className="month-tabs">
        {availableMonths.map((m) => (
          <button
            key={m}
            className={`month-tab ${selectedMonth === m ? 'active' : ''}`}
            onClick={() => setSelectedMonth(m)}
          >
            {MONTH_NAMES[m]}
          </button>
        ))}
      </div>

      {/* View Toggle */}
      <div className="view-toggle">
        <button
          className={`toggle-btn ${view === 'summary' ? 'active' : ''}`}
          onClick={() => setView('summary')}
        >
          Summary
        </button>
        <button
          className={`toggle-btn ${view === 'daily' ? 'active' : ''}`}
          onClick={() => setView('daily')}
        >
          Daily View
        </button>
      </div>

      {/* Legend */}
      <div className="sheet-legend">
        <span className="legend-item"><span className="legend-dot present"></span> Present</span>
        <span className="legend-item"><span className="legend-dot absent"></span> Absent</span>
        <span className="legend-item"><span className="legend-dot wfh"></span> WFH</span>
        <span className="legend-item"><span className="legend-dot leave"></span> Leave</span>
        <span className="legend-item"><span className="legend-dot holiday"></span> Holiday</span>
      </div>

      {selectedMonth !== null && view === 'summary' && (
        <div className="sheet-card">
          <h2 className="card-title">{MONTH_NAMES[selectedMonth]} — Summary</h2>
          <div className="sheet-table-wrapper">
            <table className="sheet-table summary-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Total Days</th>
                  <th>Present</th>
                  <th>WFH</th>
                  <th>Absent</th>
                  <th>Leave</th>
                  <th>Holiday</th>
                </tr>
              </thead>
              <tbody>
                {summary.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="sheet-empty">No data found</td>
                  </tr>
                ) : (
                  summary.map((s, i) => (
                    <tr key={i}>
                      <td className="cell-name">{s.name}</td>
                      <td>{s.totalDays}</td>
                      <td className="cell-present">{s.present}</td>
                      <td className="cell-wfh">{s.wfh}</td>
                      <td className="cell-absent">{s.absent}</td>
                      <td className="cell-leave">{s.leave}</td>
                      <td className="cell-holiday">{s.holiday}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedMonth !== null && view === 'daily' && (
        <div className="sheet-card">
          <h2 className="card-title">{MONTH_NAMES[selectedMonth]} — Daily Attendance</h2>
          <div className="sheet-table-wrapper">
            <table className="sheet-table">
              <thead>
                <tr>
                  <th>Name</th>
                  {daily.dayHeaders.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {daily.dayRows.length === 0 ? (
                  <tr>
                    <td colSpan={daily.dayHeaders.length + 1} className="sheet-empty">No data found</td>
                  </tr>
                ) : (
                  daily.dayRows.map((r, ri) => (
                    <tr key={ri}>
                      <td className="cell-name">{r.name}</td>
                      {r.days.map((d, di) => (
                        <td key={di} className={getCellClass(d)}>{d}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceSheet;
