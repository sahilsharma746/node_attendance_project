import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import '../css/Analytics.css';

const API = process.env.REACT_APP_API_URL + '/api/attendance';
const BASE_CSV_URL = process.env.REACT_APP_SHEET_CSV_URL;

const COLORS = ['#4f46e5', '#e5e7eb'];
const PIE_COLORS = ['#22c55e', '#ef4444'];
const EMPLOYEE_COLORS = [
  '#4f46e5', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
  '#84cc16', '#e11d48', '#0ea5e9', '#a855f7', '#10b981',
];

// Last 9 months of Google Sheet tabs (Aug 2025 - Apr 2026)
const SHEET_MONTHS = [
  { gid: '729447152', label: 'Aug 2025', short: 'Aug' },
  { gid: '227034736', label: 'Sep 2025', short: 'Sep' },
  { gid: '1435744892', label: 'Oct 2025', short: 'Oct' },
  { gid: '89673042', label: 'Nov 2025', short: 'Nov' },
  { gid: '1692149705', label: 'Dec 2025', short: 'Dec' },
  { gid: '1522708638', label: 'Jan 2026', short: 'Jan' },
  { gid: '785195875', label: 'Feb 2026', short: 'Feb' },
  { gid: '1743297083', label: 'Mar 2026', short: 'Mar' },
  { gid: '2030559275', label: 'Apr 2026', short: 'Apr' },
];

const EXCLUDED_EMPLOYEES = ['akash'];

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
  return null;
};

