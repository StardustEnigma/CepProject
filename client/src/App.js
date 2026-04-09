import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import AdminAttendancePage from "./pages/admin/AdminAttendancePage";
import AdminHomePage from "./pages/admin/AdminHomePage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminNoticesPage from "./pages/admin/AdminNoticesPage";
import AdminStudentsPage from "./pages/admin/AdminStudentsPage";
import AdminTimetablePage from "./pages/admin/AdminTimetablePage";
import StudentAttendancePage from "./pages/student/StudentAttendancePage";
import StudentFeesPage from "./pages/student/StudentFeesPage";
import StudentHomePage from "./pages/student/StudentHomePage";
import StudentLayout from "./pages/student/StudentLayout";
import StudentNoticesPage from "./pages/student/StudentNoticesPage";
import StudentTestsPage from "./pages/student/StudentTestsPage";
import StudentTimetablePage from "./pages/student/StudentTimetablePage";

const getDefaultRoute = () => {
  const role = localStorage.getItem("role");

  if (role === "admin") {
    return "/admin";
  }

  if (role === "student") {
    return "/student";
  }

  return "/login";
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminHomePage />} />
        <Route path="students" element={<AdminStudentsPage />} />
        <Route path="attendance" element={<AdminAttendancePage />} />
        <Route path="notices" element={<AdminNoticesPage />} />
        <Route path="timetable" element={<AdminTimetablePage />} />
      </Route>
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentHomePage />} />
        <Route path="attendance" element={<StudentAttendancePage />} />
        <Route path="notices" element={<StudentNoticesPage />} />
        <Route path="timetable" element={<StudentTimetablePage />} />
        <Route path="tests" element={<StudentTestsPage />} />
        <Route path="fees" element={<StudentFeesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;