import React from 'react';
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';
import '../css/TopNav.css';

const TopNav = () => {
  const { user } = useAuth();

  return (
    <header className="topnav">
      <div className="topnav-right">
        <button className="topnav-icon-btn" title="Notifications">
          <span className="material-symbols-outlined">notifications</span>
          <span className="topnav-notification-dot"></span>
        </button>
        <button className="topnav-icon-btn" title="Help">
          <span className="material-symbols-outlined">help</span>
        </button>
        <div className="topnav-separator"></div>
        <NavLink to="/dashboard/profile" className="topnav-user">
          <div className="topnav-avatar">
            {user?.profilePic ? (
              <img src={user.profilePic} alt="" />
            ) : (
              <span className="topnav-avatar-initials">
                {(user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            )}
          </div>
          <span className="topnav-username">{user?.name?.split(' ')[0] || 'User'}</span>
          <span className="material-symbols-outlined topnav-chevron">expand_more</span>
        </NavLink>
      </div>
    </header>
  );
};

export default TopNav;
