import React, { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";

// Removed manual parseResponse as apiFetch handles it.

const batchOptions = ["All", "8th class", "9th class", "10th class", "11th class", "12th class"];

const AdminNoticesPage = () => {
  const [notices, setNotices] = useState([]);
  const [noticeForm, setNoticeForm] = useState({ title: "", content: "", batch: "All" });
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
      setNoticeForm({ title: "", content: "", batch: "All" });
      await loadNotices();
      setSuccess("Notice posted successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to post notice.");
    }
  };

  const handleSendWhatsApp = async (noticeId) => {
    setError("");
    setSuccess("");

    if (!window.confirm("Broadcast this notice via WhatsApp to the selected batch?")) return;

    try {
      await apiFetch(`/notices/${noticeId}/whatsapp`, {
        method: "POST"
      });
      setSuccess("WhatsApp broadcast queued successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to send WhatsApp notice.");
    }
  };

  return (
    <div className="admin-page">
      <h2>Notices</h2>

      {error ? <p className="alert alert-error">{error}</p> : null}
      {success ? <p className="alert alert-success">{success}</p> : null}

      <div className="panel" style={{ marginTop: '0.5rem' }}>
        <h3>Create New Notice</h3>
        <form className="form-stack" onSubmit={handleNotice} style={{ marginTop: '0.75rem' }}>
          <div className="form-grid">
            <div>
              <label>Title</label>
              <input
                className="input"
                placeholder="Notice title"
                value={noticeForm.title}
                onChange={(event) =>
                  setNoticeForm((prev) => ({ ...prev, title: event.target.value }))
                }
                required
              />
            </div>
            <div>
              <label>Target Batch</label>
              <select
                className="input"
                value={noticeForm.batch}
                onChange={(event) =>
                  setNoticeForm((prev) => ({ ...prev, batch: event.target.value }))
                }
              >
                {batchOptions.map(b => (
                  <option key={b} value={b}>{b === "All" ? "All Students" : b}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label>Content</label>
            <textarea
              className="input textarea"
              placeholder="Write notice details..."
              value={noticeForm.content}
              onChange={(event) =>
                setNoticeForm((prev) => ({ ...prev, content: event.target.value }))
              }
              required
            />
          </div>
          <button className="button" type="submit">
            Publish Notice
          </button>
        </form>
      </div>

      {isLoading ? (
        <p className="loading-text">Loading notices...</p>
      ) : notices.length === 0 ? (
        <div className="empty-state">
          <p className="muted">No notices available.</p>
        </div>
      ) : (
        <div className="notice-list" style={{ marginTop: '0.5rem' }}>
          {notices.map((notice) => (
            <article className="notice-item" key={notice.id}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0 }}>{notice.title}</h3>
                  <span className="batch-badge">
                    {notice.batch === "All" ? "All Classes" : notice.batch}
                  </span>
                </div>
                <p style={{ marginTop: '0.4rem' }}>{notice.content}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', minWidth: '110px' }}>
                <span className="muted" style={{ fontSize: '0.78rem' }}>{notice.createdAt}</span>
                <button
                  className="button button-sm button-secondary"
                  onClick={() => handleSendWhatsApp(notice.id)}
                >
                  Send WhatsApp
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNoticesPage;