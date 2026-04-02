import React, { useState, useEffect } from 'react';
import '../css/AttendanceSheet.css';

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSQUEIAgNDsFbsV3OZP9AR1FuLMq69pD3PZpwbNVAoo2b5oakOu4kunO531mBHlqzFpry_YEQ3_zmxl/pub?output=csv';

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

const AttendanceSheet = () => {
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(SHEET_CSV_URL);
        if (!res.ok) throw new Error('Failed to fetch attendance data');
        const text = await res.text();
        const { headers, rows } = parseCSV(text);
        setHeaders(headers);
        setRows(rows);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCellClass = (value) => {
    const v = value?.toUpperCase?.();
    if (v === 'P') return 'cell-present';
    if (v === 'A') return 'cell-absent';
    if (v === 'L') return 'cell-leave';
    if (v === 'H') return 'cell-holiday';
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

  return (
    <div className="sheet-container">
      <div className="sheet-header">
        <h1 className="sheet-title">Attendance Sheet</h1>
        <p className="sheet-subtitle">Team attendance from Google Sheets</p>
      </div>

      <div className="sheet-legend">
        <span className="legend-item">
          <span className="legend-dot present"></span> P - Present
        </span>
        <span className="legend-item">
          <span className="legend-dot absent"></span> A - Absent
        </span>
        <span className="legend-item">
          <span className="legend-dot leave"></span> L - Leave
        </span>
        <span className="legend-item">
          <span className="legend-dot holiday"></span> H - Holiday
        </span>
      </div>

      <div className="sheet-card">
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
                  <td colSpan={headers.length} className="sheet-empty">
                    No data found
                  </td>
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
    </div>
  );
};

export default AttendanceSheet;
