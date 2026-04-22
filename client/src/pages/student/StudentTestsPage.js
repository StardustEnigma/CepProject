import React, { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";

const StudentTestsPage = () => {
  const [tests, setTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user.id) {
          const studentData = await apiFetch(`/students/${user.id}`);
          setTests(studentData.testResults || []);
        }
      } catch (err) { setError(err.message || "Failed to load tests."); }
      finally { setIsLoading(false); }
    };
    fetchTests();
  }, []);

  return (
    <div className="admin-page">
      <h2>My Test Results</h2>
      {error ? <p className="alert alert-error">{error}</p> : null}

      {isLoading ? (
        <p className="loading-text">Loading test results...</p>
      ) : tests.length === 0 ? (
        <div className="empty-state">
          <p className="muted">No test results available yet.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Subject</th><th>Date</th><th>Status</th><th>Marks Obtained</th><th>Total Marks</th><th>Percentage</th></tr></thead>
            <tbody>
              {tests.map(test => {
                const percentage = test.marks != null && !test.isAbsent && test.maxMarks > 0 ? Math.round((test.marks / test.maxMarks) * 100) : 0;
                return (
                  <tr key={test.id}>
                    <td style={{ fontWeight: 700 }}>{test.subject}</td>
                    <td>{test.date}</td>
                    <td>
                      {test.isAbsent ? (<span className="status-badge absent">Absent</span>)
                        : test.hasResult ? (<span className="status-badge present">Evaluated</span>)
                        : (<span className="muted">Pending</span>)}
                    </td>
                    <td style={{ fontWeight: 600 }}>{test.isAbsent ? "—" : (test.marks ?? "—")}</td>
                    <td>{test.maxMarks}</td>
                    <td>
                      {test.isAbsent ? "—" : (test.hasResult ? (
                        <span style={{ fontWeight: 700, color: percentage >= 70 ? '#1a7a2e' : percentage >= 40 ? '#b8860b' : '#c42020' }}>{percentage}%</span>
                      ) : "—")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentTestsPage;