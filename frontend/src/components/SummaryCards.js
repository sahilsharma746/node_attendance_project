import React from 'react';
import '../css/SummaryCards.css';

const SummaryCards = () => {
  return (
    <div className="summary-cards">
      <div className="summary-card">
        <div className="card-icon">
        <img src="/images/calendar.png" alt="Days Present" />
        </div>
        <div className="card-content">
          <div className="card-label">Days Present</div>
          <div className="card-value">0</div>
          <div className="card-change green">+2 this week</div>
        </div>
      </div>

      <div className="summary-card">
        <div className="card-icon">
         <img src="/images/wall-clock.png" alt="Late Arrivals" />
        </div>
        <div className="card-content">
          <div className="card-label">Late Arrivals</div>
          <div className="card-value">0</div>
          <div className="card-change orange">Needs attention</div>
        </div>
      </div>

      <div className="summary-card">
        <div className="card-icon">
         <img src="/images/leave.png" alt="Leave Balance" />
        </div>
        <div className="card-content">
          <div className="card-label">Leave Balance</div>
          <div className="card-value">24</div>
        </div>
      </div>

      <div className="summary-card">
        <div className="card-icon">
         <img src="/images/warning.png" alt="Pending Requests" />
        </div>
        <div className="card-content">
          <div className="card-label">Pending Requests</div>
          <div className="card-value">0</div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
