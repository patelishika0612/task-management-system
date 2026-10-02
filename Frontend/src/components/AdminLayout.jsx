import React from "react";
import Sidebar from "../admin/AdminSidebar";
import Header from "../admin/AdminHeader";
import "./AdminLayout.css";

const AdminLayout = ({ children }) => {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f6f8fc" }}>
      <Sidebar />
      <div className="admin-main-area">
        <Header />
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;