import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Dashboard from "./admin/Dashboard";
import Sidebar from "./admin/AdminSidebar";
import Header from "./admin/AdminHeader";
import Adminprofile from "./admin/Profile";
import Login from "./admin/Login";
import Settings from "./admin/Settings";
import Department from "./admin/Department";


function App() {
  return (
    <Routes>
         <Route path="/adminLogin" element={<Login />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/profile" element={<Adminprofile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/departments" element={<Department />} />
    </Routes>
  );
}

export default App;
