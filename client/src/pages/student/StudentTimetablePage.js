import React, { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";

// Removed manual parseResponse as apiFetch handles it.

const StudentTimetablePage = () => {
  const [timetable, setTimetable] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTimetable = async () => {
      try {
        const studentId = localStorage.getItem("studentId");
        if (!studentId) throw new Error("Student session not found. Please log in again.");
        const student = await apiFetch(`/students/${studentId}`);
        const data = await apiFetch("/timetable");
        const enrolledSubjects = student.subjects || [];
        setTimetable(data.filter(entry => entry.batch === student.batch && enrolledSubjects.includes(entry.subject)));
      } catch (e) { setError(e.message || "Unable to load timetable."); }
      finally { setIsLoading(false); }
    };
    loadTimetable();
  }, []);

  const dayOptions = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="admin-page">
      <h2>Class Timetable</h2>
      {error ? <p className="alert alert-error">{error}</p> : null}

      {isLoading ? (
        <p className="loading-text">Loading timetable...</p>
      ) : timetable.length === 0 ? (
        <div className="empty-state">
          <p className="muted">No timetable available right now.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', marginTop: '0.5rem' }}>
          {dayOptions.map(day => {
            const dayEntries = timetable.filter(e => e.day === day);
            if (dayEntries.length === 0) return null;
            return (
              <div key={day} className="day-section">
                <h3 className="day-header">{day}</h3>
                <div className="timetable-grid">
                  {dayEntries.map(entry => (
                    <div key={entry.id} className={`tt-card ${entry.isExtraClass ? 'extra' : ''}`}>
                      <div className="tt-card-time">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        {entry.startTime} – {entry.endTime}
                      </div>
                      <div className="tt-card-subject">{entry.subject}</div>
                      <div className="tt-card-teacher">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        {entry.teacher || "—"}
                      </div>
                      {entry.isExtraClass && (<div className="tt-card-badge">Extra Class</div>)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentTimetablePage;