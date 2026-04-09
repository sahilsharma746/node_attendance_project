import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import '../css/Analytics.css';

const API = process.env.REACT_APP_API_URL + '/api/attendance';

const COLORS = ['#4f46e5', '#e5e7eb'];
const PIE_COLORS = ['#22c55e', '#ef4444'];

const Analytics = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="analytics-page">
        {<h2 className="analytics-title">Analytics</h2>}
        <div className="analytics-loading">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        {<h2 className="analytics-title">Analytics</h2>}
        <div className="analytics-error">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const { dailyData, monthlyData, avgHoursByDay } = data;

  // Pie chart data from current month (last item in monthlyData)
  const currentMonth = monthlyData[monthlyData.length - 1];
  const pieData = [
    { name: 'Present', value: currentMonth.present },
    { name: 'Absent', value: currentMonth.absent },
  ];

  // Total stats
  const totalPresent = monthlyData.reduce((sum, m) => sum + m.present, 0);
  const totalWorking = monthlyData.reduce((sum, m) => sum + m.workingDays, 0);
  const attendanceRate = totalWorking > 0 ? Math.round((totalPresent / totalWorking) * 100) : 0;
  const avgWorkHours = dailyData.filter(d => d.workHours > 0).length > 0
    ? (dailyData.filter(d => d.workHours > 0).reduce((s, d) => s + d.workHours, 0) /
       dailyData.filter(d => d.workHours > 0).length).toFixed(1)
    : '0';

  return (
    <div className="analytics-page">
      {/* <h2 className="analytics-title">Analytics</h2> */}

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
              <Tooltip
                formatter={(value) => [`${value}h`, 'Work Hours']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="workHours" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="analytics-card">
          <h3>This Month Attendance</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {pieData.map((entry, i) => (
                  <Cell key={entry.name} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
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
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
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
              <Tooltip
                formatter={(value) => [`${value}h`, 'Avg Hours']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <Line
                type="monotone"
                dataKey="avgHours"
                stroke="#4f46e5"
                strokeWidth={2.5}
                dot={{ fill: '#4f46e5', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