const Analytics = () => {
  const { user } = useAuth();
  const [source, setSource] = useState('system');

  // System data state
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Google Sheet state
  const [sheetData, setSheetData] = useState(null);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('all');

  // Fetch system analytics
  const fetchAnalytics = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API}/analytics`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch Google Sheet data for last 9 months
  const fetchSheetData = useCallback(async () => {
    setSheetLoading(true);
    setSheetError(null);
    try {
      const allMonthData = [];
      for (const month of SHEET_MONTHS) {
        const url = `${BASE_CSV_URL}&gid=${month.gid}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${month.label}`);
        const text = await res.text();
        const { headers, rows } = parseCSV(text);

        const dateHeaders = headers.filter((h) => /^\d{1,2}-/.test(h));
        const nameIdx = 0;
        const dateIndices = dateHeaders.map((dh) => headers.indexOf(dh));

        const employees = {};
        rows.forEach((row) => {
          const name = row[nameIdx]?.trim();
          if (!name) return;
          if (EXCLUDED_EMPLOYEES.some((ex) => name.toLowerCase().includes(ex.toLowerCase()))) return;
          let present = 0, absent = 0, wfh = 0, leave = 0, holiday = 0;
          const totalDays = dateIndices.length;

          dateIndices.forEach((di) => {
            const cat = categorize(row[di]);
            if (cat === 'present') present++;
            else if (cat === 'absent') absent++;
            else if (cat === 'wfh') wfh++;
            else if (cat === 'leave') leave++;
            else if (cat === 'holiday') holiday++;
          });

          employees[name] = { present, absent, wfh, leave, holiday, totalDays };
        });

        allMonthData.push({ month: month.short, label: month.label, employees });
      }
      setSheetData(allMonthData);
    } catch (err) {
      setSheetError(err.message || 'Failed to load Google Sheet data');
    } finally {
      setSheetLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    if (source === 'sheet' && !sheetData) {
      fetchSheetData();
    }
  }, [source, sheetData, fetchSheetData]);

  // Get unique employee names from sheet data
  const getEmployeeNames = () => {
    if (!sheetData) return [];
    const names = new Set();
    sheetData.forEach((m) => Object.keys(m.employees).forEach((n) => names.add(n)));
    return Array.from(names).sort();
  };

  // Build charts data from sheet
  const buildSheetCharts = () => {
    if (!sheetData) return {};
    const employeeNames = getEmployeeNames();

    // 1. Monthly attendance comparison (all employees)
    const monthlyComparison = sheetData.map((m) => {
      const entry = { month: m.month };
      employeeNames.forEach((name) => {
        entry[name] = m.employees[name]?.present || 0;
      });
      return entry;
    });

    // 2. Per-employee monthly trend
    const employeeTrend = (empName) => {
      return sheetData.map((m) => {
        const emp = m.employees[empName] || {};
        return {
          month: m.month,
          present: emp.present || 0,
          absent: emp.absent || 0,
          wfh: emp.wfh || 0,
          leave: emp.leave || 0,
        };
      });
    };

    // 3. Overall pie chart (all employees combined or selected)
    const buildPie = (empName) => {
      let present = 0, absent = 0, wfh = 0, leave = 0, holiday = 0;
      sheetData.forEach((m) => {
        if (empName === 'all') {
          Object.values(m.employees).forEach((e) => {
            present += e.present;
            absent += e.absent;
            wfh += e.wfh;
            leave += e.leave;
            holiday += e.holiday;
          });
        } else {
          const e = m.employees[empName] || {};
          present += e.present || 0;
          absent += e.absent || 0;
          wfh += e.wfh || 0;
          leave += e.leave || 0;
          holiday += e.holiday || 0;
        }
      });
      return [
        { name: 'Present', value: present },
        { name: 'Absent', value: absent },
        { name: 'WFH', value: wfh },
        { name: 'Leave', value: leave },
        { name: 'Holiday', value: holiday },
      ].filter((d) => d.value > 0);
    };

    // 4. Best attendance ranking
    const ranking = employeeNames.map((name) => {
      let totalPresent = 0, totalDays = 0;
      sheetData.forEach((m) => {
        const emp = m.employees[name];
        if (emp) {
          totalPresent += emp.present + emp.wfh;
          totalDays += emp.totalDays;
        }
      });
      const rate = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;
      return { name, totalPresent, totalDays, rate };
    }).sort((a, b) => b.rate - a.rate);

    return { monthlyComparison, employeeTrend, buildPie, ranking, employeeNames };
  };

  const SHEET_PIE_COLORS = ['#22c55e', '#ef4444', '#8b5cf6', '#f59e0b', '#3b82f6'];

  // Render system analytics
  const renderSystem = () => {
    if (loading) return <div className="analytics-loading">Loading analytics...</div>;
    if (error) return <div className="analytics-error">{error}</div>;
    if (!data) return null;

    const { dailyData, monthlyData, avgHoursByDay } = data;
    const currentMonth = monthlyData[monthlyData.length - 1];
    const pieData = [
      { name: 'Present', value: currentMonth.present },
      { name: 'Absent', value: currentMonth.absent },
    ];
    const totalPresent = monthlyData.reduce((sum, m) => sum + m.present, 0);
    const totalWorking = monthlyData.reduce((sum, m) => sum + m.workingDays, 0);
    const attendanceRate = totalWorking > 0 ? Math.round((totalPresent / totalWorking) * 100) : 0;
    const avgWorkHours = dailyData.filter(d => d.workHours > 0).length > 0
      ? (dailyData.filter(d => d.workHours > 0).reduce((s, d) => s + d.workHours, 0) /
         dailyData.filter(d => d.workHours > 0).length).toFixed(1)
      : '0';

    return (
      <>
        <div className="analytics-stats">
          <div className="analytics-stat-card">
            <div className="stat-value">{attendanceRate}%</div>
            <div className="stat-label">Attendance Rate (6 months)</div>
          </div>
          <div className="analytics-stat-card">
            <div className="stat-value">{totalPresent}</div>
            <div className="stat-label">Total Days Present</div>
          </div>
          <div className="analytics-stat-card">
            <div className="stat-value">{avgWorkHours}h</div>
            <div className="stat-label">Avg Work Hours (7 days)</div>
          </div>
          <div className="analytics-stat-card">
            <div className="stat-value">{currentMonth.present}/{currentMonth.workingDays}</div>
            <div className="stat-label">This Month</div>
          </div>
        </div>

        <div className="analytics-grid">
          <div className="analytics-card">
            <h3>Daily Work Hours (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 13 }} />
                <YAxis tick={{ fontSize: 13 }} unit="h" />
                <Tooltip formatter={(value) => [`${value}h`, 'Work Hours']} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Bar dataKey="workHours" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="analytics-card">
            <h3>This Month Attendance</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((entry, i) => (<Cell key={entry.name} fill={PIE_COLORS[i]} />))}
                </Pie>
                <Legend /><Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="analytics-card">
            <h3>Monthly Attendance (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 13 }} />
                <YAxis tick={{ fontSize: 13 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Bar dataKey="present" name="Present" fill={COLORS[0]} radius={[6, 6, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill={COLORS[1]} radius={[6, 6, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="analytics-card">
            <h3>Avg Work Hours by Day (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={avgHoursByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 13 }} />
                <YAxis tick={{ fontSize: 13 }} unit="h" />
                <Tooltip formatter={(value) => [`${value}h`, 'Avg Hours']} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Line type="monotone" dataKey="avgHours" stroke="#4f46e5" strokeWidth={2.5} dot={{ fill: '#4f46e5', r: 5 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>
    );
  };

  // Render Google Sheet analytics
  const renderSheet = () => {
    if (sheetLoading) return <div className="analytics-loading">Loading Google Sheet data for last 9 months...</div>;
    if (sheetError) return <div className="analytics-error">{sheetError}</div>;
    if (!sheetData) return null;

    const { monthlyComparison, employeeTrend, buildPie, ranking, employeeNames } = buildSheetCharts();
    const pieData = buildPie(selectedEmployee);
    const trendData = selectedEmployee !== 'all' ? employeeTrend(selectedEmployee) : null;

    // Stats for selected
    const selStats = (() => {
      if (selectedEmployee === 'all') {
        const r = ranking;
        const totalP = r.reduce((s, e) => s + e.totalPresent, 0);
        const totalD = r.reduce((s, e) => s + e.totalDays, 0);
        return {
          present: totalP,
          rate: totalD > 0 ? Math.round((totalP / totalD) * 100) : 0,
          topEmployee: r[0]?.name || '-',
          topRate: r[0]?.rate || 0,
        };
      }
      const emp = ranking.find((r) => r.name === selectedEmployee);
      return {
        present: emp?.totalPresent || 0,
        rate: emp?.rate || 0,
        topEmployee: selectedEmployee,
        topRate: emp?.rate || 0,
      };
    })();

    return (
      <>
        {/* Employee filter */}
        <div className="analytics-filter">
          <label className="filter-label">Employee:</label>
          <select
            className="filter-select"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
          >
            <option value="all">All Employees</option>
            {employeeNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="analytics-stats">
          <div className="analytics-stat-card">
            <div className="stat-value">{selStats.rate}%</div>
            <div className="stat-label">Attendance Rate (9 months)</div>
          </div>
          <div className="analytics-stat-card">
            <div className="stat-value">{selStats.present}</div>
            <div className="stat-label">Total Days Present</div>
          </div>
          <div className="analytics-stat-card">
            <div className="stat-value">{employeeNames.length}</div>
            <div className="stat-label">Total Employees</div>
          </div>
          <div className="analytics-stat-card">
            <div className="stat-value" title={selStats.topEmployee}>
              {selStats.topRate}%
            </div>
            <div className="stat-label">
              {selectedEmployee === 'all' ? `Best: ${selStats.topEmployee}` : 'Your Rate'}
            </div>
          </div>
        </div>

        <div className="analytics-grid">
          {/* Monthly comparison - all employees */}
          <div className="analytics-card analytics-card-full">
            <h3>Monthly Attendance — All Employees (Last 5 Months)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={monthlyComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 13 }} />
                <YAxis tick={{ fontSize: 13 }} label={{ value: 'Days Present', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Legend />
                {employeeNames.map((name, i) => (
                  <Bar key={name} dataKey={name} fill={EMPLOYEE_COLORS[i % EMPLOYEE_COLORS.length]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="analytics-card">
            <h3>
              {selectedEmployee === 'all' ? 'Overall Breakdown (5 Months)' : `${selectedEmployee} — Breakdown`}
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={entry.name} fill={SHEET_PIE_COLORS[i % SHEET_PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend /><Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Employee trend (only when specific employee selected) */}
          {trendData ? (
            <div className="analytics-card">
              <h3>{selectedEmployee} — Monthly Trend</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 13 }} />
                  <YAxis tick={{ fontSize: 13 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Legend />
                  <Bar dataKey="present" name="Present" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="wfh" name="WFH" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="leave" name="Leave" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            /* Attendance ranking when "All" selected */
            <div className="analytics-card">
              <h3>Attendance Ranking (5 Months)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ranking} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'Attendance Rate']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Bar dataKey="rate" fill="#4f46e5" radius={[0, 6, 6, 0]}>
                    {ranking.map((entry, i) => (
                      <Cell key={entry.name} fill={entry.rate >= 80 ? '#22c55e' : entry.rate >= 60 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Attendance trend line (all employees avg or selected) */}
          <div className="analytics-card">
            <h3>
              {selectedEmployee === 'all' ? 'Average Attendance Trend' : `${selectedEmployee} — Attendance Trend`}
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={sheetData.map((m) => {
                  if (selectedEmployee === 'all') {
                    const emps = Object.values(m.employees);
                    const avgPresent = emps.length > 0
                      ? Math.round(emps.reduce((s, e) => s + e.present, 0) / emps.length)
                      : 0;
                    return { month: m.month, days: avgPresent };
                  }
                  return { month: m.month, days: m.employees[selectedEmployee]?.present || 0 };
                })}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 13 }} />
                <YAxis tick={{ fontSize: 13 }} />
                <Tooltip
                  formatter={(value) => [value, 'Days Present']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Line type="monotone" dataKey="days" stroke="#4f46e5" strokeWidth={2.5} dot={{ fill: '#4f46e5', r: 5 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="analytics-page">
      {/* Source Toggle */}
      <div className="analytics-source-toggle">
        <button
          className={`analytics-source-btn ${source === 'system' ? 'active' : ''}`}
          onClick={() => setSource('system')}
        >
          System Records
        </button>
        <button
          className={`analytics-source-btn ${source === 'sheet' ? 'active' : ''}`}
          onClick={() => setSource('sheet')}
        >
          Google Sheet
        </button>
      </div>

      {source === 'system' ? renderSystem() : renderSheet()}
    </div>
  );
};

export default Analytics;
