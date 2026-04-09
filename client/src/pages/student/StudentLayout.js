import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import logo from "../../logo.webp";

const navItems = [
  { to: "/student", label: "Overview", end: true },
  { to: "/student/attendance", label: "Attendance" },
  { to: "/student/notices", label: "Notices" },
  { to: "/student/timetable", label: "Timetable" },
  { to: "/student/tests", label: "Tests" },
  { to: "/student/fees", label: "Fees" }
];

const StudentLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <main className="dashboard-shell">
      <header className="top-bar">
        <div className="top-bar-brand">
          <img src={logo} alt="Gurukul Academy" className="top-bar-logo" />
          <div>
            <p className="eyebrow">Student Portal</p>
            <h1>Welcome, {localStorage.getItem("studentName") || "Student"}</h1>
          </div>
        </div>
        <button className="button button-secondary" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <nav className="admin-nav" aria-label="Student navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? "admin-nav-link-active" : ""}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <section className="panel admin-content-panel">
        <Outlet />
      </section>
    </main>
  );
};

export default StudentLayout;