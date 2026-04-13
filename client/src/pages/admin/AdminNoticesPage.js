import React, { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";

// Removed manual parseResponse as apiFetch handles it.

const AdminNoticesPage = () => {
  const [notices, setNotices] = useState([]);
  const [noticeForm, setNoticeForm] = useState({ title: "", content: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadNotices = async () => {
    const data = await apiFetch("/notices");
    setNotices(data);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        await loadNotices();
      } catch (requestError) {
        setError(requestError.message || "Unable to load notices.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const handleNotice = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      await apiFetch("/notices", {
        method: "POST",
        body: JSON.stringify(noticeForm)
      });
      setNoticeForm({ title: "", content: "" });
      await loadNotices();
      setSuccess("Notice posted successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to post notice.");
    }
  };

  return (
    <div className="admin-page">
      <h2>Notices</h2>

      {error ? <p className="alert alert-error">{error}</p> : null}
      {success ? <p className="alert alert-success">{success}</p> : null}

      <form className="form-stack" onSubmit={handleNotice}>
        <input
          className="input"
          placeholder="Notice title"
          value={noticeForm.title}
          onChange={(event) =>
            setNoticeForm((prev) => ({ ...prev, title: event.target.value }))
          }
        />
        <textarea
          className="input textarea"
          placeholder="Write notice details"
          value={noticeForm.content}
          onChange={(event) =>
            setNoticeForm((prev) => ({ ...prev, content: event.target.value }))
          }
        />
        <button className="button" type="submit">
          Publish Notice
        </button>
      </form>

      {isLoading ? (
        <p className="loading-text">Loading notices...</p>
      ) : notices.length === 0 ? (
        <p className="muted">No notices available.</p>
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

export default AdminNoticesPage;