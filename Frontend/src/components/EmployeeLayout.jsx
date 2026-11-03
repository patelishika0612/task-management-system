
import React from "react";
import EmployeeSidebar from "../employee/EmployeeSidebar";
import EmployeeHeader from "../employee/EmployeeHeader";
import { enableEmployeePushNotifications } from "../employeePushNotification";
import Swal from "sweetalert2";
import "./EmployeeLayout.css";

const EmployeeLayout = ({ children }) => {

  const handleEnableNotifications = async () => {
    const result = await enableEmployeePushNotifications();

    if (result.success) {
      Swal.fire({
        icon: "success",
        title: "Notifications Enabled",
        text: result.message,
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Notification Error",
        text: result.message,
      });
    }
  };

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "#f6f8fc"
    }}>
      <EmployeeSidebar />

      <div className="admin-main-area">
        <EmployeeHeader />

        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "10px 20px"
        }}>
          <button
            type="button"
            onClick={handleEnableNotifications}
            style={{
              background: "#bf9058",
              color: "#fff",
              border: "none",
              padding: "10px 18px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Enable Notifications
          </button>
        </div>

        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;