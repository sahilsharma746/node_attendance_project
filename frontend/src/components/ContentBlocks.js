import React from 'react';
import '../css/ContentBlocks.css';

const ContentBlocks = () => {
  return (
    <div className="content-blocks">
      <div className="content-column">
        <div className="content-block">
          <div className="block-header">
            <h3>Today's Status</h3>
          </div>
          <div className="block-content">
            <div className="status-display">
              <div className="status-icon-large">
               <img src="/images/wall-clock.png" alt="Not Checked In" />
              </div>
              <div className="status-text">
                <div className="status-title">Not Checked In</div>
                <div className="status-subtitle">Check In Time</div>
              </div>
            </div>
          </div>
        </div>

        <div className="content-block">
          <div className="block-header">
            <h3>
              <img src="/images/updated.png" alt="Latest Updates" className="block-header-icon" />
              Latest Updates
            </h3>
          </div>
          <div className="block-content">
            <div className="empty-state">
              <p>No updates available</p>
            </div>
          </div>
        </div>

        <div className="content-block">
          <div className="block-header">
            <h3>
              <img src="/images/clock.png" alt="Employees on Break" className="block-header-icon" />
              Employees on Break
            </h3>
          </div>
          <div className="block-content">
            <div className="empty-state">
              <p>No employees currently on break</p>
            </div>
          </div>
        </div>
      </div>

      <div className="content-column">
        <div className="content-block">
          <div className="block-header">
            <h3>
             <img src="/images/holiday.png" alt="Upcoming Holidays" className="block-header-icon" />
              Upcoming Holidays
            </h3>
          </div>
          <div className="block-content">
            <div className="empty-state">
              <p>No upcoming holidays</p>
            </div>
          </div>
        </div>

        <div className="content-block">
          <div className="block-header">
            <h3>
              <img src="/images/employee.png" alt="Employees in Office" className="block-header-icon" />
              Employees in Office
            </h3>
          </div>
          <div className="block-content">
            <div className="empty-state">
              <p>No employees currently in office</p>
            </div>
          </div>
        </div>

        <div className="content-block">
          <div className="block-header">
            <h3>
              <img src="/images/team.png" alt="Team Members on Leave" className="block-header-icon" />
              Team Members on Leave
            </h3>
          </div>
          <div className="block-content">
            <div className="empty-state">
              <p>No team members on leave today</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentBlocks;
