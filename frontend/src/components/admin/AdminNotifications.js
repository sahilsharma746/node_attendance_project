import React from 'react';
import '../../css/admin/AdminNotifications.css';

const AdminNotifications = () => {
  return (
    <div className="admin-notifications">
      <div className="notifications-card">
        <div className="card-header-section">
          <h2 className="section-title">System Notifications</h2>
          <button className="add-notification-btn">Add Notification</button>
        </div>
        <div className="table-container">
          <table className="notifications-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Message</th>
                <th>Type</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="7" className="empty-table-cell">
                  No notifications added yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;
