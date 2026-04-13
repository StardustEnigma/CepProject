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
      if (!studentId) {
        setError("Session expired. Please login again.");
        setIsLoading(false);
        return;
      }

      try {
        const studentData = await apiFetch(`/students/${studentId}`);
        setStudent(studentData);
        
        const noticesData = await apiFetch("/notices");
        // Only show the 2 most recent notices
        setLatestNotices(noticesData.slice(0, 2));
      } catch (requestError) {
        setError(requestError.message || "Unable to load student profile.");
      } finally {
        setIsLoading(false);
      }
    };

    loadStudent();
  }, [studentId]);

  const presentDays = student
    ? student.attendance.filter(a => a.present).length
    : 0;
  const totalDays = student ? student.attendance.length : 0;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const cards = [
    {
      title: "Attendance",
      description: "Check your daily attendance records.",
      to: "/student/attendance"
    },
    {
      title: "Notices",
      description: "Read latest announcements from the center.",
      to: "/student/notices"
    },
    {
      title: "Timetable",
      description: "View your weekly class schedule.",
      to: "/student/timetable"
    },
    {
      title: "Tests",
      description: "Check upcoming tests and results.",
      to: "/student/tests"
    },
    {
      title: "Fees",
      description: "See fees structure and payment history.",
      to: "/student/fees"
    }
  ];

  return (
    <div className="admin-page">
      <h2>Student Overview</h2>

      {error ? <p className="alert alert-error">{error}</p> : null}

      {isLoading ? (
        <p className="loading-text">Loading profile...</p>
      ) : student ? (
        <div className="quick-grid">
          <article className="stat-card" style={{ background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)', borderColor: '#ffcc80' }}>
            <h3 style={{ color: '#e65100' }}>Student</h3>
            <p className="stat-value" style={{ color: '#bf360c', fontSize: '1.35rem' }}>{student.name}</p>
            <p style={{ fontSize: '0.85rem', color: '#e65100' }}>Batch: {student.batch}</p>
            <p style={{ fontSize: '0.75rem', color: '#e65100', marginTop: '4px' }}>Subjects: {student.subjects?.join(", ")}</p>
          </article>
          <article className="stat-card" style={{ background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', borderColor: '#a5d6a7' }}>
            <h3 style={{ color: '#2e7d32' }}>Attendance</h3>
            <p className="stat-value" style={{ color: '#1b5e20' }}>{attendanceRate}%</p>
            <p style={{ fontSize: '0.85rem', color: '#2e7d32' }}>{presentDays}/{totalDays} days present</p>
          </article>
          <article className="stat-card" style={{ background: 'linear-gradient(135deg, #ffebee, #ffcdd2)', borderColor: '#ef9a9a' }}>
            <h3 style={{ color: '#c62828' }}>Fees Pending</h3>
            <p className="stat-value" style={{ color: '#b71c1c' }}>₹{(student.feesPending ?? 0).toLocaleString()}</p>
            <p style={{ fontSize: '0.85rem', color: '#c62828' }}>Total: ₹{(student.feesTotal ?? 0).toLocaleString()}</p>
          </article>
        </div>
      ) : null}

      {latestNotices.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3>Recent Announcements</h3>
          <div className="notice-list" style={{ marginTop: '0.75rem' }}>
            {latestNotices.map((notice) => (
              <article key={notice.id} className="notice-item" style={{ borderLeft: '4px solid var(--primary)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--primary-strong)' }}>{notice.title}</h3>
                  <p style={{ marginTop: '4px', fontSize: '0.9rem' }}>{notice.content}</p>
                </div>
                <span>{notice.createdAt}</span>
              </article>
            ))}
          </div>
        </div>
      )}

      <h3 style={{ marginTop: '1.5rem' }}>Quick Access</h3>
      <div className="quick-grid">
        {cards.map((card) => (
          <article key={card.to} className="quick-card">
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            <Link className="button" to={card.to}>
              Open →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
};

export default StudentHomePage;