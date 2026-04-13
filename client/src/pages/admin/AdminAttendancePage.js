import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../utils/api";

const today = new Date().toISOString().slice(0, 10);

// Removed manual parseResponse as apiFetch handles it.

const AdminAttendancePage = () => {
  const [students, setStudents] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(today);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    const [studentsData, timetableData] = await Promise.all([
      apiFetch("/students"),
      apiFetch("/timetable")
    ]);
    setStudents(studentsData);
    setTimetable(timetableData);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        await loadData();
      } catch (requestError) {
        setError(requestError.message || "Unable to load attendance page.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const dayName = useMemo(() => {
    if (!attendanceDate) return "";
    const dateObj = new Date(attendanceDate);
    return isNaN(dateObj.getTime()) ? "" : dateObj.toLocaleDateString("en-US", { weekday: "long" });
  }, [attendanceDate]);

  const availableSlots = useMemo(() => {
    return timetable.filter(t => t.day === dayName);
  }, [timetable, dayName]);

  const selectedSlot = useMemo(() => {
    return availableSlots.find(s => s.id === Number(selectedSlotId));
  }, [availableSlots, selectedSlotId]);

  const filteredStudents = useMemo(() => {
    if (!selectedSlot) return [];
    return students.filter(s => s.batch === selectedSlot.batch && (s.subjects || []).includes(selectedSlot.subject));
  }, [students, selectedSlot]);

  const attendanceSummary = useMemo(
    () =>
      filteredStudents.map((student) => {
        const subjectName = selectedSlot?.subject || "General";
        const currentEntry = student.attendance.find((entry) => entry.date === attendanceDate && entry.subject === subjectName);
        const presentCount = student.attendance.filter((entry) => entry.present).length;
        
        return {
          id: student.id,
          name: student.name,
          presentCount,
          totalCount: student.attendance.length,
          statusToday: currentEntry ? (currentEntry.present ? "Present" : "Absent") : "Not Marked"
        };
      }),
    [filteredStudents, attendanceDate, selectedSlot]
  );

  const handleMarkAttendance = async (studentId, present) => {
    setError("");
    setSuccess("");

    try {
      await apiFetch("/attendance", {
        method: "POST",
        body: JSON.stringify({
          studentId: Number(studentId),
          date: attendanceDate,
          timetableId: selectedSlotId,
          present: present
        })
      });

      await loadData();
      setSuccess("Attendance marked successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to mark attendance.");
    }
  };

  return (
    <div className="admin-page">
      <h2>Attendance</h2>

      {error ? <p className="alert alert-error">{error}</p> : null}
      {success ? <p className="alert alert-success">{success}</p> : null}

      <div className="form-grid" style={{ marginBottom: "20px" }}>
        <input
          className="input"
          type="date"
          value={attendanceDate}
          onChange={(event) => {
            setAttendanceDate(event.target.value);
            setSelectedSlotId("");
          }}
        />
        <select
          className="input"
          value={selectedSlotId}
          onChange={(event) => setSelectedSlotId(event.target.value)}
        >
          <option value="">-- Select Timetable Slot ({dayName}) --</option>
          {availableSlots.map(slot => (
            <option key={slot.id} value={slot.id}>
              {slot.batch} - {slot.subject} ({slot.startTime}-{slot.endTime})
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="loading-text">Loading attendance summary...</p>
      ) : !selectedSlotId ? (
        <p className="muted">Please select a date and time slot to mark attendance.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Status Today</th>
                <th>Present Days</th>
                <th>Total Marked</th>
                <th>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendanceSummary.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>
                    <span className={row.statusToday === "Present" ? "text-success" : row.statusToday === "Absent" ? "text-danger" : ""}>
                      {row.statusToday}
                    </span>
                  </td>
                  <td>{row.presentCount}</td>
                  <td>{row.totalCount}</td>
                  <td>
                    <button
                      className="button button-success"
                      style={{ backgroundColor: '#28a745', color: '#fff', marginRight: '6px', marginBottom: '4px' }}
                      onClick={() => handleMarkAttendance(row.id, true)}
                    >
                      Present
                    </button>
                    <button
                      className="button button-danger"
                      onClick={() => handleMarkAttendance(row.id, false)}
                    >
                      Absent
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

export default AdminAttendancePage;