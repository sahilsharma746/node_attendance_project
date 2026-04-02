import React, { useState, useEffect } from 'react';
import '../css/AttendanceSheet.css';

const BASE_CSV_URL = process.env.REACT_APP_SHEET_CSV_URL;

// Each sheet tab (month) has its own gid
const SHEET_TABS = [
  { gid: '0', label: 'Jul 2025' },
  { gid: '729447152', label: 'Aug 2025' },
  { gid: '227034736', label: 'Sep 2025' },
  { gid: '1435744892', label: 'Oct 2025' },
  { gid: '89673042', label: 'Nov 2025' },
  { gid: '1692149705', label: 'Dec 2025' },
  { gid: '1522708638', label: 'Jan 2026' },
  { gid: '785195875', label: 'Feb 2026' },
  { gid: '1743297083', label: 'Mar 2026' },
  { gid: '2030559275', label: 'Apr 2026' },
  { gid: '82450032', label: 'May 2026' },
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
  const [selectedTab, setSelectedTab] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('summary');

  // Auto-select the current or latest month on mount
  useEffect(() => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-based
    const currentYear = now.getFullYear();

    // Try to find matching tab for current month
    const monthMap = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 };
    let bestIdx = SHEET_TABS.length - 1; // default to last tab

    for (let i = 0; i < SHEET_TABS.length; i++) {
      const parts = SHEET_TABS[i].label.split(' ');
      const tabMonth = monthMap[parts[0]];
      const tabYear = parseInt(parts[1]);
      if (tabYear === currentYear && tabMonth === currentMonth) {
        bestIdx = i;
        break;
      }
    }
    setSelectedTab(bestIdx);
  }, []);

  // Fetch CSV when tab changes
  useEffect(() => {
    if (selectedTab === null) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const gid = SHEET_TABS[selectedTab].gid;
        const url = `${BASE_CSV_URL}&gid=${gid}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch attendance data');
        const text = await res.text();
        const { headers, rows } = parseCSV(text);

        // Filter out summary columns (Total P, Total A, etc.) and empty rows
        const dateHeaders = headers.filter((h) => /^\d{1,2}-/.test(h));
        const nameIdx = 0;
        const dateIndices = dateHeaders.map((dh) => headers.indexOf(dh));

        setHeaders(['Name', ...dateHeaders]);
        setRows(
          rows
            .filter((r) => r[nameIdx] && r[nameIdx].trim())
            .map((r) => [r[nameIdx], ...dateIndices.map((di) => r[di] || '')])
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedTab]);

  // Build summary from current data
  const buildSummary = () => {
    return rows.map((row) => {
      const name = row[0];
      let present = 0, absent = 0, wfh = 0, leave = 0, holiday = 0;
      const totalDays = row.length - 1;

      for (let i = 1; i < row.length; i++) {
        const cat = categorize(row[i]);
        if (cat === 'present') present++;
        else if (cat === 'absent') absent++;
        else if (cat === 'wfh') wfh++;
        else if (cat === 'leave') leave++;
        else if (cat === 'holiday') holiday++;
      }

      return { name, totalDays, present, absent, wfh, leave, holiday };
    });
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

  const summary = buildSummary();

  return (
    <div className="sheet-container">
      <div className="sheet-header">
        <h1 className="sheet-title">Attendance Sheet</h1>
        <p className="sheet-subtitle">Team attendance overview</p>
      </div>

      {/* Month Tabs */}
      <div className="month-tabs">
        {SHEET_TABS.map((tab, i) => (
          <button
            key={tab.gid}
            className={`month-tab ${selectedTab === i ? 'active' : ''}`}
            onClick={() => setSelectedTab(i)}
          >
            {tab.label}
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

      {loading ? (
        <div className="sheet-loading">Loading attendance data...</div>
      ) : error ? (
        <div className="sheet-error">
          <p>Failed to load attendance data.</p>
          <p>{error}</p>
          <button onClick={() => setSelectedTab(selectedTab)} className="sheet-retry-btn">
            Retry
          </button>
        </div>
      ) : view === 'summary' ? (
        <div className="sheet-card">
          <h2 className="card-title">{SHEET_TABS[selectedTab]?.label} — Summary</h2>
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
      ) : (
        <div className="sheet-card">
          <h2 className="card-title">{SHEET_TABS[selectedTab]?.label} — Daily Attendance</h2>
          <div className="sheet-table-wrapper">
            <table className="sheet-table">
              <thead>
                <tr>
                  {headers.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={headers.length} className="sheet-empty">No data found</td>
                  </tr>
                ) : (
                  rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} className={ci > 0 ? getCellClass(cell) : 'cell-name'}>
                          {cell}
                        </td>
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
