import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import logo from "../../logo.webp";

const navItems = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/students", label: "Students" },
  { to: "/admin/attendance", label: "Attendance" },
  { to: "/admin/notices", label: "Notices" },
  { to: "/admin/timetable", label: "Timetable" }
];

const AdminLayout = () => {
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
            <p className="eyebrow">Admin Panel</p>
            <h1>Gurukul Academy</h1>
          </div>
        </div>
        <button className="button button-secondary" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <nav className="admin-nav" aria-label="Admin navigation">
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

export default AdminLayout;