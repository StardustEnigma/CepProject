import React, { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";

const today = new Date().toISOString().slice(0, 10);

// Removed manual parseResponse as apiFetch handles it.

const feeStructure = [
  { id: 1, item: "Admission Fee", amount: 1000 },
  { id: 2, item: "Monthly Tuition Fee", amount: 1200 },
  { id: 3, item: "Test Series Fee", amount: 500 }
];

const StudentFeesPage = () => {
  const studentId = localStorage.getItem("studentId");
  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentForm, setPaymentForm] = useState({ amount: "", date: today, mode: "Cash", note: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFeesData = async () => {
      if (!studentId) { setError("Session expired. Please login again."); setIsLoading(false); return; }
      try {
        const studentData = await apiFetch(`/students/${studentId}`);
        setStudent(studentData);
        setPayments(studentData.payments || []);
      } catch (e) { setError(e.message || "Unable to load fees page."); }
      finally { setIsLoading(false); }
    };
    loadFeesData();
  }, [studentId]);

  const handlePayFees = () => { setError(""); setSuccess("For now, please visit the Coaching Center Admin to process a payment."); };

  const paidAmount = student?.feesPaid ?? 0;
  const totalFees = student?.feesTotal ?? 0;
  const pendingFees = student?.feesPending ?? 0;
  const paymentRate = totalFees > 0 ? Math.round((paidAmount / totalFees) * 100) : 0;

  return (
    <div className="admin-page">
      <h2>Fees & Payments</h2>

      {error ? <p className="alert alert-error">{error}</p> : null}
      {success ? <p className="alert alert-success">{success}</p> : null}

      {isLoading ? <p className="loading-text">Loading fees...</p> : null}

      <div className="quick-grid stagger" style={{ marginBottom: '0.5rem' }}>
        <article className="stat-card" style={{ background: 'linear-gradient(135deg, #fff5eb, #ffe8d4)', borderColor: '#ffd0a0' }}>
          <h3 style={{ color: '#c44a00' }}>{student?.name || localStorage.getItem("studentName") || "Student"}</h3>
          <p className="stat-value" style={{ color: '#9c3700', fontSize: '1.3rem' }}>{pendingFees.toLocaleString()}</p>
          <p className="stat-detail" style={{ color: '#c44a00' }}>Fees Pending</p>
        </article>
        <article className="stat-card" style={{ background: 'linear-gradient(135deg, #edf8ef, #d4edda)', borderColor: '#a3d9b1' }}>
          <h3 style={{ color: '#1a7a2e' }}>Paid</h3>
          <p className="stat-value" style={{ color: '#145a22', fontSize: '1.3rem' }}>{paidAmount.toLocaleString()}</p>
          <p className="stat-detail" style={{ color: '#1a7a2e' }}>{paymentRate}% of {totalFees.toLocaleString()}</p>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${paymentRate}%`, background: 'linear-gradient(90deg, #1a7a2e, #2d9e42)' }} />
          </div>
        </article>
      </div>

      <div className="panel">
        <h3>Fee Structure</h3>
        <div className="table-wrap" style={{ marginTop: '0.5rem' }}>
          <table className="table">
            <thead><tr><th>Fee Item</th><th>Amount (INR)</th></tr></thead>
            <tbody>
              {feeStructure.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 600 }}>{row.item}</td>
                  <td>{row.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <button type="button" className="button" onClick={handlePayFees}>Pay Fees</button>
        </div>
      </div>

      <h3 style={{ marginTop: '0.75rem' }}>Payment History</h3>
      {payments.length === 0 ? (
        <div className="empty-state"><p className="muted">No official payments recorded yet.</p></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Date</th><th>Amount</th><th>Mode</th><th>Note</th></tr></thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.date}</td>
                  <td style={{ fontWeight: 600, color: '#1a7a2e' }}>{payment.amount}</td>
                  <td><span className="batch-badge">{payment.mode}</span></td>
                  <td>{payment.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentFeesPage;