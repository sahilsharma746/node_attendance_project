import React from 'react';
import '../../css/admin/AdminHolidays.css';

const AdminHolidays = () => {
  return (
    <div className="admin-holidays">
      <div className="holidays-card">
        <div className="card-header-section">
          <h2 className="section-title">Holidays List</h2>
          <button className="add-holiday-btn">Add Holiday</button>
        </div>
        <div className="table-container">
          <table className="holidays-table">
            <thead>
              <tr>
                <th>Holiday Name</th>
                <th>Date</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="4" className="empty-table-cell">
                  No holidays added yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminHolidays;
