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

      <div className="form-grid" style={{ marginBottom: "20px" }}>
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
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Time</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTimetable.map((entry) => (
                <tr key={entry.id} style={{ backgroundColor: entry.isExtraClass ? '#fff3cd' : 'transparent' }}>
                  <td>{entry.day}</td>
                  <td>
                    {entry.startTime} - {entry.endTime}
                  </td>
                  <td>
                    {entry.subject} {entry.isExtraClass && <span style={{fontSize: '0.8em', color: '#856404', marginLeft: '5px', fontWeight: 'bold'}}>[Extra]</span>}
                  </td>
                  <td>{entry.teacher}</td>
                  <td>
                    <button
                      type="button"
                      className="button button-danger"
                      onClick={() => handleDeleteTimetable(entry.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminTimetablePage;