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
import Calendar from "./admin/Calendar";



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
      <Route path="/calendar" element={<Calendar />} />
   

    </Routes>
  );
}

export default App;
