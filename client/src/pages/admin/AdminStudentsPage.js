import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import { apiFetch } from "../../utils/api";

const batchSubjectsMap = {
  "8th class": ["Maths", "Science", "English", "SST"],
  "9th class": ["Physics", "Chemistry", "Biology", "Maths"],
  "10th class": ["Physics", "Chemistry", "Biology", "Maths"],
  "11th class": ["Physics", "Chemistry", "Biology", "Maths"],
  "12th class": ["Physics", "Chemistry", "Biology", "Maths"]
};

// Removed manual parseResponse as apiFetch handles it.

const AdminStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [studentForm, setStudentForm] = useState({ 
    name: "", 
    password: "", 
    batch: "8th class", 
    subjects: ["Maths", "Science", "English", "SST"],
    feesTotal: 10000 
  });
  const [payModal, setPayModal] = useState({ studentId: null, amount: "", mode: "UPI" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadStudents = async () => {
    const data = await apiFetch("/students");
    setStudents(data);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        await loadStudents();
      } catch (requestError) {
        setError(requestError.message || "Unable to load students.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
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

  const clearFlash = () => {
    setError("");
    setSuccess("");
  };

  const handleAddStudent = async (event) => {
    event.preventDefault();
    clearFlash();

    try {
      await apiFetch("/students", {
        method: "POST",
        body: JSON.stringify(studentForm)
      });
      setStudentForm({ 
        name: "", 
        password: "", 
        batch: "8th class", 
        subjects: batchSubjectsMap["8th class"],
        feesTotal: 10000 
      });
      await loadStudents();
      setSuccess("Student added successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to add student.");
    }
  };

  const handleDeleteStudent = async (studentId) => {
    clearFlash();
    const confirmed = window.confirm("Delete this student?");

    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/students/${studentId}`, {
        method: "DELETE"
      });
      await loadStudents();
      setSuccess("Student deleted successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to delete student.");
    }
  };

  const handleSendReminder = (studentName, fees) => {
    window.alert(
      `[WhatsApp Automation Triggered]\n\nAutomated message scheduled for ${studentName}:\n"Dear ${studentName}, this is a gentle reminder that ₹${fees} in tuition fees are currently pending at Gurukul Academy. Kindly complete your payment soon."`
    );
  };

  const handlePayFeeSubmit = async (event) => {
    event.preventDefault();
    clearFlash();

    try {
      const data = await apiFetch(`/students/${payModal.studentId}/pay`, {
        method: "POST",
        body: JSON.stringify({ amount: Number(payModal.amount), mode: payModal.mode })
      });
      
      // Generate PDF
      const student = data.student;
      const paymentDate = data.payment.date;
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text("Gurukul Academy", 105, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.text("The Way to Success", 105, 28, { align: "center" });

      doc.setFontSize(14);
      doc.text("Fee Receipt", 105, 38, { align: "center" });
      
      doc.setFontSize(12);
      doc.text(`Student Name: ${student.name}`, 20, 50);
      doc.text(`Class/Batch: ${student.batch}`, 20, 60);
      doc.text(`Payment Date: ${paymentDate}`, 20, 70);
      doc.text(`Payment Mode: ${payModal.mode}`, 20, 80);
      
      doc.setFontSize(14);
      doc.text(`Amount Paid: Rs. ${payModal.amount}`, 20, 100);
      doc.text(`Fees Pending: Rs. ${student.feesPending}`, 20, 110);
      
      doc.save(`Receipt_${student.name.replace(/ /g, "_")}_${data.payment.id}.pdf`);

      setPayModal({ studentId: null, amount: "", mode: "UPI" });
      await loadStudents();
      setSuccess("Fee paid successfully and receipt downloaded.");
    } catch (requestError) {
      setError(requestError.message || "Unable to process payment.");
    }
  };

  return (
    <div className="admin-page">
      <h2>Students</h2>

      {error ? <p className="alert alert-error">{error}</p> : null}
      {success ? <p className="alert alert-success">{success}</p> : null}

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
              subjects: batchSubjectsMap[newBatch] || []
            }));
          }}
        >
          <option value="8th class">8th class</option>
          <option value="9th class">9th class</option>
          <option value="10th class">10th class</option>
          <option value="11th class">11th class</option>
          <option value="12th class">12th class</option>
        </select>
        <input
          className="input"
          type="number"
          placeholder="Total Fees"
          value={studentForm.feesTotal}
          onChange={(event) =>
            setStudentForm((prev) => ({ ...prev, feesTotal: event.target.value }))
          }
        />
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <strong>Subjects:</strong>
          {(batchSubjectsMap[studentForm.batch] || []).map((sub) => (
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

      {payModal.studentId && (
        <div className="panel" style={{ marginTop: '12px' }}>
          <h3>Pay Fees for {students.find(s => s.id === payModal.studentId)?.name}</h3>
          <form className="form-grid" onSubmit={handlePayFeeSubmit}>
            <input
              className="input"
              type="number"
              placeholder="Amount"
              value={payModal.amount}
              onChange={(e) => setPayModal({ ...payModal, amount: e.target.value })}
            />
            <select
              className="input"
              value={payModal.mode}
              onChange={(e) => setPayModal({ ...payModal, mode: e.target.value })}
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
            <button className="button button-primary" type="submit">Complete Payment & Get PDF</button>
            <button 
              className="button button-secondary" 
              type="button" 
              onClick={() => setPayModal({ studentId: null, amount: "", mode: "UPI" })}
            >Cancel</button>
          </form>
        </div>
      )}

      {isLoading ? (
        <p className="loading-text">Loading students...</p>
      ) : studentSummaries.length === 0 ? (
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
                <th>Total Fees</th>
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
                  <td>₹{student.feesTotal}</td>
                  <td>₹{student.feesPending}</td>
                  <td>
                    <button
                      type="button"
                      className="button button-primary"
                      style={{ marginRight: '6px', marginBottom: '4px' }}
                      onClick={() => setPayModal({ studentId: student.id, amount: "", mode: "UPI" })}
                    >
                      Pay Fee
                    </button>
                    {student.feesPending > 0 && (
                      <button
                        type="button"
                        className="button"
                        style={{ marginRight: '6px', marginBottom: '4px', background: 'linear-gradient(135deg, #128C7E, #075E54)', color: 'white' }}
                        onClick={() => handleSendReminder(student.name, student.feesPending)}
                      >
                        WhatsApp Reminder
                      </button>
                    )}
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
    </div>
  );
};

export default AdminStudentsPage;