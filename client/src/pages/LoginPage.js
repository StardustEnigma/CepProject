import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../logo.webp";

const LoginPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("admin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = (nextMode) => {
    setMode(nextMode);
    setIdentifier("");
    setPassword("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!identifier.trim() || !password.trim()) {
      setError("Please fill all fields.");
      return;
    }

    const endpoint = mode === "admin" ? "/login/admin" : "/login/student";
    const payload =
      mode === "admin"
        ? { username: identifier.trim(), password }
        : { name: identifier.trim(), password };

    try {
      setIsLoading(true);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);

      if (mode === "admin") {
        localStorage.setItem("role", "admin");
        localStorage.removeItem("studentId");
        localStorage.removeItem("studentName");
        navigate("/admin", { replace: true });
      } else {
        localStorage.setItem("role", "student");
        localStorage.setItem("studentId", String(data.student.id));
        localStorage.setItem("studentName", data.student.name);
        navigate("/student", { replace: true });
      }
    } catch (requestError) {
      setError(requestError.message || "Unable to login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="page-shell">
      <section className="auth-card">
        <img src={logo} alt="Gurukul Academy" className="auth-logo" />
        <h1 className="auth-title">Gurukul Academy</h1>
        <p className="subtitle">The Way to Success</p>

        <div className="mode-switch">
          <button
            type="button"
            className={`chip ${mode === "admin" ? "chip-active" : ""}`}
            onClick={() => resetForm("admin")}
          >
            Admin
          </button>
          <button
            type="button"
            className={`chip ${mode === "student" ? "chip-active" : ""}`}
            onClick={() => resetForm("student")}
          >
            Student
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-stack">
          <label htmlFor="identifier">
            {mode === "admin" ? "Username" : "Student Name"}
          </label>
          <input
            id="identifier"
            className="input"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder={mode === "admin" ? "Enter admin username" : "Enter your name"}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
          />

          {error ? <p className="alert alert-error">{error}</p> : null}

          <button type="submit" className="button" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="credentials-hint">
          <p>
            Admin: <strong>admin / admin123</strong>
          </p>
          <p>Student credentials are managed from Admin Dashboard.</p>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;