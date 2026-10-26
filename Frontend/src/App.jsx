
import React, { useEffect, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { io } from "socket.io-client";
import "./App.css";

// Admin pages
import Adminprofile from "./admin/Profile";
import Login from "./admin/Login";
import Settings from "./admin/Settings";
import CompanyProfile from "./admin/CompanyProfile";
import SetPassword from "./admin/SetPassword";
import ForgotPassword from "./admin/ForgotPassword";
import OTP from "./admin/OTP";
import ResetPassword from "./admin/ResetPassword";
import AdminLogin from "./admin/AdminLogin";
import CreateProfile from "./admin/CreateProfile";

import Department from "./admin/Department";
import Employee from "./admin/Employee";
import Project from "./admin/Project";
import Task from "./admin/Task";
import Calendar from "./admin/Calendar";
import Client from "./admin/Client";

import AdminApprovalRequest from "./admin/AdminApprovalRequest";
import AdminReviewRequests from "./admin/AdminReviewRequests";
import AdminDashboard from "./admin/AdminDashboard";

import EmployeeDashboard from "./employee/EmployeeDashboard";
import EmployeeProject from "./employee/EmployeeProject";
import EmployeeLayout from "./components/EmployeeLayout";
import AdminLayout from "./components/AdminLayout";
import ChatPage from "./admin/ChatPage";

// Use production backend URL in production.
// Set VITE_API_URL or VITE_API_URL in your frontend environment.
const SOCKET_URL = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000"
).replace(/\/api\/?$/, "").replace(/\/+$/, "");    

// Protected route: admin login required
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("adminToken");
    const storedAdminData = localStorage.getItem("adminData");

    let adminData = null;

    try {
        adminData = storedAdminData
            ? JSON.parse(storedAdminData)
            : null;
    } catch (error) {
        console.error("Invalid adminData in localStorage:", error);
    }

    if (!token || !adminData?.adminId) {
        return <Navigate to="/admin-login" replace />;
    }

    return children;
};

function App() {
    const socketRef = useRef(null);

    useEffect(() => {
        const startAdminSocket = () => {
            const token = localStorage.getItem("adminToken");
            const storedAdminData = localStorage.getItem("adminData");

            let adminData = null;

            try {
                adminData = storedAdminData
                    ? JSON.parse(storedAdminData)
                    : null;
            } catch (error) {
                console.error("Invalid adminData:", error);
            }

            // Do not start socket without an admin session.
            if (!token || !adminData?.adminId) {
                return;
            }

            // Avoid duplicate socket connections.
            if (socketRef.current) {
                return;
            }

            const socket = io(SOCKET_URL, {
                transports: ["websocket", "polling"],
            });

            socketRef.current = socket;

            socket.on("connect", () => {
                console.log("Admin socket connected:", socket.id);

                socket.emit(
                    "admin-authenticated",
                    adminData.adminId
                );
            });

            socket.on("adminDeleted", () => {
                console.warn("Admin deleted. Clearing session.");

                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminData");
                sessionStorage.removeItem("adminData");
                localStorage.removeItem("adminEmail");

                socket.disconnect();
                socketRef.current = null;

                window.location.replace("/admin-login");
            });

            socket.on("connect_error", (error) => {
                console.error(
                    "Socket connection error:",
                    error.message
                );
            });
        };

        // Start socket if an admin is already logged in.
        startAdminSocket();

        // Start socket after login without reloading the app.
        window.addEventListener("admin-login", startAdminSocket);

        return () => {
            window.removeEventListener(
                "admin-login",
                startAdminSocket
            );

            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    return (
        <Routes>
            {/* Public routes */}
            <Route
                path="/admin-login"
                element={<AdminLogin />}
            />

            <Route
                path="/"
                element={<Login />}
            />

            <Route
                path="/set-password"
                element={<SetPassword />}
            />

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
                path="/admin/approval/:token"
                element={<AdminReviewRequests />}
            />

            {/* Profile */}
            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <Adminprofile />
                    </ProtectedRoute>
                }
            />

            {/* Company profile */}
            <Route
                path="/company-profile"
                element={
                    <ProtectedRoute>
                        <CompanyProfile />
                    </ProtectedRoute>
                }
            />

            {/* Settings */}
            <Route
                path="/settings"
                element={
                    <ProtectedRoute>
                        <Settings />
                    </ProtectedRoute>
                }
            />

            {/* Create profile */}
            <Route
                path="/create-profile"
                element={<CreateProfile />}
            />

            {/* Departments */}
            <Route
                path="/departments"
                element={
                    <ProtectedRoute>
                        <Department />
                    </ProtectedRoute>
                }
            />

            {/* Employees */}
            <Route
                path="/employees"
                element={
                    <ProtectedRoute>
                        <Employee />
                    </ProtectedRoute>
                }
            />

            {/* Projects */}
            <Route
                path="/projects"
                element={
                    <ProtectedRoute>
                        <Project />
                    </ProtectedRoute>
                }
            />

            {/* Tasks */}
            <Route
                path="/tasks"
                element={
                    <ProtectedRoute>
                        <Task />
                    </ProtectedRoute>
                }
            />

            {/* Calendar */}
            <Route
                path="/calendar"
                element={
                    <ProtectedRoute>
                        <Calendar />
                    </ProtectedRoute>
                }
            />

            {/* Chat (admin) */}
            <Route
                path="/chat"
                element={
                    <ProtectedRoute>
                        <ChatPage layout={AdminLayout} role="admin" />
                    </ProtectedRoute>
                }
            />

            {/* Chat (employee / HR) */}
            <Route
                path="/employee-chat"
                element={
                    <ProtectedRoute>
                        <ChatPage layout={EmployeeLayout} role="employee" />
                    </ProtectedRoute>
                }
            />

            {/* Clients */}
            <Route
                path="/clients"
                element={
                    <ProtectedRoute>
                        <Client />
                    </ProtectedRoute>
                }
            />

            {/* Approval requests */}
            <Route
                path="/approvalrequests"
                element={<AdminApprovalRequest />}
            />

            {/* Review requests */}
            <Route
                path="/review-requests"
                element={
                    <ProtectedRoute>
                        <AdminReviewRequests />
                    </ProtectedRoute>
                }
            />

            {/* Admin dashboard */}
            <Route
                path="/admindashboard"
                element={
                    <ProtectedRoute>
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />

            {/* Unknown URLs */}
            <Route
                path="*"
                element={<Navigate to="/admin-login" replace />}
            />



            {/* Employee dashboard */}

            <Route
                path="/employeedashboard"
                element={
                    <ProtectedRoute>
                        <EmployeeDashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/employee-projects"
                element={
                    <ProtectedRoute>
                        <EmployeeProject />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/company-profile"
                element={
                    <ProtectedRoute>
                        <CompanyProfile layout={EmployeeLayout} />
                    </ProtectedRoute>
                }
            />

        </Routes>
    );
}

export default App;
