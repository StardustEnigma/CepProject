import React, { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";

// Removed manual parseResponse as apiFetch handles it.

const StudentNoticesPage = () => {
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNotices = async () => {
      try {
        const studentId = localStorage.getItem("studentId");
        if (!studentId) throw new Error("Student session not found");

        const student = await apiFetch(`/students/${studentId}`);
        const data = await apiFetch(`/notices?batch=${encodeURIComponent(student.batch)}`);
        
        setNotices(data);
      } catch (requestError) {
        setError(requestError.message || "Unable to load notices.");
      } finally {
        setIsLoading(false);
      }
    };

    loadNotices();
  }, []);

  return (
    <div className="admin-page">
      <h2>Notices</h2>
      {error ? <p className="alert alert-error">{error}</p> : null}

      {isLoading ? (
        <p className="loading-text">Loading notices...</p>
      ) : notices.length === 0 ? (
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
    </div>
  );
};

export default StudentNoticesPage;