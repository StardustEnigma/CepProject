import React, { useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { apiFetch } from "../../utils/api";
import logoSrc from "../../logo.webp";

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
    name: "", password: "", phoneNumber: "",
    batch: "8th class", subjects: ["Maths", "Science", "English", "SST"], feesTotal: 10000
  });
  const [payModal, setPayModal] = useState({ studentId: null, amount: "", mode: "UPI" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const logoDataUrl = useRef(null);

  // Preload logo as PNG data URL (jsPDF doesn't support webp)
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        logoDataUrl.current = canvas.toDataURL("image/png");
      } catch (_) { /* ignore if canvas fails */ }
    };
    img.src = logoSrc;
  }, []);

  const loadStudents = async () => { const data = await apiFetch("/students"); setStudents(data); };
  const loadWhatsAppStatus = async () => { const s = await apiFetch("/whatsapp/status"); setWhatsappStatus(s); return s; };
  const loadWhatsAppTemplates = async () => {
    const t = await apiFetch("/whatsapp/templates");
    setTemplateForm({ welcome: t.welcome || "", feeReminder: t.feeReminder || "" });
    return t;
  };
  const loadWhatsAppMeta = async () => { await Promise.all([loadWhatsAppStatus(), loadWhatsAppTemplates()]); };

  useEffect(() => {
    const load = async () => {
      try { setError(""); await Promise.all([loadStudents(), loadWhatsAppMeta()]); }
      catch (e) { setError(e.message || "Unable to load students."); }
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  const studentSummaries = useMemo(() =>
    students.map((student) => ({
      ...student,
      presentCount: student.attendance.filter((e) => e.present).length,
      totalAttendance: student.attendance.length
    })), [students]);

  const clearFlash = () => { setError(""); setSuccess(""); };

  const handleAddStudent = async (event) => {
    event.preventDefault(); clearFlash();
    if (!studentForm.phoneNumber.trim()) { setError("Phone number is required."); return; }
    try {
      const response = await apiFetch("/students", { method: "POST", body: JSON.stringify(studentForm) });
      setStudentForm({ name: "", password: "", phoneNumber: "", batch: "8th class", subjects: batchSubjectsMap["8th class"], feesTotal: 10000 });
      await loadStudents();
      setSuccess(response.message || "Student added successfully.");
    } catch (e) { setError(e.message || "Unable to add student."); }
  };

  const handleDeleteStudent = async (studentId) => {
    clearFlash();
    if (!window.confirm("Delete this student?")) return;
    try { await apiFetch(`/students/${studentId}`, { method: "DELETE" }); await loadStudents(); setSuccess("Student deleted successfully."); }
    catch (e) { setError(e.message || "Unable to delete student."); }
  };

  const handleSendReminder = async (studentId) => {
    clearFlash(); setSendingReminderForId(studentId);
    try {
      const response = await apiFetch(`/students/${studentId}/whatsapp/fee-reminder`, { method: "POST" });
      await Promise.all([loadStudents(), loadWhatsAppStatus()]);
      setSuccess(response.message || "Reminder processed.");
    } catch (e) { setError(e.message || "Unable to send WhatsApp reminder."); }
    finally { setSendingReminderForId(null); }
  };

  const handleSaveTemplates = async (event) => {
    event.preventDefault(); clearFlash();
    if (!templateForm.welcome.trim() || !templateForm.feeReminder.trim()) { setError("Welcome and fee reminder templates are required."); return; }
    setIsSavingTemplates(true);
    try {
      const response = await apiFetch("/whatsapp/templates", { method: "PUT", body: JSON.stringify(templateForm) });
      if (response.templates) { setTemplateForm({ welcome: response.templates.welcome || "", feeReminder: response.templates.feeReminder || "" }); }
      await loadWhatsAppMeta();
      setSuccess(response.message || "WhatsApp templates updated.");
    } catch (e) { setError(e.message || "Unable to update WhatsApp templates."); }
    finally { setIsSavingTemplates(false); }
  };

  const handleReloadTemplates = async () => {
    clearFlash();
    try { await loadWhatsAppMeta(); setSuccess("Loaded latest saved WhatsApp templates."); }
    catch (e) { setError(e.message || "Unable to load WhatsApp templates."); }
  };

  const handleRefreshStatus = async () => {
    clearFlash(); setIsRefreshingStatus(true);
    try { await loadWhatsAppStatus(); setSuccess("WhatsApp status refreshed."); }
    catch (e) { setError(e.message || "Unable to refresh WhatsApp status."); }
    finally { setIsRefreshingStatus(false); }
  };

  const handleResetWhatsApp = async () => {
    if (!window.confirm("Are you sure you want to reset the WhatsApp client? This will log out any linked device and require an immediate re-scan of the QR code.")) return;
    clearFlash(); setIsResettingWhatsApp(true); setWhatsappStatus(null);
    try { await apiFetch("/whatsapp/reset", { method: "POST" }); setSuccess("WhatsApp client reset. Waiting for new QR code..."); setTimeout(() => loadWhatsAppStatus(), 2000); }
    catch (err) { setError(err.message || "Unable to reset WhatsApp."); }
    finally { setIsResettingWhatsApp(false); }
  };

  const handlePayFeeSubmit = async (event) => {
    event.preventDefault(); clearFlash();
    try {
      const data = await apiFetch(`/students/${payModal.studentId}/pay`, { method: "POST", body: JSON.stringify({ amount: Number(payModal.amount), mode: payModal.mode }) });
      const student = data.student;
      const payment = data.payment;

      // ── Build Professional PDF Receipt ──
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const brandColor = [217, 79, 0]; // Gurukul saffron/orange
      const darkColor = [26, 18, 7];
      const mutedColor = [100, 90, 75];
      let y = 14;

      // ── Top accent bar ──
      doc.setFillColor(...brandColor);
      doc.rect(0, 0, pageWidth, 5, "F");
      y = 16;

      // ── Logo ──
      if (logoDataUrl.current) {
        doc.addImage(logoDataUrl.current, "PNG", pageWidth / 2 - 18, y, 36, 36);
        y += 40;
      }

      // ── Academy Name ──
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(...brandColor);
      doc.text("GURUKUL ACADEMY", pageWidth / 2, y, { align: "center" });
      y += 7;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(...mutedColor);
      doc.text("The Way to Success", pageWidth / 2, y, { align: "center" });
      y += 10;

      // ── Divider ──
      doc.setDrawColor(...brandColor);
      doc.setLineWidth(0.6);
      doc.line(20, y, pageWidth - 20, y);
      y += 8;

      // ── Receipt Title ──
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...darkColor);
      doc.text("FEE RECEIPT", pageWidth / 2, y, { align: "center" });
      y += 10;

      // ── Receipt meta ──
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...mutedColor);
      doc.text(`Receipt No: ${payment.id}`, 20, y);
      doc.text(`Date: ${payment.date}`, pageWidth - 20, y, { align: "right" });
      y += 8;

      // ── Student Info Table ──
      doc.autoTable({
        startY: y,
        head: [["Student Details", ""]],
        body: [
          ["Student Name", student.name],
          ["Class / Batch", student.batch],
          ["Phone Number", student.phoneNumber || "—"],
        ],
        theme: "grid",
        headStyles: {
          fillColor: brandColor,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 10,
          halign: "left",
        },
        bodyStyles: {
          fontSize: 10,
          textColor: darkColor,
        },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 55, textColor: mutedColor },
          1: { cellWidth: "auto" },
        },
        margin: { left: 20, right: 20 },
        tableLineColor: [200, 190, 175],
        tableLineWidth: 0.25,
      });

      y = doc.lastAutoTable.finalY + 8;

      // ── Payment Details Table ──
      doc.autoTable({
        startY: y,
        head: [["Payment Details", ""]],
        body: [
          ["Amount Paid", `Rs. ${Number(payment.amount).toLocaleString()}`],
          ["Payment Mode", payment.mode],
          ["Total Fees", `Rs. ${Number(student.feesTotal).toLocaleString()}`],
          ["Fees Pending", `Rs. ${Number(student.feesPending).toLocaleString()}`],
        ],
        theme: "grid",
        headStyles: {
          fillColor: brandColor,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 10,
          halign: "left",
        },
        bodyStyles: {
          fontSize: 10,
          textColor: darkColor,
        },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 55, textColor: mutedColor },
          1: { cellWidth: "auto" },
        },
        margin: { left: 20, right: 20 },
        tableLineColor: [200, 190, 175],
        tableLineWidth: 0.25,
        didParseCell: (hookData) => {
          // Highlight pending row in red if > 0
          if (hookData.section === "body" && hookData.row.index === 3 && student.feesPending > 0) {
            hookData.cell.styles.textColor = [196, 32, 32];
            hookData.cell.styles.fontStyle = "bold";
          }
        },
      });

      y = doc.lastAutoTable.finalY + 14;

      // ── Thank you note ──
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...brandColor);
      doc.text("Thank you for your payment!", pageWidth / 2, y, { align: "center" });
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...mutedColor);
      doc.text("This is a computer-generated receipt and does not require a signature.", pageWidth / 2, y, { align: "center" });

      // ── Bottom accent bar ──
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFillColor(...brandColor);
      doc.rect(0, pageHeight - 5, pageWidth, 5, "F");

      doc.save(`Receipt_${student.name.replace(/ /g, "_")}_${payment.id}.pdf`);

      setPayModal({ studentId: null, amount: "", mode: "UPI" });
      await loadStudents();
      const waMsg = data.whatsapp?.sent
        ? "Fee paid, receipt downloaded, and sent via WhatsApp."
        : "Fee paid and receipt downloaded.";
      setSuccess(waMsg);
    } catch (e) { setError(e.message || "Unable to process payment."); }
  };

  return (
    <div className="admin-page">
      <h2>Students</h2>

      {error ? <p className="alert alert-error">{error}</p> : null}
      {success ? <p className="alert alert-success">{success}</p> : null}

      {/* WhatsApp Section */}
      <section className="panel" style={{ marginBottom: "0.85rem" }}>
        <h3>WhatsApp Automation</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Status:{" "}
          <span style={{ fontWeight: 700, color: whatsappStatus?.ready ? '#1a7a2e' : '#c42020' }}>
            {whatsappStatus?.ready ? "Connected" : "Not Connected"}
          </span>
          {whatsappStatus?.enabled === false ? " (Disabled by environment)" : ""}
        </p>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
          <button className="button button-sm button-secondary" type="button" onClick={handleRefreshStatus} disabled={isRefreshingStatus}>
            {isRefreshingStatus ? "Refreshing..." : "Refresh Status"}
          </button>
          <button className="button button-sm button-danger" type="button" onClick={handleResetWhatsApp} disabled={isResettingWhatsApp}>
            {isResettingWhatsApp ? "Resetting..." : "Reset WhatsApp"}
          </button>
        </div>

        {whatsappStatus?.lastError ? (<p className="alert alert-error" style={{ marginTop: "0.5rem" }}>{whatsappStatus.lastError}</p>) : null}

        {whatsappStatus?.enabled !== false && !whatsappStatus?.ready ? (
          whatsappStatus?.qrCodeDataUrl ? (
            <div className="wa-qr-panel">
              <p className="muted wa-qr-text">Scan this code from WhatsApp Linked Devices.</p>
              <img src={whatsappStatus.qrCodeDataUrl} alt="WhatsApp login QR code" className="wa-qr-image" />
              {whatsappStatus?.qrUpdatedAt ? (<p className="muted wa-qr-meta">Updated: {new Date(whatsappStatus.qrUpdatedAt).toLocaleString()}</p>) : null}
            </div>
          ) : (<p className="muted" style={{ marginTop: "0.5rem" }}>QR code is not available yet. Refresh status in a few seconds.</p>)
        ) : null}

        <form className="form-stack" onSubmit={handleSaveTemplates} style={{ marginTop: '0.75rem' }}>
          <div>
            <label htmlFor="wa-welcome-template">Welcome Message Template</label>
            <textarea id="wa-welcome-template" className="input textarea" value={templateForm.welcome} onChange={(e) => setTemplateForm((prev) => ({ ...prev, welcome: e.target.value }))} placeholder="Welcome template" />
          </div>
          <div>
            <label htmlFor="wa-fee-template">Fee Reminder Template</label>
            <textarea id="wa-fee-template" className="input textarea" value={templateForm.feeReminder} onChange={(e) => setTemplateForm((prev) => ({ ...prev, feeReminder: e.target.value }))} placeholder="Fee reminder template" />
          </div>
          <p className="muted" style={{ fontSize: '0.82rem' }}>
            Placeholders: <code>{"{{name}}"}</code> <code>{"{{batch}}"}</code> <code>{"{{feesPending}}"}</code> <code>{"{{feesTotal}}"}</code> <code>{"{{feesPaid}}"}</code> <code>{"{{phoneNumber}}"}</code>
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button className="button" type="submit" disabled={isSavingTemplates}>{isSavingTemplates ? "Saving..." : "Save Templates"}</button>
            <button className="button button-secondary" type="button" onClick={handleReloadTemplates}>Reload Saved</button>
          </div>
        </form>
      </section>

      {/* Add Student Form */}
      <section className="panel" style={{ marginBottom: "0.85rem" }}>
        <h3>Add New Student</h3>
        <form className="form-grid" onSubmit={handleAddStudent} style={{ marginTop: '0.5rem' }}>
          <div><label>Student Name</label><input className="input" placeholder="Full name" value={studentForm.name} onChange={(e) => setStudentForm((prev) => ({ ...prev, name: e.target.value }))} /></div>
          <div><label>Password</label><input className="input" type="password" placeholder="Login password" value={studentForm.password} onChange={(e) => setStudentForm((prev) => ({ ...prev, password: e.target.value }))} /></div>
          <div><label>Phone Number</label><input className="input" placeholder="e.g. 9876543210" value={studentForm.phoneNumber} onChange={(e) => setStudentForm((prev) => ({ ...prev, phoneNumber: e.target.value }))} /></div>
          <div><label>Batch</label>
            <select className="input" value={studentForm.batch} onChange={(e) => { const nb = e.target.value; setStudentForm((prev) => ({ ...prev, batch: nb, subjects: batchSubjectsMap[nb] || [] })); }}>
              <option value="8th class">8th class</option><option value="9th class">9th class</option><option value="10th class">10th class</option><option value="11th class">11th class</option><option value="12th class">12th class</option>
            </select>
          </div>
          <div><label>Total Fees</label><input className="input" type="number" placeholder="Total Fees" value={studentForm.feesTotal} onChange={(e) => setStudentForm((prev) => ({ ...prev, feesTotal: e.target.value }))} /></div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label>Subjects</label>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", marginTop: '0.25rem' }}>
              {(batchSubjectsMap[studentForm.batch] || []).map((sub) => (
                <label key={sub} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: '0.88rem', textTransform: 'none', letterSpacing: 'normal', fontWeight: 500 }}>
                  <input type="checkbox" checked={studentForm.subjects.includes(sub)} onChange={(e) => { const c = e.target.checked; setStudentForm((prev) => ({ ...prev, subjects: c ? [...prev.subjects, sub] : prev.subjects.filter((s) => s !== sub) })); }} />
                  {sub}
                </label>
              ))}
            </div>
          </div>
          <button className="button" type="submit" style={{ gridColumn: "1 / -1" }}>Add Student</button>
        </form>
      </section>

      {/* Pay Fee Modal */}
      {payModal.studentId && (
        <div className="panel" style={{ marginBottom: '0.85rem', borderColor: 'var(--border-hover)' }}>
          <h3>Pay Fees for {students.find(s => s.id === payModal.studentId)?.name}</h3>
          <form className="form-grid" onSubmit={handlePayFeeSubmit} style={{ marginTop: '0.5rem' }}>
            <div><label>Amount</label><input className="input" type="number" placeholder="Amount" value={payModal.amount} onChange={(e) => setPayModal({ ...payModal, amount: e.target.value })} /></div>
            <div><label>Payment Mode</label>
              <select className="input" value={payModal.mode} onChange={(e) => setPayModal({ ...payModal, mode: e.target.value })}>
                <option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Card">Card</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', gridColumn: '1 / -1' }}>
              <button className="button button-primary" type="submit">Complete Payment & Get PDF</button>
              <button className="button button-secondary" type="button" onClick={() => setPayModal({ studentId: null, amount: "", mode: "UPI" })}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Student List */}
      {isLoading ? (
        <p className="loading-text">Loading students...</p>
      ) : studentSummaries.length === 0 ? (
        <div className="empty-state"><p className="muted">No students added yet.</p></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Phone</th><th>Batch & Subjects</th><th>Attendance</th><th>Total Fees</th><th>Pending</th><th>WA Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {studentSummaries.map((student) => (
                <tr key={student.id}>
                  <td className="muted">{student.id}</td>
                  <td style={{ fontWeight: 700 }}>{student.name}</td>
                  <td>{student.phoneNumber || "—"}</td>
                  <td>
                    <span className="batch-badge">{student.batch}</span>
                    <div className="muted" style={{ fontSize: "0.78rem", marginTop: '3px' }}>{student.subjects?.join(", ")}</div>
                  </td>
                  <td>{student.presentCount}/{student.totalAttendance}</td>
                  <td>{student.feesTotal?.toLocaleString()}</td>
                  <td style={{ fontWeight: 700, color: student.feesPending > 0 ? '#c42020' : '#1a7a2e' }}>{student.feesPending?.toLocaleString()}</td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.78rem', color: student.lastWhatsAppStatus === "sent" ? "#1a7a2e" : "#c42020" }}>
                      {student.lastWhatsAppStatus ? student.lastWhatsAppStatus.toUpperCase() : "—"}
                    </div>
                    <div className="muted" style={{ fontSize: "0.72rem" }}>{student.lastWhatsAppType || "No message yet"}</div>
                    <div className="muted" style={{ fontSize: "0.7rem" }}>{student.lastWhatsAppAt ? new Date(student.lastWhatsAppAt).toLocaleString() : ""}</div>
                    {student.lastWhatsAppStatus === "failed" && student.lastWhatsAppInfo ? (<div style={{ color: "#c42020", fontSize: "0.7rem", marginTop: "2px" }}>{student.lastWhatsAppInfo}</div>) : null}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      <button type="button" className="button button-sm button-primary" onClick={() => setPayModal({ studentId: student.id, amount: "", mode: "UPI" })}>Pay</button>
                      {student.feesPending > 0 && (
                        <button type="button" disabled={sendingReminderForId === student.id} className="button button-sm" style={{ background: 'linear-gradient(135deg, #128C7E, #075E54)' }} onClick={() => handleSendReminder(student.id)}>
                          {sendingReminderForId === student.id ? "..." : "WA"}
                        </button>
                      )}
                      <button type="button" className="button button-sm button-danger" onClick={() => handleDeleteStudent(student.id)}>Delete</button>
                    </div>
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