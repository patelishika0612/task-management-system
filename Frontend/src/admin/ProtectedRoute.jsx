// src/admin/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const adminEmail = localStorage.getItem("adminEmail");

  if (!adminEmail) {
    // Not logged in → redirect to admin login
    return <Navigate to="/adminLogin" replace />;
  }

  return children;
};

export default ProtectedRoute;
