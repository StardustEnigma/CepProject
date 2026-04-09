import React, { useEffect, useState } from "react";

const parseResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

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
        const data = await fetch(`/students/${studentId}`).then(parseResponse);
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
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {student.attendance.map((entry) => (
                <tr key={entry.date}>
                  <td>{entry.date}</td>
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