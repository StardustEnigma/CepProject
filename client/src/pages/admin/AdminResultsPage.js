import React, { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";

const batchSubjectsMap = {
  "8th class": ["Maths", "Science", "English", "SST"],
  "9th class": ["Physics", "Chemistry", "Biology", "Maths"],
  "10th class": ["Physics", "Chemistry", "Biology", "Maths"],
  "11th class": ["Physics", "Chemistry", "Biology", "Maths"],
  "12th class": ["Physics", "Chemistry", "Biology", "Maths"]
};

const AdminResultsPage = () => {
  const [students, setStudents] = useState([]);
  const [tests, setTests] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  
  const [form, setForm] = useState({
    batch: "8th class",
    subject: "Maths",
    date: new Date().toISOString().slice(0, 10),
    maxMarks: 50
  });

  const [marksData, setMarksData] = useState({}); // { studentId: { marks, isAbsent } }
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const list = students.filter(s => s.batch === form.batch);
    setFilteredStudents(list);
    
    // reset marks data for missing students
    const newMarks = {};
    list.forEach(student => {
      newMarks[student.id] = { marks: "", isAbsent: false };
    });
    setMarksData(newMarks);
    
    if (!batchSubjectsMap[form.batch].includes(form.subject)) {
      setForm(prev => ({ ...prev, subject: batchSubjectsMap[form.batch][0] || "" }));
    }
  }, [form.batch, students]);

  const loadData = async () => {
    try {
      const studs = await apiFetch("/students");
      setStudents(studs);
      
      const t = await apiFetch("/tests");
      setTests(t);
    } catch (err) {
      setError(err.message || "Failed to load data.");
    }
  };

  const clearFlash = () => {
    setError("");
    setSuccess("");
  };

  const handleMarkChange = (studentId, field, value) => {
    setMarksData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearFlash();
    setIsSaving(true);
    
    try {
      // Build results array
      const results = filteredStudents.map(student => {
        const md = marksData[student.id] || { marks: 0, isAbsent: false };
        return {
          studentId: student.id,
          marks: Number(md.marks || 0),
          isAbsent: Boolean(md.isAbsent)
        };
      });

      // validation
      for (const r of results) {
        if (!r.isAbsent && (r.marks < 0 || r.marks > form.maxMarks)) {
          throw new Error(`Invalid marks. Must be between 0 and ${form.maxMarks}.`);
        }
      }

      // Save Test
      const testRes = await apiFetch("/tests", {
        method: "POST",
        body: JSON.stringify({ ...form, results, maxMarks: Number(form.maxMarks) })
      });
      
      const testId = testRes.test.id;

      // Broadcast WhatsApp
      await apiFetch(`/tests/${testId}/whatsapp`, {
        method: "POST"
      });

      setSuccess("Test results saved and WhatsApp broadcast queued!");
      loadData();
      
      // Reset form marks
      const newMarks = {};
      filteredStudents.forEach(student => {
        newMarks[student.id] = { marks: "", isAbsent: false };
      });
      setMarksData(newMarks);

    } catch (err) {
      setError(err.message || "An error occurred while saving the test.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm("Delete this test?")) return;
    try {
      await apiFetch(`/tests/${testId}`, { method: "DELETE" });
      setSuccess("Test deleted successfully.");
      loadData();
    } catch (err) {
      setError(err.message || "Cannot delete test.");
    }
  };

  const handleResendWhatsApp = async (testId) => {
    if (!window.confirm("Resend WhatsApp messages to all students in this test?")) return;
    try {
      await apiFetch(`/tests/${testId}/whatsapp`, { method: "POST" });
      setSuccess("WhatsApp broadcast queued successfully.");
    } catch (err) {
      setError(err.message || "Cannot send WhatsApp.");
    }
  };

  return (
    <div className="admin-page">
      <h2>Results & Marks</h2>
      {error && <p className="alert alert-error">{error}</p>}
      {success && <p className="alert alert-success">{success}</p>}

      <section className="panel" style={{ marginBottom: "2rem" }}>
        <h3>Add New Test Result</h3>
        <p className="muted" style={{ marginTop: 0 }}>Create a test for a batch and broadcast results on WhatsApp.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ marginBottom: "1rem" }}>
            <div>
              <label>Batch</label>
              <select className="input" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })}>
                {Object.keys(batchSubjectsMap).map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label>Subject</label>
              <select className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                {batchSubjectsMap[form.batch]?.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Date</label>
              <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>

            <div>
              <label>Max Marks</label>
              <input type="number" className="input" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} required min="1" />
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <p className="muted">No students in this batch.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Absent?</th>
                    <th>Marks Obtained</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={marksData[student.id]?.isAbsent || false}
                          onChange={(e) => handleMarkChange(student.id, "isAbsent", e.target.checked)}
                          style={{ transform: "scale(1.2)" }}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="input" 
                          placeholder="Marks"
                          value={marksData[student.id]?.marks}
                          onChange={(e) => handleMarkChange(student.id, "marks", e.target.value)}
                          disabled={marksData[student.id]?.isAbsent}
                          min="0"
                          max={form.maxMarks}
                          style={{ width: "100px" }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: "1rem" }}>
            <button type="submit" className="button button-primary" disabled={isSaving || filteredStudents.length === 0}>
              {isSaving ? "Saving..." : "Save Test & Send WhatsApp to Batch"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <h3>Past Tests</h3>
        {tests.length === 0 ? (
          <p className="muted">No tests added yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Max Marks</th>
                  <th>Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests.map(test => (
                  <tr key={test.id}>
                    <td>{test.batch}</td>
                    <td>{test.subject}</td>
                    <td>{test.date}</td>
                    <td>{test.maxMarks}</td>
                    <td>{test.results.length}</td>
                    <td>
                      <button className="button button-secondary" type="button" onClick={() => handleResendWhatsApp(test.id)} style={{ marginRight: '8px' }}>
                        Resend WA
                      </button>
                      <button className="button button-danger" type="button" onClick={() => handleDeleteTest(test.id)}>
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
    </div>
  );
};

export default AdminResultsPage;
