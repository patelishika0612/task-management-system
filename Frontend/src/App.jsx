
import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { io } from "socket.io-client";
import "./App.css";


import Dashboard from "./admin/Dashboard";
import Sidebar from "./admin/AdminSidebar";
import Header from "./admin/AdminHeader";
import Adminprofile from "./admin/Profile";
import Login from "./admin/Login";
import Settings from "./admin/Settings";
import SetPassword from "./admin/SetPassword";
import ForgotPassword from "./admin/ForgotPassword";
import OTP from "./admin/OTP";
import ResetPassword from "./admin/ResetPassword";
import AdminLogin from "./admin/AdminLogin";
import CreateProfile from "./admin/CreateProfile";

import Department from "./admin/Department";
import Employee from "./admin/Employee";
import Project from "./admin/Project";

import Calendar from "./admin/Calendar";
import Client from "./admin/Client";

import AdminApprovalRequest from "./admin/AdminApprovalRequest";
import AdminReviewRequests from "./admin/AdminReviewRequests";
import AdminDashboard from "./admin/AdminDashboard";



function App() {

  // ==========================================
  // CHECK ADMIN SESSION
  // ==========================================

useEffect(() => {

    const token = localStorage.getItem("adminToken");

    const adminData = JSON.parse(
        localStorage.getItem("adminData") || "null"
    );

    // Admin logged in નથી
    if (!token || !adminData?.adminId) {
        console.log(
            "❌ Admin session not found. Socket not started."
        );
        return;
    }

    console.log(
        "🔐 Starting admin socket for:",
        adminData.adminId
    );

    const socket = io("http://localhost:5000");

    socket.on("connect", () => {

        console.log(
            "✅ Connected to Socket.IO:",
            socket.id
        );

        socket.emit(
            "admin-authenticated",
            adminData.adminId
        );

        console.log(
            `📡 Admin authentication sent: ${adminData.adminId}`
        );
    });

    // ==========================================
    // ADMIN DELETED FROM DATABASE
    // ==========================================

    socket.on("adminDeleted", (data) => {

        console.log(
            "🚨 ADMIN DELETED:",
            data
        );

        // Remove admin session
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminData");
        localStorage.removeItem("adminEmail");

        // Disconnect socket
        socket.disconnect();

        // Redirect to admin login
        window.location.replace("/admin-login");
    });

    socket.on("connect_error", (error) => {

        console.error(
            "❌ Socket connection error:",
            error.message
        );

    });

    socket.on("disconnect", (reason) => {

        console.log(
            "🔌 Socket disconnected:",
            reason
        );

    });

    return () => {

        socket.disconnect();

    };

}, []);


  return (
    <Routes>

      <Route path="/login" element={<Login />} />

      <Route path="/" element={<Dashboard />} />

      <Route path="/profile" element={<Adminprofile />} />

      <Route path="/settings" element={<Settings />} />

      <Route
        path="/forgotpassword"
        element={<ForgotPassword />}
      />

      <Route
        path="/otp"
        element={<OTP />}
      />

      <Route
        path="/resetpassword"
        element={<ResetPassword />}
      />

      <Route
        path="/admin-login"
        element={<AdminLogin />}
      />

      <Route
        path="/set-password"
        element={<SetPassword />}
      />

      <Route
        path="/create-profile"
        element={<CreateProfile />}
      />

      <Route
        path="/departments"
        element={<Department />}
      />

      <Route
        path="/employees"
        element={<Employee />}
      />

      <Route
        path="/projects"
        element={<Project />}
      />

      <Route
        path="/calendar"
        element={<Calendar />}
      />

      <Route
        path="/clients"
        element={<Client />}
      />

      <Route
        path="/approvalrequests"
        element={<AdminApprovalRequest />}
      />

      <Route
        path="/review-requests"
        element={<AdminReviewRequests />}
      />

      <Route
        path="/admin/approval/:token"
        element={<AdminReviewRequests />}
      />

      <Route path="/admindashboard" element={<AdminDashboard/>}/>

      {/* 
      <Route
        path="/approvedrequests"
        element={<AdminApprovalApproved />}
      />
      */}

    </Routes>
  );
}

export default App;
