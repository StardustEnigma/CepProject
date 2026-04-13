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
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    date: today,
    mode: "Cash",
    note: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFeesData = async () => {
      if (!studentId) {
        setError("Session expired. Please login again.");
        setIsLoading(false);
        return;
      }

      try {
        const studentData = await apiFetch(`/students/${studentId}`);
        setStudent(studentData);
        setPayments(studentData.payments || []);
      } catch (requestError) {
        setError(requestError.message || "Unable to load fees page.");
      } finally {
        setIsLoading(false);
      }
    };

    loadFeesData();
  }, [studentId]);

  const handlePayFees = () => {
    setError("");
    setSuccess("For now, please visit the Coaching Center Admin to process a payment.");
  };

  const handleAddDirectPayment = (event) => {
    event.preventDefault();
    setError("");
    setSuccess("Please request Admin to record your payment.");
  };

  return (
    <div className="admin-page">
      <h2>Fees Structure</h2>

      {error ? <p className="alert alert-error">{error}</p> : null}
      {success ? <p className="alert alert-success">{success}</p> : null}

      {isLoading ? <p className="loading-text">Loading fees...</p> : null}

      <article className="quick-card">
        <h3>{student?.name || localStorage.getItem("studentName") || "Student"}</h3>
        <p>
          Fees Pending: <strong>₹{student?.feesPending ?? 0}</strong>
        </p>
      </article>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Fee Item</th>
              <th>Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            {feeStructure.map((row) => (
              <tr key={row.id}>
                <td>{row.item}</td>
                <td>₹{row.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="form-grid">
        <button type="button" className="button" onClick={handlePayFees}>
          Pay Fees
        </button>
      </div>

      <h3>Payment History</h3>
      {payments.length === 0 ? (
        <p className="muted">No official payments recorded yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.date}</td>
                  <td>₹{payment.amount}</td>
                  <td>{payment.mode}</td>
                  <td>{payment.note || "-"}</td>
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