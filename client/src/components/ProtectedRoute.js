import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ allowedRole, children }) => {
  const role = localStorage.getItem("role");
  const location = useLocation();

  if (!role) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (role !== allowedRole) {
    return <Navigate to={role === "admin" ? "/admin" : "/student"} replace />;
  }

  return children;
};

export default ProtectedRoute;