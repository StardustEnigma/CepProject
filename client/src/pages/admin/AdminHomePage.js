import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../utils/api";

const cards = [
  {
    title: "Manage Students",
    description: "Add new students, review list, and remove records.",
    to: "/admin/students"
  },
  {
    title: "Mark Attendance",
    description: "Class-wise attendance with quick tap-to-mark.",
    to: "/admin/attendance"
  },
  {
    title: "Publish Notices",
    description: "Post important updates for all students.",
    to: "/admin/notices"
  },
  {
    title: "Manage Timetable",
    description: "Create and update weekly class schedule.",
    to: "/admin/timetable"
  }
];

// Removed manual parseResponse as apiFetch handles it.

const AdminHomePage = () => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await apiFetch("/students");
        setStudents(data);
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const totalStudents = students.length;
  const expectedFees = students.reduce((sum, s) => sum + (s.feesTotal || 0), 0);
  const collectedFees = students.reduce((sum, s) => sum + (s.feesPaid || 0), 0);
  const pendingFees = students.reduce((sum, s) => sum + (s.feesPending || 0), 0);
  const collectionRate = expectedFees > 0 ? Math.round((collectedFees / expectedFees) * 100) : 0;

  const batchStats = useMemo(() => {
    const stats = {};
    students.forEach((s) => {
      if (!stats[s.batch]) {
        stats[s.batch] = { count: 0, pending: 0, collected: 0, total: 0 };
      }
      stats[s.batch].count += 1;
      stats[s.batch].pending += (s.feesPending || 0);
      stats[s.batch].collected += (s.feesPaid || 0);
      stats[s.batch].total += (s.feesTotal || 0);
    });
    return Object.entries(stats).map(([batch, data]) => ({ batch, ...data }));
  }, [students]);

  return (
    <div className="admin-page">
      <h2>Admin Overview</h2>
      <p className="muted">Manage your coaching center efficiently from here.</p>

      <div className="quick-grid">
        {cards.map((card) => (
          <article key={card.to} className="quick-card">
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            <Link className="button" to={card.to}>
              Open →
            </Link>
          </article>
        ))}
      </div>

      <h2 style={{ marginTop: '2rem' }}>Financial Dashboard</h2>
      {isLoading ? (
        <p className="loading-text">Loading insights...</p>
      ) : (
        <>
          <div className="quick-grid">
            <article className="stat-card" style={{ background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)', borderColor: '#ffcc80' }}>
              <h3 style={{ color: '#e65100' }}>Total Students</h3>
              <p className="stat-value" style={{ color: '#bf360c' }}>{totalStudents}</p>
              <p style={{ fontSize: '0.82rem', color: '#e65100' }}>Across all batches</p>
            </article>
            <article className="stat-card" style={{ background: 'linear-gradient(135deg, #fff8e1, #ffecb3)', borderColor: '#ffe082' }}>
              <h3 style={{ color: '#f57f17' }}>Expected Revenue</h3>
              <p className="stat-value" style={{ color: '#e65100' }}>₹{expectedFees.toLocaleString()}</p>
              <p style={{ fontSize: '0.82rem', color: '#f57f17' }}>Total fees across students</p>
            </article>
            <article className="stat-card" style={{ background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', borderColor: '#a5d6a7' }}>
              <h3 style={{ color: '#2e7d32' }}>Collected</h3>
              <p className="stat-value" style={{ color: '#1b5e20' }}>₹{collectedFees.toLocaleString()}</p>
              <p style={{ fontSize: '0.82rem', color: '#2e7d32' }}>{collectionRate}% collection rate</p>
            </article>
            <article className="stat-card" style={{ background: 'linear-gradient(135deg, #ffebee, #ffcdd2)', borderColor: '#ef9a9a' }}>
              <h3 style={{ color: '#c62828' }}>Pending</h3>
              <p className="stat-value" style={{ color: '#b71c1c' }}>₹{pendingFees.toLocaleString()}</p>
              <p style={{ fontSize: '0.82rem', color: '#c62828' }}>Requires follow-up</p>
            </article>
          </div>

          <div className="panel" style={{ marginTop: '1rem' }}>
            <h3>Pending Fees Breakdown by Batch</h3>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Batch</th>
                    <th>Students</th>
                    <th>Expected</th>
                    <th>Collected</th>
                    <th>Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {batchStats.sort((a,b) => b.pending - a.pending).map((row) => (
                    <tr key={row.batch}>
                      <td style={{ fontWeight: 600 }}>{row.batch}</td>
                      <td>{row.count}</td>
                      <td>₹{row.total.toLocaleString()}</td>
                      <td style={{ color: '#2e7d32', fontWeight: 600 }}>₹{row.collected.toLocaleString()}</td>
                      <td style={{ fontWeight: 700, color: row.pending > 0 ? '#c62828' : '#2e7d32' }}>
                        ₹{row.pending.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {batchStats.length === 0 && (
                    <tr>
                      <td colSpan="5" className="muted" style={{ textAlign: "center" }}>No data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminHomePage;