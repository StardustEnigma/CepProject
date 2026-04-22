import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../utils/api";

// Removed manual parseResponse as apiFetch handles it.

const StudentHomePage = () => {
  const studentId = localStorage.getItem("studentId");
  const [student, setStudent] = useState(null);
  const [latestNotices, setLatestNotices] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStudent = async () => {
      if (!studentId) { setError("Session expired. Please login again."); setIsLoading(false); return; }
      try {
        const studentData = await apiFetch(`/students/${studentId}`);
        setStudent(studentData);
        const noticesData = await apiFetch(`/notices?batch=${encodeURIComponent(studentData.batch)}`);
        setLatestNotices(noticesData.slice(0, 2));
      } catch (e) { setError(e.message || "Unable to load student profile."); }
      finally { setIsLoading(false); }
    };
    loadStudent();
  }, [studentId]);

  const presentDays = student ? student.attendance.filter(a => a.present).length : 0;
  const totalDays = student ? student.attendance.length : 0;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const cards = [
    { title: "Attendance", description: "Check your daily attendance records.", to: "/student/attendance" },
    { title: "Notices", description: "Read latest announcements from the center.", to: "/student/notices" },
    { title: "Timetable", description: "View your weekly class schedule.", to: "/student/timetable" },
    { title: "Tests", description: "Check upcoming tests and results.", to: "/student/tests" },
    { title: "Fees", description: "See fees structure and payment history.", to: "/student/fees" }
  ];

  return (
    <div className="admin-page">
      <h2>Student Overview</h2>

      {error ? <p className="alert alert-error">{error}</p> : null}

      {isLoading ? (
        <p className="loading-text">Loading profile...</p>
      ) : student ? (
        <div className="quick-grid stagger">
          <article className="stat-card" style={{ background: 'linear-gradient(135deg, #fff5eb, #ffe8d4)', borderColor: '#ffd0a0' }}>
            <h3 style={{ color: '#c44a00' }}>Student</h3>
            <p className="stat-value" style={{ color: '#9c3700', fontSize: '1.3rem' }}>{student.name}</p>
            <p className="stat-detail" style={{ color: '#c44a00' }}>Batch: {student.batch}</p>
            <p style={{ fontSize: '0.75rem', color: '#c44a00', marginTop: '2px' }}>Subjects: {student.subjects?.join(", ")}</p>
          </article>
          <article className="stat-card" style={{ background: 'linear-gradient(135deg, #edf8ef, #d4edda)', borderColor: '#a3d9b1' }}>
            <h3 style={{ color: '#1a7a2e' }}>Attendance</h3>
            <p className="stat-value" style={{ color: '#145a22' }}>{attendanceRate}%</p>
            <p className="stat-detail" style={{ color: '#1a7a2e' }}>{presentDays}/{totalDays} days present</p>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${attendanceRate}%`, background: 'linear-gradient(90deg, #1a7a2e, #2d9e42)' }} />
            </div>
          </article>
          <article className="stat-card" style={{ background: 'linear-gradient(135deg, #fef0f0, #fddede)', borderColor: '#f5b3b3' }}>
            <h3 style={{ color: '#c42020' }}>Fees Pending</h3>
            <p className="stat-value" style={{ color: '#991a1a' }}>{(student.feesPending ?? 0).toLocaleString()}</p>
            <p className="stat-detail" style={{ color: '#c42020' }}>Total: {(student.feesTotal ?? 0).toLocaleString()}</p>
          </article>
        </div>
      ) : null}

      {latestNotices.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Recent Announcements</h3>
          <div className="notice-list" style={{ marginTop: '0.5rem' }}>
            {latestNotices.map((notice) => (
              <article key={notice.id} className="notice-item">
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem' }}>{notice.title}</h3>
                  <p style={{ marginTop: '4px', fontSize: '0.88rem' }}>{notice.content}</p>
                </div>
                <span>{notice.createdAt}</span>
              </article>
            ))}
          </div>
        </div>
      )}

      <h3 style={{ marginTop: '1rem' }}>Quick Access</h3>
      <div className="quick-grid stagger">
        {cards.map((card) => (
          <article key={card.to} className="quick-card">
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            <Link className="button" to={card.to}>Open</Link>
          </article>
        ))}
      </div>
    </div>
  );
};

export default StudentHomePage;