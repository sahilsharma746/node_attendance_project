import React from 'react';
import '../../css/admin/AdminLeaveRequests.css';

const AdminLeaveRequests = () => {
  return (
    <div className="admin-leave-requests">
      <div className="leave-card pending-card">
        <div className="card-header">
          <div className="card-icon pending-icon">
         <img src="/images/pending.png" alt="Pending Approvals"  className='card-icon-image'/>
          </div>
          <div className="card-title-section">
            <h3 className="card-title">Pending Approvals</h3>
            <p className="card-subtitle">Requires your attention</p>
          </div>
        </div>
        <div className="card-content">
          <div className="empty-state">
            <div className="empty-icon">
              <img src="/images/pending.png" alt="Pending Approvals"  className='empty-icon-image'/>
            </div>
            <p className="empty-text">All caught up! No pending requests</p>
          </div>
        </div>
      </div>

      <div className="leave-card approved-card">
        <div className="card-header">
          <div className="card-icon approved-icon">
            <img src="/images/mark.png" alt="Approved Leaves"  className='card-icon-image'/>
          </div>
          <div className="card-title-section">
            <h3 className="card-title">Approved Leaves</h3>
            <p className="card-subtitle">Successfully approved requests</p>
          </div>
        </div>
        <div className="card-content">
          <div className="empty-state">
            <div className="empty-icon">
              <img src="/images/document.png" alt="Approved Leaves"  className='empty-icon-image'/>
            </div>
            <p className="empty-text">No approved leaves yet</p>
          </div>
        </div>
      </div>

      <div className="leave-card rejected-card">
        <div className="card-header">
          <div className="card-icon rejected-icon">
            <img src="/images/rejected.png" alt="Rejected Leaves"  className='card-icon-image'/>
          </div>
          <div className="card-title-section">
            <h3 className="card-title">Rejected Leaves</h3>
            <p className="card-subtitle">Declined leave requests</p>
          </div>
        </div>
        <div className="card-content">
          <div className="empty-state">
            <div className="empty-icon">
              <img src="/images/document.png" alt="Rejected Leaves"  className='empty-icon-image'/>
             
            </div>
            <p className="empty-text">No rejected leaves</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLeaveRequests;
