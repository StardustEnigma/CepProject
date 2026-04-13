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

  return (
    <div className="admin-page">
      <h2>Class Timetable</h2>
      {error ? <p className="alert alert-error">{error}</p> : null}

      {isLoading ? (
        <p className="loading-text">Loading timetable...</p>
      ) : timetable.length === 0 ? (
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
                <tr key={entry.id} style={{ backgroundColor: entry.isExtraClass ? '#fff3cd' : 'transparent' }}>
                  <td>{entry.day}</td>
                  <td>
                    {entry.startTime} - {entry.endTime}
                  </td>
                  <td>
                    {entry.subject} {entry.isExtraClass && <span style={{fontSize: '0.8em', color: '#856404', marginLeft: '5px', fontWeight: 'bold'}}>[Extra Class]</span>}
                  </td>
                  <td>{entry.teacher}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentTimetablePage;