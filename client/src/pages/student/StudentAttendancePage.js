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
      if (!studentId) { setError("Session expired. Please login again."); setIsLoading(false); return; }
      try { const data = await apiFetch(`/students/${studentId}`); setStudent(data); }
      catch (e) { setError(e.message || "Unable to load attendance."); }
      finally { setIsLoading(false); }
    };
    loadAttendance();
  }, [studentId]);

  const presentCount = student ? student.attendance.filter(e => e.present).length : 0;
  const totalCount = student ? student.attendance.length : 0;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className="admin-page">
      <h2>Attendance History</h2>
      {error ? <p className="alert alert-error">{error}</p> : null}

      {isLoading ? (
        <p className="loading-text">Loading attendance...</p>
      ) : !student || student.attendance.length === 0 ? (
        <div className="empty-state">
          <p className="muted">Attendance has not been marked yet.</p>
        </div>
      ) : (
        <>
          <div className="quick-grid" style={{ marginBottom: '0.75rem' }}>
            <article className="stat-card" style={{ background: 'linear-gradient(135deg, #edf8ef, #d4edda)', borderColor: '#a3d9b1' }}>
              <h3 style={{ color: '#1a7a2e' }}>Overall Attendance</h3>
              <p className="stat-value" style={{ color: '#145a22' }}>{attendanceRate}%</p>
              <p className="stat-detail" style={{ color: '#1a7a2e' }}>{presentCount} present / {totalCount} total</p>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${attendanceRate}%`, background: 'linear-gradient(90deg, #1a7a2e, #2d9e42)' }} />
              </div>
            </article>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th>Subject</th><th>Status</th></tr></thead>
              <tbody>
                {[...student.attendance].reverse().map((entry) => (
                  <tr key={entry.date + entry.subject}>
                    <td>{entry.date}</td>
                    <td style={{ fontWeight: 600 }}>{entry.subject || "General"}</td>
                    <td><span className={entry.present ? "status-badge present" : "status-badge absent"}>{entry.present ? "Present" : "Absent"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentAttendancePage;