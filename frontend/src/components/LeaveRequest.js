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
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState({ type: '', startDate: '', endDate: '', reason: '', isHalfDay: false, halfDaySession: 'first_half', isShortBreak: false, breakHours: 1, breakFromTime: '', breakToTime: '' });

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
    if (!form.type || !form.startDate || (!form.isShortBreak && !form.endDate)) {
      setMessage({ type: 'error', text: 'Please fill all required fields' }); return;
    }
    setSubmitLoading(true); setMessage(null);
    try {
      const payload = { type: form.type, startDate: form.startDate, endDate: form.isShortBreak ? form.startDate : form.endDate, reason: form.reason };
      if (form.isHalfDay) { payload.isHalfDay = true; payload.halfDaySession = form.halfDaySession; payload.endDate = form.startDate; }
      if (form.isShortBreak) { payload.isShortBreak = true; payload.breakHours = form.breakHours; payload.breakFromTime = form.breakFromTime; payload.breakToTime = form.breakToTime; payload.endDate = form.startDate; }
      if (form.document) { payload.document = form.document; payload.documentName = form.documentName; }
      await axios.post(LEAVE_API, payload);
      setMessage({ type: 'success', text: form.isShortBreak ? 'Short break request submitted!' : 'Leave request submitted successfully!' });
      setForm({ type: '', startDate: '', endDate: '', reason: '', isHalfDay: false, halfDaySession: 'first_half', isShortBreak: false, breakHours: 1, breakFromTime: '', breakToTime: '' });
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
  const casualEntitled = leaveStats?.entitledSoFar ?? 0;

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
              <div className="lv-duration-toggles">
                <label className={`lv-duration-option ${!form.isHalfDay && !form.isShortBreak ? 'active' : ''}`}>
                  <input type="radio" name="duration" checked={!form.isHalfDay && !form.isShortBreak} onChange={() => setForm({...form, isHalfDay: false, isShortBreak: false})} />
                  <span className="material-symbols-outlined" style={{fontSize:18}}>event</span>
                  Full Day
                </label>
                <label className={`lv-duration-option ${form.isHalfDay ? 'active' : ''}`}>
                  <input type="radio" name="duration" checked={form.isHalfDay} onChange={() => setForm({...form, isHalfDay: true, isShortBreak: false})} />
                  <span className="material-symbols-outlined" style={{fontSize:18}}>timelapse</span>
                  Half Day
                </label>
                <label className={`lv-duration-option ${form.isShortBreak ? 'active' : ''}`}>
                  <input type="radio" name="duration" checked={form.isShortBreak} onChange={() => setForm({...form, isShortBreak: true, isHalfDay: false})} />
                  <span className="material-symbols-outlined" style={{fontSize:18}}>coffee</span>
                  Short Break
                </label>
              </div>
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
              {form.isShortBreak && (
                <div className="lv-break-section">
                  <div className="lv-break-hours">
                    <label>Break Duration</label>
                    <div className="lv-break-options">
                      {[1, 2, 3].map(h => (
                        <button key={h} type="button" className={`lv-break-btn ${form.breakHours === h ? 'active' : ''}`} onClick={() => setForm({...form, breakHours: h})}>
                          {h} {h === 1 ? 'Hour' : 'Hours'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="lv-break-time-row">
                    <div className="lv-field">
                      <label>From Time</label>
                      <input type="time" value={form.breakFromTime} onChange={e => setForm({...form, breakFromTime: e.target.value})} />
                    </div>
                    <div className="lv-field">
                      <label>To Time</label>
                      <input type="time" value={form.breakToTime} onChange={e => setForm({...form, breakToTime: e.target.value})} />
                    </div>
                  </div>
                </div>
              )}
              <div className="lv-form-row">
                <div className="lv-field"><label>{form.isShortBreak ? 'Date' : 'Start Date'}</label><input type="date" value={form.startDate} min={new Date().toISOString().slice(0, 10)} onChange={e => setForm({...form, startDate: e.target.value})} /></div>
                {!form.isHalfDay && !form.isShortBreak && <div className="lv-field"><label>End Date</label><input type="date" value={form.endDate} min={form.startDate || new Date().toISOString().slice(0, 10)} onChange={e => setForm({...form, endDate: e.target.value})} /></div>}
              </div>
              <div className="lv-field"><label>Reason for Leave</label>
                <textarea rows={4} placeholder="Briefly describe the reason for your leave..." value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} />
              </div>
              <div className="lv-field"><label>Supporting Documents (Optional)</label>
                <span className="lv-hint">Required for Sick Leave exceeding 2 days.</span>
                {form.documentName ? (
                  <div className="lv-uploaded-file">
                    <span className="material-symbols-outlined" style={{fontSize:20, color:'#047857'}}>description</span>
                    <span className="lv-uploaded-name">{form.documentName}</span>
                    <button type="button" className="lv-remove-file" onClick={() => setForm({...form, document: '', documentName: ''})}>
                      <span className="material-symbols-outlined" style={{fontSize:18}}>close</span>
                    </button>
                  </div>
                ) : (
                  <label className="lv-upload">
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:'none'}} onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { setMessage({type:'error', text:'File too large. Max 5MB'}); return; }
                      const reader = new FileReader();
                      reader.onload = () => setForm({...form, document: reader.result, documentName: file.name});
                      reader.readAsDataURL(file);
                      e.target.value = '';
                    }} />
                    <span className="material-symbols-outlined lv-upload-icon">upload_file</span>
                    <span className="lv-upload-text">Click to upload or drag and drop</span>
                    <span className="lv-upload-hint">PDF, JPG, PNG (Max 5MB)</span>
                  </label>
                )}
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
              {/* <div className="lv-side-row"><div className="lv-dot sick"></div><span>Sick Leave</span><span className="lv-days">8 Days</span></div> */}
              {/* <div className="lv-side-row"><div className="lv-dot dark"></div><span>Paid Leave</span><span className="lv-days">20 Days</span></div> */}
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
        <div className="lv-card lv-balance-hero">
          <h3 className="lv-hero-title">Casual Leave Balance</h3>
          <div className="lv-hero-num">{casualRemaining}</div>
          <p className="lv-hero-sub">{casualUsed} used out of {casualEntitled} earned ({casualTotal} annual)</p>
          <div className="lv-hero-bar">
            <div className="lv-hero-bar-fill" style={{ width: `${casualTotal > 0 ? Math.min((casualUsed / casualTotal) * 100, 100) : 0}%` }}></div>
          </div>
        </div>
      </div>

      <div className="lv-history">
        <div className="lv-history-head"><h3>Leave History</h3>
          <div className="lv-filter-group">
            {['all', 'pending', 'approved', 'rejected'].map(s => (
              <button key={s} className={`lv-filter-chip ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="lv-card"><div className="lv-table-wrap"><table className="lv-table"><thead><tr><th>Type</th><th>Dates</th><th>Duration</th><th>Status</th><th className="text-right">Action</th></tr></thead>
          <tbody>{leaves.filter(l => statusFilter === 'all' || l.status === statusFilter).length === 0 ? <tr><td colSpan={5} className="lv-empty">No leave requests found</td></tr> : leaves.filter(l => statusFilter === 'all' || l.status === statusFilter).map(l => (
            <React.Fragment key={l._id}>
            <tr><td><div className="lv-type-cell"><div className={`lv-type-icon ${getTypeColor(l.type)}`}><span className="material-symbols-outlined" style={{fontSize:18}}>{getTypeIcon(l.type)}</span></div><span className="lv-type-name">{l.type}</span></div></td>
              <td className="text-muted">{formatDate(l.startDateStr)}{l.startDateStr !== l.endDateStr ? ` - ${formatDate(l.endDateStr)}` : ''}</td>
              <td className="text-muted">{l.isShortBreak ? `${l.breakHours}h Break` : `${l.days} Day${l.days !== 1 ? 's' : ''}`}</td>
              <td><span className={`lv-status ${getStatusClass(l.status)}`}>{l.status}</span></td>
              <td className="text-right"><button className="lv-view-btn" onClick={() => setSelectedLeave(selectedLeave?._id === l._id ? null : l)}>View Details</button></td></tr>
              {selectedLeave?._id === l._id && (
                <tr><td colSpan={5} className="lv-detail-row">
                  <div className="lv-detail-box">
                    <p><strong>Reason:</strong> {l.reason || 'No reason provided'}</p>
                    {l.isHalfDay && <p><strong>Half Day:</strong> {l.halfDaySession === 'first_half' ? 'First Half' : 'Second Half'}</p>}
                    {l.isShortBreak && <p><strong>Short Break:</strong> {l.breakHours} {l.breakHours === 1 ? 'Hour' : 'Hours'}{l.breakFromTime && l.breakToTime ? ` (${l.breakFromTime} - ${l.breakToTime})` : ''}</p>}
                    {l.adminNote && <p><strong>Admin Note:</strong> {l.adminNote}</p>}
                    <p><strong>Applied:</strong> {formatDate(l.createdAt)}</p>
                  </div>
                </td></tr>
              )}
            </React.Fragment>
          ))}</tbody></table></div></div>
      </div>
    </div>
  );
};

export default LeaveRequest;
