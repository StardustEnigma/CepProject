import React, { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";

// Removed manual parseResponse as apiFetch handles it.

const StudentAttendancePage = () => {
  const studentId = localStorage.getItem("studentId");
  const [student, setStudent] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAttendance = async () => {
      if (!studentId) {
        setError("Session expired. Please login again.");
        setIsLoading(false);
        return;
      }

      try {
        const data = await apiFetch(`/students/${studentId}`);
        setStudent(data);
      } catch (requestError) {
        setError(requestError.message || "Unable to load attendance.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAttendance();
  }, [studentId]);

  return (
    <div className="admin-page">
      <h2>Attendance History</h2>
      {error ? <p className="alert alert-error">{error}</p> : null}

      {isLoading ? (
        <p className="loading-text">Loading attendance...</p>
      ) : !student || student.attendance.length === 0 ? (
        <p className="muted">Attendance has not been marked yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {student.attendance.map((entry) => (
                <tr key={entry.date + entry.subject}>
                  <td>{entry.date}</td>
                  <td>{entry.subject || "General"}</td>
                  <td>
                    <span
                      className={entry.present ? "status-badge present" : "status-badge absent"}
                    >
                      {entry.present ? "Present" : "Absent"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentAttendancePage;