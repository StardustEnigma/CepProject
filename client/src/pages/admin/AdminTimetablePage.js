import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../utils/api";

const dayOptions = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

const batchOptions = ["8th class", "9th class", "10th class", "11th class", "12th class"];
const batchSubjectsMap = {
  "8th class": ["Maths", "Science", "English", "SST"],
  "9th class": ["Physics", "Chemistry", "Biology", "Maths"],
  "10th class": ["Physics", "Chemistry", "Biology", "Maths"],
  "11th class": ["Physics", "Chemistry", "Biology", "Maths"],
  "12th class": ["Physics", "Chemistry", "Biology", "Maths"]
};

// Removed manual parseResponse as apiFetch handles it.

const AdminTimetablePage = () => {
  const [timetable, setTimetable] = useState([]);
  const [batchFilter, setBatchFilter] = useState("10th class");
  const [timetableForm, setTimetableForm] = useState({
    day: "Monday",
    startTime: "16:00",
    endTime: "17:00",
    subject: batchSubjectsMap["10th class"][0],
    teacher: "",
    isExtraClass: false
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadTimetable = async () => {
    const data = await apiFetch("/timetable");
    setTimetable(data);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        await loadTimetable();
      } catch (requestError) {
        setError(requestError.message || "Unable to load timetable.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleAddTimetable = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      await apiFetch("/timetable", {
        method: "POST",
        body: JSON.stringify({ ...timetableForm, batch: batchFilter })
      });
      setTimetableForm((prev) => ({ ...prev, subject: "", teacher: "", isExtraClass: false }));
      await loadTimetable();
      setSuccess("Timetable entry added successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to add timetable entry.");
    }
  };

  const handleDeleteTimetable = async (entryId) => {
    setError("");
    setSuccess("");
    if (!window.confirm("Delete this timetable entry?")) return;

    try {
      await apiFetch(`/timetable/${entryId}`, { method: "DELETE" });
      await loadTimetable();
      setSuccess("Timetable entry deleted successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to delete timetable entry.");
    }
  };

  const filteredTimetable = useMemo(() => {
    return timetable.filter(entry => entry.batch === batchFilter);
  }, [timetable, batchFilter]);

  return (
    <div className="admin-page">
      <h2>Timetable</h2>

      {error ? <p className="alert alert-error">{error}</p> : null}
      {success ? <p className="alert alert-success">{success}</p> : null}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <label style={{ margin: 0, whiteSpace: 'nowrap' }}>Select Batch:</label>
        <select
          className="input"
          value={batchFilter}
          style={{ maxWidth: '220px' }}
          onChange={(event) => {
            const newBatch = event.target.value;
            setBatchFilter(newBatch);
            setTimetableForm(prev => ({
              ...prev,
              subject: batchSubjectsMap[newBatch] ? batchSubjectsMap[newBatch][0] : ""
            }));
          }}
        >
          {batchOptions.map(batch => (
            <option key={batch} value={batch}>{batch}</option>
          ))}
        </select>
      </div>

      <form className="form-grid" onSubmit={handleAddTimetable} style={{ alignItems: 'center' }}>
        <select className="input" value={timetableForm.day} onChange={(e) => setTimetableForm((prev) => ({ ...prev, day: e.target.value }))}>
          {dayOptions.map((day) => (<option key={day} value={day}>{day}</option>))}
        </select>
        <input className="input" type="time" min="06:00" max="18:00" value={timetableForm.startTime} onChange={(e) => setTimetableForm((prev) => ({ ...prev, startTime: e.target.value }))} />
        <input className="input" type="time" min="07:00" max="19:00" value={timetableForm.endTime} onChange={(e) => setTimetableForm((prev) => ({ ...prev, endTime: e.target.value }))} />
        <select className="input" value={timetableForm.subject} onChange={(e) => setTimetableForm((prev) => ({ ...prev, subject: e.target.value }))}>
          {(batchSubjectsMap[batchFilter] || []).map(sub => (<option key={sub} value={sub}>{sub}</option>))}
        </select>
        <input className="input" placeholder="Teacher" value={timetableForm.teacher} onChange={(e) => setTimetableForm((prev) => ({ ...prev, teacher: e.target.value }))} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', margin: 0, textTransform: 'none', letterSpacing: 'normal', fontSize: '0.88rem' }}>
          <input type="checkbox" checked={timetableForm.isExtraClass} onChange={(e) => setTimetableForm((prev) => ({...prev, isExtraClass: e.target.checked}))} />
          Extra Class
        </label>
        <button className="button" type="submit">Add Slot</button>
      </form>

      {isLoading ? (
        <p className="loading-text">Loading timetable...</p>
      ) : filteredTimetable.length === 0 ? (
        <div className="empty-state">
          <p className="muted">No timetable entries added yet for this batch.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', marginTop: '1rem' }}>
          {dayOptions.map(day => {
            const dayEntries = filteredTimetable.filter(e => e.day === day);
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
                      {entry.isExtraClass && (
                        <div className="tt-card-badge">Extra Class</div>
                      )}
                      <button onClick={() => handleDeleteTimetable(entry.id)} className="tt-card-delete" aria-label="Delete Slot" title="Delete Slot">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
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

export default AdminTimetablePage;