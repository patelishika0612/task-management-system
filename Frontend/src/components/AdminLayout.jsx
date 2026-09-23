import React from "react";
import Sidebar from "../admin/AdminSidebar";
import Header from "../admin/AdminHeader";

const AdminLayout = ({ children }) => {
  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="main-area">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;