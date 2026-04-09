import React, { useEffect, useMemo, useState } from "react";

const today = new Date().toISOString().slice(0, 10);

const parseResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

const AdminAttendancePage = () => {
  const [students, setStudents] = useState([]);
  const [batchFilter, setBatchFilter] = useState("10th class");
  const [attendanceDate, setAttendanceDate] = useState(today);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadStudents = async () => {
    const data = await fetch("/students").then(parseResponse);
    setStudents(data);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        await loadStudents();
      } catch (requestError) {
        setError(requestError.message || "Unable to load attendance page.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter(student => student.batch === batchFilter);
  }, [students, batchFilter]);

  const attendanceSummary = useMemo(
    () =>
      filteredStudents.map((student) => {
        const presentCount = student.attendance.filter((entry) => entry.present).length;
        const currentEntry = student.attendance.find((entry) => entry.date === attendanceDate);
        return {
          id: student.id,
          name: student.name,
          presentCount,
          totalCount: student.attendance.length,
          statusToday: currentEntry ? (currentEntry.present ? "Present" : "Absent") : "Not Marked"
        };
      }),
    [filteredStudents, attendanceDate]
  );

  const handleMarkAttendance = async (studentId, present) => {
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          studentId: Number(studentId),
          date: attendanceDate,
          present: present
        })
      });

      await parseResponse(response);
      await loadStudents();
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
        <select
          className="input"
          value={batchFilter}
          onChange={(event) => setBatchFilter(event.target.value)}
        >
          <option value="8th class">8th class</option>
          <option value="9th class">9th class</option>
          <option value="10th class">10th class</option>
          <option value="11th class">11th class</option>
          <option value="12th class">12th class</option>
        </select>
        <input
          className="input"
          type="date"
          value={attendanceDate}
          onChange={(event) => setAttendanceDate(event.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="loading-text">Loading attendance summary...</p>
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