import React from 'react';
import '../css/Updates.css';



const Updates = () => {
    return (
        <div className="updates-container">
            <div className="updates-header">
                <h1 className="updates-title">Updates & Notifications</h1>
                <p className="updates-subtitle">Stay informed about the latest updates and announcements</p>
            </div>
            <div className="updates-card">
                <div className="updates-card-header">
                  <img src="/images/updated.png" alt="Updates" className="updates-card-header-icon" />
                    <h2 className="card-title">Latest Updates</h2>
                </div>
                <div className="updates-card-content">
                    <div className="empty-state">
                      <img src="/images/notification.png" alt="Updates" className="empty-state-icon" />
                        <div className="empty-state-title">No notifications available</div>
                        <div className="empty-state-subtitle">Check back later for updates</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Updates;