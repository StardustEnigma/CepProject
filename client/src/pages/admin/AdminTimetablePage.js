import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../utils/api";

const dayOptions = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
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
        body: JSON.stringify({
          ...timetableForm,
          batch: batchFilter
        })
      });
      setTimetableForm((prev) => ({
        ...prev,
        subject: "",
        teacher: "",
        isExtraClass: false
      }));
      await loadTimetable();
      setSuccess("Timetable entry added successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to add timetable entry.");
    }
  };

  const handleDeleteTimetable = async (entryId) => {
    setError("");
    setSuccess("");
    const confirmed = window.confirm("Delete this timetable entry?");

    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/timetable/${entryId}`, {
        method: "DELETE"
      });
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

      <div style={{ marginBottom: "20px", maxWidth: "300px" }}>
        <select
          className="input"
          value={batchFilter}
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
        <select
          className="input"
          value={timetableForm.day}
          onChange={(event) =>
            setTimetableForm((prev) => ({ ...prev, day: event.target.value }))
          }
        >
          {dayOptions.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
        <input
          className="input"
          type="time"
          min="06:00"
          max="18:00"
          value={timetableForm.startTime}
          onChange={(event) =>
            setTimetableForm((prev) => ({ ...prev, startTime: event.target.value }))
          }
        />
        <input
          className="input"
          type="time"
          min="07:00"
          max="19:00"
          value={timetableForm.endTime}
          onChange={(event) =>
            setTimetableForm((prev) => ({ ...prev, endTime: event.target.value }))
          }
        />
        <select
          className="input"
          value={timetableForm.subject}
          onChange={(event) =>
            setTimetableForm((prev) => ({ ...prev, subject: event.target.value }))
          }
        >
          {(batchSubjectsMap[batchFilter] || []).map(sub => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>
        <input
          className="input"
          placeholder="Teacher"
          value={timetableForm.teacher}
          onChange={(event) =>
            setTimetableForm((prev) => ({ ...prev, teacher: event.target.value }))
          }
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input 
            type="checkbox"
            checked={timetableForm.isExtraClass}
            onChange={(event) => setTimetableForm((prev) => ({...prev, isExtraClass: event.target.checked}))}
          />
          Extra Class
        </label>
        <button className="button" type="submit">
          Add Slot
        </button>
      </form>

      {isLoading ? (
        <p className="loading-text">Loading timetable...</p>
      ) : filteredTimetable.length === 0 ? (
        <p className="muted">No timetable entries added yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem' }}>
          {dayOptions.map(day => {
            const dayEntries = filteredTimetable.filter(e => e.day === day);
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
                      
                      <button 
                        onClick={() => handleDeleteTimetable(entry.id)} 
                        style={{ 
                          position: 'absolute', top: '12px', right: '12px', 
                          background: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', 
                          borderRadius: '50%', width: '32px', height: '32px', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', padding: 0, transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#c62828'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#ffebee'; e.currentTarget.style.color = '#c62828'; }}
                        aria-label="Delete Slot"
                        title="Delete Slot"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
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