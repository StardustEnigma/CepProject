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

      <form className="form-stack" onSubmit={handleNotice}>
        <div className="form-grid">
          <input
            className="input"
            placeholder="Notice title"
            value={noticeForm.title}
            onChange={(event) =>
              setNoticeForm((prev) => ({ ...prev, title: event.target.value }))
            }
            required
          />
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
        <textarea
          className="input textarea"
          placeholder="Write notice details"
          value={noticeForm.content}
          onChange={(event) =>
            setNoticeForm((prev) => ({ ...prev, content: event.target.value }))
          }
          required
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
            <article className="notice-item" key={notice.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0 }}>{notice.title}</h3>
                  <span style={{ fontSize: '0.8rem', background: '#e0e0e0', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                    {notice.batch === "All" ? "All Classes" : notice.batch}
                  </span>
                </div>
                <p style={{ marginTop: '8px' }}>{notice.content}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', minWidth: '120px' }}>
                <span className="muted">{notice.createdAt}</span>
                <button 
                  className="button button-secondary" 
                  onClick={() => handleSendWhatsApp(notice.id)}
                  style={{ fontSize: '0.9rem', padding: '6px 12px' }}
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