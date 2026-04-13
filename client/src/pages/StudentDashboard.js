import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const parseResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const studentId = localStorage.getItem("studentId");
  const [student, setStudent] = useState(null);
  const [notices, setNotices] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStudentData = async () => {
      if (!studentId) {
        setError("Session expired. Please login again.");
        setIsLoading(false);
        return;
      }

      try {
        setError("");

        const [studentData, noticesData, timetableData] = await Promise.all([
          fetch(`/students/${studentId}`).then(parseResponse),
          fetch("/notices").then(parseResponse),
          fetch("/timetable").then(parseResponse)
        ]);

        const safeSubjects = studentData.subjects || [];
        setStudent(studentData);
        setNotices(noticesData);
        
        // Filter timetable to only include entries for this student's batch and enrolled subjects
        const filteredTimetable = timetableData.filter(
          (entry) => entry.batch === studentData.batch && safeSubjects.includes(entry.subject)
        );
        setTimetable(filteredTimetable);
      } catch (requestError) {
        setError(requestError.message || "Unable to load dashboard.");
      } finally {
        setIsLoading(false);
      }
    };

    loadStudentData();
  }, [studentId]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  if (isLoading) {
    return (
      <main className="dashboard-shell">
        <p className="loading-text">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Student Panel</p>
          <h1>Welcome, {student?.name || localStorage.getItem("studentName")}</h1>
        </div>
        <button className="button button-secondary" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {error ? <p className="alert alert-error">{error}</p> : null}

      <section className="panel">
        <h2>Profile Overview</h2>
        <p>
          <strong>Name:</strong> {student?.name || "N/A"}
        </p>
        <p>
          <strong>Batch:</strong> {student?.batch || "N/A"}
        </p>
        <p>
          <strong>Enrolled Subjects:</strong> {student?.subjects?.length > 0 ? student.subjects.join(", ") : "None"}
        </p>
        <p>
          <strong>Fees Pending:</strong> ₹{student?.feesPending ?? 0}
        </p>
      </section>

      <section className="panel">
        <h2>Attendance History</h2>
        {!student || student.attendance.length === 0 ? (
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
      </section>

      <section className="panel">
        <h2>Notices</h2>
        {notices.length === 0 ? (
          <p className="muted">No notices available right now.</p>
        ) : (
          <div className="notice-list">
            {notices.map((notice) => (
              <article className="notice-item" key={notice.id}>
                <div>
                  <h3>{notice.title}</h3>
                  <p>{notice.content}</p>
                </div>
                <span>{notice.createdAt}</span>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Class Timetable</h2>
        {timetable.length === 0 ? (
          <p className="muted">No timetable available right now.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Subject</th>
                  <th>Teacher</th>
                </tr>
              </thead>
              <tbody>
                {timetable.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.day}</td>
                    <td>
                      {entry.startTime} - {entry.endTime}
                    </td>
                    <td>{entry.subject}</td>
                    <td>{entry.teacher}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
};

export default StudentDashboard;