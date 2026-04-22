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
      <p className="muted" style={{ marginTop: '-0.5rem' }}>Manage your coaching center efficiently from here.</p>

      <div className="quick-grid stagger">
        {cards.map((card) => (
          <article key={card.to} className="quick-card">
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            <Link className="button" to={card.to}>
              Open
            </Link>
          </article>
        ))}
      </div>

      <h2 style={{ marginTop: '1.5rem' }}>Financial Dashboard</h2>

      {isLoading ? (
        <p className="loading-text">Loading insights...</p>
      ) : (
        <>
          <div className="quick-grid stagger">
            <article className="stat-card" style={{ background: 'linear-gradient(135deg, #fff5eb, #ffe8d4)', borderColor: '#ffd0a0' }}>
              <h3 style={{ color: '#c44a00' }}>Total Students</h3>
              <p className="stat-value" style={{ color: '#9c3700' }}>{totalStudents}</p>
              <p className="stat-detail" style={{ color: '#c44a00' }}>Across all batches</p>
            </article>
            <article className="stat-card" style={{ background: 'linear-gradient(135deg, #fef9e7, #fef0c7)', borderColor: '#fce18a' }}>
              <h3 style={{ color: '#b8860b' }}>Expected Revenue</h3>
              <p className="stat-value" style={{ color: '#8b6914' }}>{expectedFees.toLocaleString()}</p>
              <p className="stat-detail" style={{ color: '#b8860b' }}>Total fees across students</p>
            </article>
            <article className="stat-card" style={{ background: 'linear-gradient(135deg, #edf8ef, #d4edda)', borderColor: '#a3d9b1' }}>
              <h3 style={{ color: '#1a7a2e' }}>Collected</h3>
              <p className="stat-value" style={{ color: '#145a22' }}>{collectedFees.toLocaleString()}</p>
              <p className="stat-detail" style={{ color: '#1a7a2e' }}>{collectionRate}% collection rate</p>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${collectionRate}%`, background: 'linear-gradient(90deg, #1a7a2e, #2d9e42)' }} />
              </div>
            </article>
            <article className="stat-card" style={{ background: 'linear-gradient(135deg, #fef0f0, #fddede)', borderColor: '#f5b3b3' }}>
              <h3 style={{ color: '#c42020' }}>Pending</h3>
              <p className="stat-value" style={{ color: '#991a1a' }}>{pendingFees.toLocaleString()}</p>
              <p className="stat-detail" style={{ color: '#c42020' }}>Requires follow-up</p>
            </article>
          </div>

          <div className="panel" style={{ marginTop: '0.75rem' }}>
            <h3>Pending Fees Breakdown by Batch</h3>
            <div className="table-wrap" style={{ marginTop: '0.75rem' }}>
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
                      <td><span className="batch-badge">{row.batch}</span></td>
                      <td>{row.count}</td>
                      <td>{row.total.toLocaleString()}</td>
                      <td style={{ color: '#1a7a2e', fontWeight: 600 }}>{row.collected.toLocaleString()}</td>
                      <td style={{ fontWeight: 700, color: row.pending > 0 ? '#c42020' : '#1a7a2e' }}>
                        {row.pending.toLocaleString()}
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