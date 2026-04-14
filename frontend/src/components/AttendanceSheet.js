import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../css/AttendanceSheet.css';

const BASE_CSV_URL = process.env.REACT_APP_SHEET_CSV_URL;
const ATTENDANCE_API = process.env.REACT_APP_API_URL + '/api/attendance';

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

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
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
  const [dataSource, setDataSource] = useState('system');
  // Google Sheet state
  const [selectedTab, setSelectedTab] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('summary');

  // System records state
  const [sysMonth, setSysMonth] = useState(new Date().getMonth() + 1);
  const [sysYear, setSysYear] = useState(new Date().getFullYear());
  const [sysData, setSysData] = useState(null);
  const [sysLoading, setSysLoading] = useState(false);
  const [sysError, setSysError] = useState(null);
  const [sysView, setSysView] = useState('summary');

  // Auto-select the current or latest month on mount
  useEffect(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthMap = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 };
    let bestIdx = SHEET_TABS.length - 1;
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

  // Fetch Google Sheet CSV when tab changes
  useEffect(() => {
    if (selectedTab === null || dataSource !== 'google') return;
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
  }, [selectedTab, dataSource]);

  // Fetch system records
  const fetchSystemData = useCallback(async () => {
    setSysLoading(true);
    setSysError(null);
    try {
      const res = await axios.get(`${ATTENDANCE_API}/team-monthly`, {
        params: { month: sysMonth, year: sysYear },
      });
      setSysData(res.data);
    } catch (err) {
      setSysError(err.response?.data?.msg || 'Failed to load system records');
      setSysData(null);
    } finally {
      setSysLoading(false);
    }
  }, [sysMonth, sysYear]);

  useEffect(() => {
    if (dataSource === 'system') {
      fetchSystemData();
    }
  }, [dataSource, fetchSystemData]);

  // Google Sheet helpers
  const buildSummary = () => {
    return rows.map((row) => {
      const name = row[0];
      let present = 0, absent = 0, wfh = 0, leave = 0, holiday = 0;
      for (let i = 1; i < row.length; i++) {
        const cat = categorize(row[i]);
        if (cat === 'present') present++;
        else if (cat === 'absent') absent++;
        else if (cat === 'wfh') wfh++;
        else if (cat === 'leave') leave++;
        else if (cat === 'holiday') holiday++;
      }
      const totalDays = present + absent + wfh + leave;
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

  // Render system records
  const renderSystemRecords = () => {
    if (sysLoading) {
      return <div className="sheet-loading">Loading system records...</div>;
    }
    if (sysError) {
      return (
        <div className="sheet-error">
          <p>{sysError}</p>
          <button onClick={fetchSystemData} className="sheet-retry-btn">Retry</button>
        </div>
      );
    }
    if (!sysData || !sysData.employees) return null;

    const { daysInMonth, workingDays, employees } = sysData;
    const monthLabel = MONTHS.find((m) => m.value === sysMonth)?.label || '';

    if (sysView === 'summary') {
      return (
        <div className="sheet-card">
          <h2 className="card-title">{monthLabel} {sysYear} — System Summary</h2>
          <div className="sheet-table-wrapper">
            <table className="sheet-table summary-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Days Present</th>
                  <th>Working Days</th>
                  <th>Attendance %</th>
                  <th>Total Hours</th>
                  <th>Avg Hours/Day</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="sheet-empty">No data found</td>
                  </tr>
                ) : (
                  employees.map((emp) => {
                    const pct = workingDays > 0
                      ? Math.round((emp.totalPresent / workingDays) * 100)
                      : 0;
                    const avgHrs = emp.totalPresent > 0
                      ? (emp.totalHours / emp.totalPresent).toFixed(1)
                      : '0';
                    return (
                      <tr key={emp.user._id}>
                        <td className="cell-name">{emp.user.name}</td>
                        <td className="cell-present">{emp.totalPresent}</td>
                        <td>{workingDays}</td>
                        <td>
                          <span className={`sys-pct ${pct >= 80 ? 'good' : pct >= 60 ? 'avg' : 'low'}`}>
                            {pct}%
                          </span>
                        </td>
                        <td>{emp.totalHours}h</td>
                        <td>{avgHrs}h</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // Daily grid view
    const dayNumbers = [];
    for (let d = 1; d <= daysInMonth; d++) dayNumbers.push(d);

    return (
      <div className="sheet-card">
        <h2 className="card-title">{monthLabel} {sysYear} — Daily Attendance</h2>
        <div className="sheet-table-wrapper">
          <table className="sheet-table">
            <thead>
              <tr>
                <th>Employee</th>
                {dayNumbers.map((d) => {
                  const date = new Date(sysYear, sysMonth - 1, d);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  return (
                    <th key={d} className={isWeekend ? 'sys-weekend-header' : ''}>
                      {d}
                    </th>
                  );
                })}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={daysInMonth + 2} className="sheet-empty">No data found</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.user._id}>
                    <td className="cell-name">{emp.user.name}</td>
                    {dayNumbers.map((d) => {
                      const dayData = emp.days[d];
                      const date = new Date(sysYear, sysMonth - 1, d);
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      if (dayData?.present) {
                        return (
                          <td
                            key={d}
                            className="cell-present sys-day-cell"
                            title={`${dayData.checkIn} - ${dayData.checkOut || 'No checkout'} (${dayData.workHours}h)`}
                          >
                            P
                          </td>
                        );
                      }
                      return (
                        <td key={d} className={`sys-day-cell ${isWeekend ? 'sys-weekend' : 'cell-absent'}`}>
                          {isWeekend ? '-' : 'A'}
                        </td>
                      );
                    })}
                    <td className="cell-present" style={{ fontWeight: 700 }}>{emp.totalPresent}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="sheet-container">
      <div className="sheet-header">
        <h1 className="sheet-title">Attendance Sheet</h1>
        <p className="sheet-subtitle">Team attendance overview</p>
      </div>

      {/* Data Source Toggle */}
      <div className="source-toggle">
        <button
          className={`source-btn ${dataSource === 'system' ? 'active' : ''}`}
          onClick={() => setDataSource('system')}
        >
          System Records
        </button>
        <button
          className={`source-btn ${dataSource === 'google' ? 'active' : ''}`}
          onClick={() => setDataSource('google')}
        >
          Google Sheet
        </button>
      </div>

      {dataSource === 'system' ? (
        <>
          {/* Month/Year selector for system records */}
          <div className="sys-filters">
            <select
              className="sys-select"
              value={sysMonth}
              onChange={(e) => setSysMonth(Number(e.target.value))}
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              className="sys-select"
              value={sysYear}
              onChange={(e) => setSysYear(Number(e.target.value))}
            >
              {[2026, 2025, 2024].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div className="view-toggle">
            <button
              className={`toggle-btn ${sysView === 'summary' ? 'active' : ''}`}
              onClick={() => setSysView('summary')}
            >
              Summary
            </button>
            <button
              className={`toggle-btn ${sysView === 'daily' ? 'active' : ''}`}
              onClick={() => setSysView('daily')}
            >
              Daily View
            </button>
          </div>

          {/* Legend for system daily view */}
          {sysView === 'daily' && (
            <div className="sheet-legend">
              <span className="legend-item"><span className="legend-dot present"></span> Present</span>
              <span className="legend-item"><span className="legend-dot absent"></span> Absent</span>
              <span className="legend-item"><span className="legend-dot weekend"></span> Weekend</span>
            </div>
          )}

          {renderSystemRecords()}
        </>
      ) : (
        <>
          {/* Month Tabs for Google Sheet */}
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
        </>
      )}
    </div>
  );
};

export default AttendanceSheet;
