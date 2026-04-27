import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/Profile.css';

const API_BASE = process.env.REACT_APP_API_URL;

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState(user?.profilePic || '');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  // Password change
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState(null);
  const [pwLoading, setPwLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  useEffect(() => { setProfilePic(user?.profilePic || ''); }, [user?.profilePic]);

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const MAX_SIZE = 400;
  const JPEG_QUALITY = 0.85;

  const resizeImage = (file, cb) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= MAX_SIZE && height <= MAX_SIZE) {
        const reader = new FileReader();
        reader.onload = () => cb(reader.result);
        reader.readAsDataURL(file);
        return;
      }
      if (width > height) { height = Math.round((height * MAX_SIZE) / width); width = MAX_SIZE; }
      else { width = Math.round((width * MAX_SIZE) / height); height = MAX_SIZE; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      cb(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };
    img.onerror = () => { URL.revokeObjectURL(url); const r = new FileReader(); r.onload = () => cb(r.result); r.readAsDataURL(file); };
    img.src = url;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMessage({ type: 'error', text: 'Please choose an image file' }); return; }
    resizeImage(file, (dataUrl) => { setProfilePic(dataUrl); setMessage({ type: '', text: '' }); });
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setSaving(true);
    const result = await updateProfile({ profilePic });
    setSaving(false);
    if (result.success) setMessage({ type: 'success', text: 'Profile picture updated' });
    else setMessage({ type: 'error', text: result.error });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg({ type: 'error', text: 'Passwords do not match' }); return; }
    if (pwForm.newPw.length < 6) { setPwMsg({ type: 'error', text: 'Password must be at least 6 characters' }); return; }
    setPwLoading(true); setPwMsg(null);
    try {
      await axios.patch(`${API_BASE}/api/auth/me`, { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      setPwMsg({ type: 'success', text: 'Password changed successfully!' });
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.msg || 'Failed to change password' });
    } finally { setPwLoading(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="pf">
      <h1 className="pf-title">Settings</h1>
      <p className="pf-subtitle">Manage your profile, password, and account.</p>

      <div className="pf-grid">
        {/* Profile Card */}
        <div className="pf-card">
          <h3 className="pf-card-title">
            <span className="material-symbols-outlined" style={{fontSize:22}}>person</span>
            Profile
          </h3>

          {message.text && <div className={`pf-msg ${message.type}`}>{message.text}</div>}

          <div className="pf-avatar-section">
            <div className="pf-avatar-large">
              {profilePic ? <img src={profilePic} alt="Profile" /> : <span>{getInitials(user?.name)}</span>}
            </div>
            <div className="pf-avatar-info">
              <div className="pf-name">{user?.name}</div>
              <div className="pf-email">{user?.email}</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="pf-form">
            <label className="pf-upload-label">
              <span className="material-symbols-outlined" style={{fontSize:18}}>upload</span>
              Upload an image file
              <input type="file" accept="image/*" onChange={handleFileChange} className="pf-file-input" />
            </label>
            <div className="pf-actions">
              <button type="button" className="pf-btn-outline" onClick={() => { setProfilePic(''); setMessage({type:'',text:''}); }} disabled={saving}>Clear</button>
              <button type="submit" className="pf-btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>

        {/* Password Card */}
        <div className="pf-card">
          <h3 className="pf-card-title">
            <span className="material-symbols-outlined" style={{fontSize:22}}>lock</span>
            Change Password
          </h3>

          {pwMsg && <div className={`pf-msg ${pwMsg.type}`}>{pwMsg.text}</div>}

          <form onSubmit={handlePasswordChange} className="pf-form">
            <div className="pf-field">
              <label>Current Password</label>
              <div className="pf-input-wrap">
                <input type={showCurrentPw ? 'text' : 'password'} value={pwForm.current} onChange={e => setPwForm({...pwForm, current: e.target.value})} placeholder="Enter current password" required />
                <button type="button" className="pf-pw-toggle" onClick={() => setShowCurrentPw(!showCurrentPw)}>{showCurrentPw ? 'Hide' : 'Show'}</button>
              </div>
            </div>
            <div className="pf-field">
              <label>New Password</label>
              <div className="pf-input-wrap">
                <input type={showNewPw ? 'text' : 'password'} value={pwForm.newPw} onChange={e => setPwForm({...pwForm, newPw: e.target.value})} placeholder="Enter new password" required minLength={6} />
                <button type="button" className="pf-pw-toggle" onClick={() => setShowNewPw(!showNewPw)}>{showNewPw ? 'Hide' : 'Show'}</button>
              </div>
            </div>
            <div className="pf-field">
              <label>Confirm New Password</label>
              <input type="password" value={pwForm.confirm} onChange={e => setPwForm({...pwForm, confirm: e.target.value})} placeholder="Confirm new password" required minLength={6} />
            </div>
            <button type="submit" className="pf-btn-primary" disabled={pwLoading} style={{alignSelf:'flex-start'}}>{pwLoading ? 'Changing...' : 'Change Password'}</button>
          </form>
        </div>

        {/* Logout Card */}
        <div className="pf-card pf-logout-card">
          <h3 className="pf-card-title">
            <span className="material-symbols-outlined" style={{fontSize:22}}>logout</span>
            Sign Out
          </h3>
          <p className="pf-logout-text">Sign out of your account on this device.</p>
          <button className="pf-btn-danger" onClick={handleLogout}>
            <span className="material-symbols-outlined" style={{fontSize:18}}>logout</span>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
