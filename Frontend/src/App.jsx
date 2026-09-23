import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Dashboard from "./admin/Dashboard";
import Sidebar from "./admin/AdminSidebar";
import Header from "./admin/AdminHeader";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
