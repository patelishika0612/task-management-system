import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Dashboard from "./admin/Dashboard";
import Sidebar from "./admin/AdminSidebar";
import Header from "./admin/AdminHeader";
import Adminprofile from "./admin/Profile";
import Login from "./admin/Login";
import Settings from "./admin/Settings";

import ForgotPassword from "./admin/ForgotPassword";
import OTP from "./admin/OTP";
import ResetPassword from "./admin/ResetPassword";
import AdminLogin from "./admin/AdminLogin";

import Department from "./admin/Department";

import Employee from "./admin/Employee";
import Project from "./admin/Project";

import Calendar from "./admin/Calendar";
import Client from "./admin/Client";

import AdminApprovalRequest from "./admin/AdminApprovalRequest";
import AdminReviewRequests from "./admin/AdminReviewRequests";


function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/profile" element={<Adminprofile />} />
      <Route path="/settings" element={<Settings />} />

      <Route path="/forgotpassword" element={<ForgotPassword />} />
      <Route path="/otp" element={<OTP />} />
      <Route path="/resetpassword" element={<ResetPassword />} />
      <Route path="/adminLogin" element={<AdminLogin />} />

      <Route path="/departments" element={<Department />} />

      <Route path="/employees" element={<Employee />} />
      <Route path="/projects" element={<Project />} />

      <Route path="/calendar" element={<Calendar />} />
      <Route path="/clients" element={<Client />} />
      <Route path="/approvalrequests" element={<AdminApprovalRequest />} />
      <Route path="/review-requests" element={<AdminReviewRequests />} />
      <Route
        path="/admin/approval/:token"
        element={<AdminReviewRequests />}
      />
      {/* <Route path="/approvedrequests" element={<AdminApprovalApproved />} /> */}



    </Routes>
  );
}

export default App;
