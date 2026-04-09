import React from "react";

const StudentTestsPage = () => {
  return (
    <div className="admin-page">
      <h2>Tests</h2>
      <p className="alert alert-success">Test module will be started soon.</p>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Type</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Mathematics</td>
              <td>Weekly Practice</td>
              <td>Coming Soon</td>
              <td>Not Started</td>
            </tr>
            <tr>
              <td>Science</td>
              <td>Monthly Test</td>
              <td>Coming Soon</td>
              <td>Not Started</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentTestsPage;