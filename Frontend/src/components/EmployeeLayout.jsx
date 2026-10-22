import React from "react";
import EmployeeSidebar from "../employee/EmployeeSidebar";
import EmployeeHeader from "../employee/EmployeeHeader";
import "./EmployeeLayout.css";

const EmployeeLayout = ({ children }) => {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f6f8fc" }}>
      <EmployeeSidebar />
      <div className="admin-main-area">
        <EmployeeHeader />
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;