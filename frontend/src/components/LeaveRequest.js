import React, { useState } from 'react';
import '../css/LeaveRequest.css';

const LeaveRequest = () => {
    return (
        <div className="leave-request-container">
          <div className="leave-request-header">
            <div className="header-left">
              <h1 className="leave-request-title">Leave Requests</h1>
              <p className="leave-request-subtitle">Track and manage your time off</p>
            </div>
            <button className="new-request-btn">New Request</button>
          </div>

          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-title">Total Balance</div>
              <div className="card-value">24</div>
              <div className="card-subtitle">Days remaining</div>
            </div>
            <div className="summary-card">
              <div className="card-title">Used This Year</div>
              <div className="card-value">0</div>
              <div className="card-subtitle">Days taken</div>
            </div>
            <div className="summary-card">
              <div className="card-title">Pending</div>
              <div className="card-value">0</div>
              <div className="card-subtitle">Requests awaiting approval</div>
            </div>
          </div>

          <div className="request-history-section">
            <div className="history-header">
              <img src="/images/calendar.png" alt="Calendar" className="history-icon-image" />
              <h2 className="history-title">Request History</h2>
            </div>
            <div className="history-content">
              <div className="empty-state">
                <div className="empty-state-title">No leave requests found</div>
                <div className="empty-state-subtitle">Create a new request to get started</div>
              </div>
            </div>
          </div>
        </div>
      );
  
};

export default LeaveRequest;