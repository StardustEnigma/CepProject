import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const today = new Date().toISOString().slice(0, 10);
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

const parseResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [studentForm, setStudentForm] = useState({
    name: "",
    password: "",
    batch: "8th class",
    subjects: ["Maths", "Science", "English", "SST"],
    feesTotal: 10000
  });
  const [attendanceForm, setAttendanceForm] = useState({
    studentId: "",
    date: today,
    timetableId: "",
    present: true
  });
  const [noticeForm, setNoticeForm] = useState({
    title: "",
    content: ""
  });
  const [timetableForm, setTimetableForm] = useState({
    day: "Monday",
    startTime: "09:00",
    endTime: "10:00",
    batch: "8th class",
    subject: batchSubjectsMap["8th class"][0],
    teacher: ""
  });

  const refreshData = async () => {
    const [studentsData, noticesData, timetableData] = await Promise.all([
      fetch("/students").then(parseResponse),
      fetch("/notices").then(parseResponse),
      fetch("/timetable").then(parseResponse)
    ]);

    setStudents(studentsData);
    setNotices(noticesData);
    setTimetable(timetableData);

    setAttendanceForm((prev) => ({
      ...prev,
      studentId:
        prev.studentId ||
        (studentsData.length > 0 ? String(studentsData[0].id) : "")
    }));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setError("");
        await refreshData();
      } catch (requestError) {
        setError(requestError.message || "Unable to load dashboard.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const studentSummaries = useMemo(
    () =>
      students.map((student) => {
        const presentCount = student.attendance.filter((entry) => entry.present).length;

        return {
          ...student,
          presentCount,
          totalAttendance: student.attendance.length
        };
      }),
    [students]
  );

  const clearFlashMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const handleAddStudent = async (event) => {
    event.preventDefault();
    clearFlashMessages();

    try {
      const response = await fetch("/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(studentForm)
      });

      await parseResponse(response);
      setStudentForm({ 
        name: "", 
        password: "", 
        batch: "8th class", 
        subjects: batchSubjectsMap["8th class"], 
        feesTotal: 10000 
      });
      await refreshData();
      setSuccess("Student added successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to add student.");
    }
  };

  const handleDeleteStudent = async (studentId) => {
    clearFlashMessages();
    const confirmed = window.confirm("Delete this student?");

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/students/${studentId}`, {
        method: "DELETE"
      });

      await parseResponse(response);
      await refreshData();
      setSuccess("Student deleted successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to delete student.");
    }
  };

  const handleAttendance = async (event) => {
    event.preventDefault();
    clearFlashMessages();

    try {
      const response = await fetch("/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          studentId: Number(attendanceForm.studentId),
          date: attendanceForm.date,
          timetableId: attendanceForm.timetableId,
          present: attendanceForm.present
        })
      });

      await parseResponse(response);
      await refreshData();
      setSuccess("Attendance marked successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to mark attendance.");
    }
  };

  const handleNotice = async (event) => {
    event.preventDefault();
    clearFlashMessages();

    try {
      const response = await fetch("/notices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(noticeForm)
      });

      await parseResponse(response);
      setNoticeForm({ title: "", content: "" });
      await refreshData();
      setSuccess("Notice posted successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to post notice.");
    }
  };

  const handleAddTimetable = async (event) => {
    event.preventDefault();
    clearFlashMessages();

    try {
      const response = await fetch("/timetable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(timetableForm)
      });

      await parseResponse(response);
      setTimetableForm((prev) => ({
        ...prev,
        subject: batchSubjectsMap[prev.batch][0],
        teacher: ""
      }));
      await refreshData();
      setSuccess("Timetable entry added successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to add timetable entry.");
    }
  };

  const handleDeleteTimetable = async (entryId) => {
    clearFlashMessages();
    const confirmed = window.confirm("Delete this timetable entry?");

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/timetable/${entryId}`, {
        method: "DELETE"
      });

      await parseResponse(response);
      await refreshData();
      setSuccess("Timetable entry deleted successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to delete timetable entry.");
    }
  };

  if (isLoading) {
    return (
      <main className="dashboard-shell">
        <p className="loading-text">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Admin Panel</p>
          <h1>Gurukul Academy Dashboard</h1>
        </div>
        <button className="button button-secondary" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {error ? <p className="alert alert-error">{error}</p> : null}
      {success ? <p className="alert alert-success">{success}</p> : null}

      <section className="panel">
        <h2>Add Student</h2>
        <form className="form-grid" onSubmit={handleAddStudent}>
          <input
            className="input"
            placeholder="Student Name"
            value={studentForm.name}
            onChange={(event) =>
              setStudentForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={studentForm.password}
            onChange={(event) =>
              setStudentForm((prev) => ({ ...prev, password: event.target.value }))
            }
          />
          <select
            className="input"
            value={studentForm.batch}
            onChange={(event) => {
              const newBatch = event.target.value;
              setStudentForm((prev) => ({
                ...prev,
                batch: newBatch,
                subjects: batchSubjectsMap[newBatch]
              }));
            }}
          >
            {batchOptions.map((batch) => (
              <option key={batch} value={batch}>
                {batch}
              </option>
            ))}
          </select>
          <input
            className="input"
            type="number"
            placeholder="Fees Total"
            value={studentForm.feesTotal}
            onChange={(event) =>
              setStudentForm((prev) => ({ ...prev, feesTotal: event.target.value }))
            }
          />
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <strong>Select Subjects:</strong>
            {batchSubjectsMap[studentForm.batch].map((sub) => (
              <label key={sub} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <input 
                  type="checkbox" 
                  checked={studentForm.subjects.includes(sub)}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setStudentForm((prev) => {
                      const newSubjects = isChecked 
                        ? [...prev.subjects, sub] 
                        : prev.subjects.filter((s) => s !== sub);
                      return { ...prev, subjects: newSubjects };
                    });
                  }}
                />
                {sub}
              </label>
            ))}
          </div>
          <button className="button" type="submit" style={{ gridColumn: "1 / -1" }}>
            Add Student
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Students</h2>
        {studentSummaries.length === 0 ? (
          <p className="muted">No students added yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Batch & Subjects</th>
                  <th>Attendance</th>
                  <th>Fees Pending</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {studentSummaries.map((student) => (
                  <tr key={student.id}>
                    <td>{student.id}</td>
                    <td>{student.name}</td>
                    <td>
                      <div><strong>{student.batch}</strong></div>
                      <div className="muted" style={{ fontSize: "0.85em" }}>{student.subjects?.join(", ")}</div>
                    </td>
                    <td>
                      {student.presentCount}/{student.totalAttendance} days present
                    </td>
                    <td>
                      <strong>₹{student.feesPending}</strong>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="button button-danger"
                        onClick={() => handleDeleteStudent(student.id)}
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
      </section>

      <section className="grid-2">
        <article className="panel">
          <h2>Mark Attendance</h2>
          <form className="form-stack" onSubmit={handleAttendance}>
            <label htmlFor="attendance-date">Date</label>
            <input
              id="attendance-date"
              className="input"
              type="date"
              value={attendanceForm.date}
              onChange={(event) =>
                setAttendanceForm((prev) => ({ ...prev, date: event.target.value, timetableId: "", studentId: "" }))
              }
            />

            {(() => {
              // Ensure invalid dates do not break String methods
              let dayName = "";
              if (attendanceForm.date) {
                const dateObj = new Date(attendanceForm.date);
                if (!isNaN(dateObj.getTime())) {
                  dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
                }
              }
              const daySlots = timetable.filter(t => t.day === dayName);

              return (
                <>
                  <label htmlFor="attendance-slot">Timetable Slot ({dayName || "Select Valid Date"})</label>
                  <select
                    id="attendance-slot"
                    className="input"
                    value={attendanceForm.timetableId}
                    onChange={(event) => {
                      setAttendanceForm((prev) => ({ ...prev, timetableId: event.target.value, studentId: "" }));
                    }}
                  >
                    <option value="">-- Select Slot --</option>
                    {daySlots.map(slot => (
                      <option key={slot.id} value={slot.id}>
                        {slot.batch} - {slot.subject} ({slot.startTime} to {slot.endTime})
                      </option>
                    ))}
                  </select>
                </>
              );
            })()}

            <label htmlFor="attendance-student">Student</label>
            <select
              id="attendance-student"
              className="input"
              value={attendanceForm.studentId}
              onChange={(event) =>
                setAttendanceForm((prev) => ({ ...prev, studentId: event.target.value }))
              }
              disabled={!attendanceForm.timetableId}
            >
              <option value="">-- Select Student --</option>
              {students
                .filter((student) => {
                  if (!attendanceForm.timetableId) return false;
                  const slot = timetable.find(t => t.id === Number(attendanceForm.timetableId));
                  if (!slot) return false;
                  return student.batch === slot.batch && (student.subjects || []).includes(slot.subject);
                })
                .map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
            </select>

            <label htmlFor="attendance-status">Status</label>
            <select
              id="attendance-status"
              className="input"
              value={attendanceForm.present ? "present" : "absent"}
              onChange={(event) =>
                setAttendanceForm((prev) => ({
                  ...prev,
                  present: event.target.value === "present"
                }))
              }
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>

            <button className="button" type="submit" disabled={!attendanceForm.studentId}>
              Save Attendance
            </button>
          </form>
        </article>

        <article className="panel">
          <h2>Post Notice</h2>
          <form className="form-stack" onSubmit={handleNotice}>
            <label htmlFor="notice-title">Title</label>
            <input
              id="notice-title"
              className="input"
              value={noticeForm.title}
              onChange={(event) =>
                setNoticeForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Notice title"
            />

            <label htmlFor="notice-content">Content</label>
            <textarea
              id="notice-content"
              className="input textarea"
              value={noticeForm.content}
              onChange={(event) =>
                setNoticeForm((prev) => ({ ...prev, content: event.target.value }))
              }
              placeholder="Write notice details"
            />

            <button className="button" type="submit">
              Publish Notice
            </button>
          </form>
        </article>
      </section>

      <section className="panel">
        <h2>Recent Notices</h2>
        {notices.length === 0 ? (
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
      </section>

      <section className="panel">
        <h2>Manage Timetable</h2>
        <form className="form-grid" onSubmit={handleAddTimetable}>
          <select
            className="input"
            value={timetableForm.batch}
            onChange={(event) => {
              const newBatch = event.target.value;
              setTimetableForm((prev) => ({ 
                ...prev, 
                batch: newBatch,
                subject: batchSubjectsMap[newBatch][0]
              }));
            }}
          >
            {batchOptions.map((batch) => (
              <option key={batch} value={batch}>
                {batch}
              </option>
            ))}
          </select>
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
            value={timetableForm.startTime}
            onChange={(event) =>
              setTimetableForm((prev) => ({ ...prev, startTime: event.target.value }))
            }
          />
          <input
            className="input"
            type="time"
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
            {batchSubjectsMap[timetableForm.batch].map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
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
          <button className="button" type="submit">
            Add Slot
          </button>
        </form>

        {timetable.length === 0 ? (
          <p className="muted">No timetable entries added yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {timetable.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.batch}</td>
                    <td>{entry.day}</td>
                    <td>
                      {entry.startTime} - {entry.endTime}
                    </td>
                    <td>{entry.subject}</td>
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
      </section>
    </main>
  );
};

export default AdminDashboard;