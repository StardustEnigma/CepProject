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
  const [whatsappStatus, setWhatsappStatus] = useState(null);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [isResettingWhatsApp, setIsResettingWhatsApp] = useState(false);
  const [templateForm, setTemplateForm] = useState({ welcome: "", feeReminder: "" });
  const [isSavingTemplates, setIsSavingTemplates] = useState(false);
  const [sendingReminderForId, setSendingReminderForId] = useState(null);
  const [studentForm, setStudentForm] = useState({ 
    name: "", 
    password: "", 
    phoneNumber: "",
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

  const loadWhatsAppStatus = async () => {
    const statusData = await apiFetch("/whatsapp/status");
    setWhatsappStatus(statusData);
    return statusData;
  };

  const loadWhatsAppTemplates = async () => {
    const templateData = await apiFetch("/whatsapp/templates");
    setTemplateForm({
      welcome: templateData.welcome || "",
      feeReminder: templateData.feeReminder || ""
    });

    return templateData;
  };

  const loadWhatsAppMeta = async () => {
    await Promise.all([loadWhatsAppStatus(), loadWhatsAppTemplates()]);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        await Promise.all([loadStudents(), loadWhatsAppMeta()]);
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

    if (!studentForm.phoneNumber.trim()) {
      setError("Phone number is required.");
      return;
    }

    try {
      const response = await apiFetch("/students", {
        method: "POST",
        body: JSON.stringify(studentForm)
      });
      setStudentForm({ 
        name: "", 
        password: "", 
        phoneNumber: "",
        batch: "8th class", 
        subjects: batchSubjectsMap["8th class"],
        feesTotal: 10000 
      });
      await loadStudents();
      setSuccess(response.message || "Student added successfully.");
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

  const handleSendReminder = async (studentId) => {
    clearFlash();
    setSendingReminderForId(studentId);

    try {
      const response = await apiFetch(`/students/${studentId}/whatsapp/fee-reminder`, {
        method: "POST"
      });

      await Promise.all([loadStudents(), loadWhatsAppStatus()]);
      setSuccess(response.message || "Reminder processed.");
    } catch (requestError) {
      setError(requestError.message || "Unable to send WhatsApp reminder.");
    } finally {
      setSendingReminderForId(null);
    }
  };

  const handleSaveTemplates = async (event) => {
    event.preventDefault();
    clearFlash();

    if (!templateForm.welcome.trim() || !templateForm.feeReminder.trim()) {
      setError("Welcome and fee reminder templates are required.");
      return;
    }

    setIsSavingTemplates(true);
    try {
      const response = await apiFetch("/whatsapp/templates", {
        method: "PUT",
        body: JSON.stringify(templateForm)
      });

      if (response.templates) {
        setTemplateForm({
          welcome: response.templates.welcome || "",
          feeReminder: response.templates.feeReminder || ""
        });
      }

      await loadWhatsAppMeta();
      setSuccess(response.message || "WhatsApp templates updated.");
    } catch (requestError) {
      setError(requestError.message || "Unable to update WhatsApp templates.");
    } finally {
      setIsSavingTemplates(false);
    }
  };

  const handleReloadTemplates = async () => {
    clearFlash();
    try {
      await loadWhatsAppMeta();
      setSuccess("Loaded latest saved WhatsApp templates.");
    } catch (requestError) {
      setError(requestError.message || "Unable to load WhatsApp templates.");
    }
  };

  const handleRefreshStatus = async () => {
    clearFlash();
    setIsRefreshingStatus(true);

    try {
      await loadWhatsAppStatus();
      setSuccess("WhatsApp status refreshed.");
    } catch (requestError) {
      setError(requestError.message || "Unable to refresh WhatsApp status.");
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  const handleResetWhatsApp = async () => {
    const confirmed = window.confirm("Are you sure you want to reset the WhatsApp client? This will log out any linked device and require an immediate re-scan of the QR code.");
    if (!confirmed) return;
    
    clearFlash();
    setIsResettingWhatsApp(true);
    setWhatsappStatus(null);
    try {
      await apiFetch("/whatsapp/reset", { method: "POST" });
      setSuccess("WhatsApp client reset. Waiting for new QR code...");
      setTimeout(() => loadWhatsAppStatus(), 2000);
    } catch (err) {
      setError(err.message || "Unable to reset WhatsApp.");
    } finally {
      setIsResettingWhatsApp(false);
    }
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

      <section className="panel" style={{ marginBottom: "16px" }}>
        <h3 style={{ marginTop: 0 }}>WhatsApp Automation</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Status: {whatsappStatus?.ready ? "Connected" : "Not Connected"}
          {whatsappStatus?.enabled === false ? " (Disabled by environment)" : ""}
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
          <button className="button button-secondary" type="button" onClick={handleRefreshStatus} disabled={isRefreshingStatus}>
            {isRefreshingStatus ? "Refreshing..." : "Refresh WhatsApp Status"}
          </button>
          <button className="button button-danger" type="button" onClick={handleResetWhatsApp} disabled={isResettingWhatsApp}>
            {isResettingWhatsApp ? "Resetting..." : "Reset / Re-authenticate WhatsApp"}
          </button>
        </div>
        {whatsappStatus?.lastError ? (
          <p className="alert alert-error" style={{ marginTop: "8px" }}>
            {whatsappStatus.lastError}
          </p>
        ) : null}

        {whatsappStatus?.enabled !== false && !whatsappStatus?.ready ? (
          whatsappStatus?.qrCodeDataUrl ? (
            <div className="wa-qr-panel">
              <p className="muted wa-qr-text">Scan this code from WhatsApp Linked Devices.</p>
              <img src={whatsappStatus.qrCodeDataUrl} alt="WhatsApp login QR code" className="wa-qr-image" />
              {whatsappStatus?.qrUpdatedAt ? (
                <p className="muted wa-qr-meta">
                  Updated: {new Date(whatsappStatus.qrUpdatedAt).toLocaleString()}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="muted" style={{ marginTop: "8px" }}>
              QR code is not available yet. Refresh status in a few seconds.
            </p>
          )
        ) : null}

        <form className="form-stack" onSubmit={handleSaveTemplates}>
          <label htmlFor="wa-welcome-template">Welcome Message Template</label>
          <textarea
            id="wa-welcome-template"
            className="input textarea"
            value={templateForm.welcome}
            onChange={(event) =>
              setTemplateForm((prev) => ({ ...prev, welcome: event.target.value }))
            }
            placeholder="Welcome template"
          />

          <label htmlFor="wa-fee-template">Fee Reminder Template</label>
          <textarea
            id="wa-fee-template"
            className="input textarea"
            value={templateForm.feeReminder}
            onChange={(event) =>
              setTemplateForm((prev) => ({ ...prev, feeReminder: event.target.value }))
            }
            placeholder="Fee reminder template"
          />

          <p className="muted" style={{ marginTop: "4px" }}>
            Available placeholders: <code>{"{{name}}"}</code>, <code>{"{{batch}}"}</code>, <code>{"{{feesPending}}"}</code>, <code>{"{{feesTotal}}"}</code>, <code>{"{{feesPaid}}"}</code>, <code>{"{{phoneNumber}}"}</code>
          </p>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button className="button" type="submit" disabled={isSavingTemplates}>
              {isSavingTemplates ? "Saving..." : "Save WhatsApp Templates"}
            </button>
            <button className="button button-secondary" type="button" onClick={handleReloadTemplates}>
              Reload Saved Templates
            </button>
          </div>
        </form>
      </section>

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
        <input
          className="input"
          placeholder="Phone Number (e.g. 9876543210 or 919876543210)"
          value={studentForm.phoneNumber}
          onChange={(event) =>
            setStudentForm((prev) => ({ ...prev, phoneNumber: event.target.value }))
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
                <th>Phone</th>
                <th>Batch & Subjects</th>
                <th>Attendance</th>
                <th>Total Fees</th>
                <th>Fees Pending</th>
                <th>WA Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {studentSummaries.map((student) => (
                <tr key={student.id}>
                  <td>{student.id}</td>
                  <td>{student.name}</td>
                  <td>{student.phoneNumber || "-"}</td>
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
                    <div
                      style={{
                        fontWeight: 600,
                        color: student.lastWhatsAppStatus === "sent" ? "#2e7d32" : "#c62828"
                      }}
                    >
                      {student.lastWhatsAppStatus ? student.lastWhatsAppStatus.toUpperCase() : "-"}
                    </div>
                    <div className="muted" style={{ fontSize: "0.8rem" }}>
                      {student.lastWhatsAppType || "No message yet"}
                    </div>
                    <div className="muted" style={{ fontSize: "0.78rem" }}>
                      {student.lastWhatsAppAt ? new Date(student.lastWhatsAppAt).toLocaleString() : ""}
                    </div>
                    {student.lastWhatsAppStatus === "failed" && student.lastWhatsAppInfo ? (
                      <div style={{ color: "#c62828", fontSize: "0.78rem", marginTop: "2px" }}>
                        {student.lastWhatsAppInfo}
                      </div>
                    ) : null}
                  </td>
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
                        disabled={sendingReminderForId === student.id}
                        className="button"
                        style={{ marginRight: '6px', marginBottom: '4px', background: 'linear-gradient(135deg, #128C7E, #075E54)', color: 'white' }}
                        onClick={() => handleSendReminder(student.id)}
                      >
                        {sendingReminderForId === student.id ? "Sending..." : "WhatsApp Reminder"}
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