import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../css/LeaveRequest.css';

const LEAVE_API = process.env.REACT_APP_API_URL + '/api/leave';

const LeaveRequest = () => {
  const { user } = useAuth();
  const [view, setView] = useState('balance');
  const [leaveStats, setLeaveStats] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({ type: '', startDate: '', endDate: '', reason: '', isHalfDay: false, halfDaySession: 'first_half' });

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const leavesRes = await axios.get(`${LEAVE_API}/my`);
      setLeaves(Array.isArray(leavesRes.data) ? leavesRes.data : []);
      // Fetch stats in background (can be slow)
      axios.get(`${LEAVE_API}/my/stats`).then(r => setLeaveStats(r.data)).catch(() => {});
    } catch (err) { console.error('Leave fetch error:', err); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.type || !form.startDate || !form.endDate) {
      setMessage({ type: 'error', text: 'Please fill all required fields' }); return;
    }
    setSubmitLoading(true); setMessage(null);
    try {
      const payload = { type: form.type, startDate: form.startDate, endDate: form.endDate, reason: form.reason };
      if (form.isHalfDay) { payload.isHalfDay = true; payload.halfDaySession = form.halfDaySession; payload.endDate = form.startDate; }
      await axios.post(LEAVE_API, payload);
      setMessage({ type: 'success', text: 'Leave request submitted successfully!' });
      setForm({ type: '', startDate: '', endDate: '', reason: '', isHalfDay: false, halfDaySession: 'first_half' });
      fetchData();
      setTimeout(() => setView('balance'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.msg || 'Failed to submit' });
    } finally { setSubmitLoading(false); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '';
  const getStatusClass = (s) => s === 'approved' ? 'leave-status-approved' : s === 'rejected' ? 'leave-status-rejected' : 'leave-status-pending';
  const getTypeIcon = (t) => ({ casual: 'beach_access', sick: 'medical_services', emergency: 'warning', other: 'payments' }[t] || 'event_busy');
  const getTypeColor = (t) => ({ casual: 'type-casual', sick: 'type-sick', emergency: 'type-emergency', other: 'type-paid' }[t] || 'type-casual');

  const casualRemaining = leaveStats?.remaining ?? 0;
  const casualUsed = leaveStats?.usedThisYear ?? 0;
  const casualTotal = leaveStats?.totalBalance ?? 18;

  const balanceCards = [
    { label: 'Casual Leave', sub: 'Annual', icon: 'beach_access', remaining: casualRemaining, total: casualTotal, color: 'primary' },
    { label: 'Sick Leave', sub: 'Annual', icon: 'medical_services', remaining: 8, total: 8, color: 'secondary' },
    { label: 'Paid Leave', sub: 'Earned', icon: 'payments', remaining: 20, total: 20, color: 'tertiary-light' },
    { label: 'WFH', sub: 'Monthly', icon: 'home_work', remaining: 4, total: 4, color: 'tertiary' },
  ];

  if (loading) return <div className="lv"><h1 className="lv-title">Leave Balance</h1><p className="lv-subtitle">Loading...</p></div>;

  if (view === 'apply') return (
    <div className="lv">
      <div className="lv-apply-layout">
        <div className="lv-apply-main">
          <h1 className="lv-title">Apply for Leave</h1>
          <p className="lv-subtitle">Submit your request below. Approval usually takes 1-2 business days.</p>
          {message && <div className={`lv-msg ${message.type}`}>{message.text}</div>}
          <div className="lv-card">
            <form className="lv-form" onSubmit={handleSubmit}>
              <div className="lv-field"><label>Leave Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="" disabled>Select a leave type</option>
                  <option value="casual">Casual Leave</option><option value="sick">Sick Leave</option>
                  <option value="emergency">Emergency Leave</option><option value="other">Other</option>
                </select>
              </div>
              <div className="lv-halfday-toggle">
                <label className="lv-toggle-label">
                  <input type="checkbox" checked={form.isHalfDay} onChange={e => setForm({...form, isHalfDay: e.target.checked})} />
                  <span>Half Day Leave</span>
                </label>
                {form.isHalfDay && (
                  <div className="lv-halfday-options">
                    <label className={`lv-halfday-option ${form.halfDaySession === 'first_half' ? 'active' : ''}`}>
                      <input type="radio" name="halfDay" value="first_half" checked={form.halfDaySession === 'first_half'} onChange={e => setForm({...form, halfDaySession: e.target.value})} />
                      First Half
                    </label>
                    <label className={`lv-halfday-option ${form.halfDaySession === 'second_half' ? 'active' : ''}`}>
                      <input type="radio" name="halfDay" value="second_half" checked={form.halfDaySession === 'second_half'} onChange={e => setForm({...form, halfDaySession: e.target.value})} />
                      Second Half
                    </label>
                  </div>
                )}
              </div>
              <div className="lv-form-row">
                <div className="lv-field"><label>Start Date</label><input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} /></div>
                {!form.isHalfDay && <div className="lv-field"><label>End Date</label><input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} /></div>}
              </div>
              <div className="lv-field"><label>Reason for Leave</label>
                <textarea rows={4} placeholder="Briefly describe the reason for your leave..." value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} />
              </div>
              <div className="lv-field"><label>Supporting Documents (Optional)</label>
                <span className="lv-hint">Required for Sick Leave exceeding 2 days.</span>
                <div className="lv-upload"><span className="material-symbols-outlined lv-upload-icon">upload_file</span>
                  <span className="lv-upload-text">Click to upload or drag and drop</span><span className="lv-upload-hint">PDF, JPG, PNG (Max 5MB)</span>
                </div>
              </div>
              <div className="lv-form-actions">
                <button type="button" className="lv-btn-cancel" onClick={() => setView('balance')}>Cancel</button>
                <button type="submit" className="lv-btn-submit" disabled={submitLoading}>{submitLoading ? 'Submitting...' : 'Submit'}</button>
              </div>
            </form>
          </div>
        </div>
        <div className="lv-apply-side">
          <div className="lv-card lv-side-balance">
            <h3>Leave Balance</h3>
            <div className="lv-side-list">
              <div className="lv-side-row"><div className="lv-dot primary"></div><span>Casual Leave</span><span className="lv-days">{casualRemaining} Days</span></div>
              <div className="lv-side-row"><div className="lv-dot sick"></div><span>Sick Leave</span><span className="lv-days">8 Days</span></div>
              <div className="lv-side-row"><div className="lv-dot dark"></div><span>Paid Leave</span><span className="lv-days">20 Days</span></div>
            </div>
          </div>
          <div className="lv-policy"><div className="lv-policy-inner"><span className="material-symbols-outlined lv-policy-icon">info</span>
            <div><h4>Policy Reminder</h4><p>Sick leaves exceeding 2 consecutive days require a valid medical certificate uploaded as a supporting document.</p></div>
          </div></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="lv">
      <div className="lv-header-row">
        <div><h1 className="lv-title">Leave Balance</h1><p className="lv-subtitle">Track your time off and request new leaves.</p></div>
        <button className="lv-btn-request" onClick={() => setView('apply')}>
          <span className="material-symbols-outlined" style={{fontSize:20}}>add</span>Request Leave
        </button>
      </div>
      {message && <div className={`lv-msg ${message.type}`}>{message.text}</div>}

      <div className="lv-balance-grid">
        {balanceCards.map(c => {
          const used = c.total - c.remaining;
          const pct = c.total > 0 ? Math.round((used / c.total) * 100) : 0;
          return (
            <div key={c.label} className="lv-card lv-balance-card">
              <div className="lv-bc-top"><div className="lv-bc-info"><div className={`lv-bc-icon ${c.color}`}><span className="material-symbols-outlined" style={{fontSize:18}}>{c.icon}</span></div><span className="lv-bc-label">{c.label}</span></div><span className="lv-bc-sub">{c.sub}</span></div>
              <div className="lv-bc-bottom"><div><div className="lv-bc-num">{String(c.remaining).padStart(2,'0')}</div><div className="lv-bc-used">of {String(c.total).padStart(2,'0')} used</div></div>
                <svg viewBox="0 0 36 36" className={`lv-ring ${c.color}`}><path className="lv-ring-bg" d="M18 2.0845a15.9155 15.9155 0 010 31.831 15.9155 15.9155 0 010-31.831"/><path className="lv-ring-fill" d="M18 2.0845a15.9155 15.9155 0 010 31.831 15.9155 15.9155 0 010-31.831" strokeDasharray={`${pct},100`}/></svg>
              </div>
            </div>
          );
        })}
      </div>

      <div className="lv-history">
        <div className="lv-history-head"><h3>Leave History</h3><button className="lv-filter-btn"><span className="material-symbols-outlined" style={{fontSize:18}}>filter_list</span>Filter</button></div>
        <div className="lv-card"><div className="lv-table-wrap"><table className="lv-table"><thead><tr><th>Type</th><th>Dates</th><th>Duration</th><th>Status</th><th className="text-right">Action</th></tr></thead>
          <tbody>{leaves.length === 0 ? <tr><td colSpan={5} className="lv-empty">No leave requests found</td></tr> : leaves.map(l => (
            <tr key={l._id}><td><div className="lv-type-cell"><div className={`lv-type-icon ${getTypeColor(l.type)}`}><span className="material-symbols-outlined" style={{fontSize:18}}>{getTypeIcon(l.type)}</span></div><span className="lv-type-name">{l.type}</span></div></td>
              <td className="text-muted">{formatDate(l.startDateStr)}{l.startDateStr !== l.endDateStr ? ` - ${formatDate(l.endDateStr)}` : ''}</td>
              <td className="text-muted">{l.days} Day{l.days !== 1 ? 's' : ''}</td>
              <td><span className={`lv-status ${getStatusClass(l.status)}`}>{l.status}</span></td>
              <td className="text-right"><button className="lv-view-btn">View Details</button></td></tr>
          ))}</tbody></table></div></div>
      </div>
    </div>
  );
};

export default LeaveRequest;
