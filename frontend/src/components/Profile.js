import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/Profile.css';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [profilePic, setProfilePic] = useState(user?.profilePic || '');

  useEffect(() => {
    setProfilePic(user?.profilePic || '');
  }, [user?.profilePic]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleUrlChange = (e) => {
    setProfilePic(e.target.value.trim());
    setMessage({ type: '', text: '' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please choose an image file (e.g. JPG, PNG)' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePic(reader.result);
      setMessage({ type: '', text: '' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setSaving(true);
    const result = await updateProfile({ profilePic });
    setSaving(false);
    if (result.success) {
      setMessage({ type: 'success', text: 'Profile picture updated' });
    } else {
      setMessage({ type: 'error', text: result.error });
    }
  };

  const clearPicture = () => {
    setProfilePic('');
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2 className="profile-title">My Profile</h2>
        <p className="profile-subtitle">Update your profile picture.</p>

        {message.text && (
          <div className={`profile-message ${message.type}`}>{message.text}</div>
        )}

        <div className="profile-preview">
          <div className="profile-avatar-large">
            {profilePic ? (
              <img src={profilePic} alt="Profile" />
            ) : (
              <span>{getInitials(user?.name)}</span>
            )}
          </div>
          <div className="profile-name">{user?.name}</div>
          <div className="profile-email">{user?.email}</div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          {/* <div className="form-group">
            <label htmlFor="profile-pic-url">Profile picture URL</label>
            <input
              id="profile-pic-url"
              type="url"
              value={profilePic}
              onChange={handleUrlChange}
              placeholder="https://example.com/your-photo.jpg"
              className="profile-input"
            />
          </div> */}
          <div className="form-group">
            <label className="profile-upload-label">
              <span className="profile-upload-btn">Or choose an image file</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="profile-file-input"
              />
            </label>
          </div>
          <div className="profile-actions">
            <button
              type="button"
              className="profile-btn secondary"
              onClick={clearPicture}
              disabled={saving}
            >
              Clear
            </button>
            <button
              type="submit"
              className="profile-btn primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save profile picture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
