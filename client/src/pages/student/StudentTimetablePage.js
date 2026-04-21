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
        if (!studentId) {
          throw new Error("Student session not found. Please log in again.");
        }

        const student = await apiFetch(`/students/${studentId}`);
        const data = await apiFetch("/timetable");

        const enrolledSubjects = student.subjects || [];
        setTimetable(data.filter(entry => entry.batch === student.batch && enrolledSubjects.includes(entry.subject)));
      } catch (requestError) {
        setError(requestError.message || "Unable to load timetable.");
      } finally {
        setIsLoading(false);
      }
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
          <p className="muted">No timetable available right now.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem' }}>
            {dayOptions.map(day => {
              const dayEntries = timetable.filter(e => e.day === day);
              if (dayEntries.length === 0) return null;

              return (
                <div key={day} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ margin: 0, paddingBottom: '0.5rem', borderBottom: '2px solid #e0e0e0', color: '#b35a22' }}>
                    {day}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                    {dayEntries.map(entry => (
                      <div 
                        key={entry.id} 
                        style={{
                          background: entry.isExtraClass ? 'linear-gradient(135deg, #fffdf2, #fbf2cd)' : 'white',
                          borderRadius: '12px',
                          padding: '1.25rem',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1)',
                          border: entry.isExtraClass ? '1px solid #ffeeba' : '1px solid #f0f0f0',
                          position: 'relative',
                          transition: 'transform 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.4rem'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div style={{ color: '#888', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          {entry.startTime} - {entry.endTime}
                        </div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#333' }}>
                          {entry.subject}
                        </div>
                        <div style={{ color: '#555', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                          {entry.teacher}
                        </div>
                        {entry.isExtraClass && (
                          <div style={{ color: '#856404', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '0.5rem', background: '#ffeeba', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', alignSelf: 'flex-start' }}>
                            ✨ Extra Class
                          </div>
                        )}
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