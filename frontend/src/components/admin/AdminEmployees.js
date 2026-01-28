import React from 'react';
import '../../css/admin/AdminEmployees.css';

const AdminEmployees = () => {
  return (
    <div className="admin-employees">
      <div className="employees-card">
        <div className="card-header-section">
          <h2 className="section-title">Employee Directory</h2>
          <button className="create-user-btn">Create User</button>
        </div>
        <div className="table-container">
          <table className="employees-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Leave Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                 
                </td>
                <td>
                  
                </td>
                <td></td>
                <td>
                  {/* <span className="status-badge active"> */}
                    {/* <span className="status-dot"></span> */}
                    
                  {/* </span> */} 
                </td>
              </tr>
              <tr>
                <td>
                  {/* <div className="employee-cell">
                    <div className="avatar">
                     
                    </div>
                    <div className="employee-name-info">
                      
                    </div>
                  </div> */}
                </td>
                <td>
               
                </td>
                <td></td>
                <td>
                  {/* <span className="status-badge active">
                    <span className="status-dot"></span>
                    ACTIVE
                  </span> */}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminEmployees;
