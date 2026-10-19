import React, { useEffect, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { io } from "socket.io-client";
import "./App.css";

// import Dashboard from "./admin/Dashboard";
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
import Task from "./admin/Task";
import Calendar from "./admin/Calendar";
import Client from "./admin/Client";

import AdminApprovalRequest from "./admin/AdminApprovalRequest";
import AdminReviewRequests from "./admin/AdminReviewRequests";
import AdminDashboard from "./admin/AdminDashboard";

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
        console.error("adminData is not valid JSON:", error);
    }

    console.log("Current path:", window.location.pathname);
    console.log("Token exists:", Boolean(token));
    console.log("Admin data:", adminData);

    if (!token || !adminData?.adminId) {
        console.warn("ProtectedRoute failed. Redirecting to admin login.");
        return <Navigate to="/admin-login" replace />;
    }

    return children;
};



function App() {
    const socketRef = useRef(null);

    useEffect(() => {
        const startAdminSocket = () => {
            const token = localStorage.getItem("adminToken");
            const adminData = JSON.parse(
                localStorage.getItem("adminData") || "null"
            );

            if (!token || !adminData?.adminId) return;
            if (socketRef.current) return;

            const socket = io("http://localhost:5000");
            socketRef.current = socket;

            socket.on("connect", () => {
                socket.emit(
                    "admin-authenticated",
                    adminData.adminId
                );
            });

            socket.on("adminDeleted", () => {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminData");
                localStorage.removeItem("adminEmail");

                socket.disconnect();
                socketRef.current = null;

                window.location.replace("/admin-login");
                 console.log("adminDeleted event received");
            });

            socket.on("connect_error", (error) => {
                console.error("Socket connection error:", error.message);
            });
        };

        startAdminSocket();

        // Start socket after admin logs in without reloading App
        window.addEventListener("admin-login", startAdminSocket);

        return () => {
            window.removeEventListener("admin-login", startAdminSocket);
            socketRef.current?.disconnect();
            socketRef.current = null;
        };
    }, []);

    return (
        <Routes>
            {/* Public routes */}
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/" element={<Login />} />
            <Route path="/set-password" element={<SetPassword />} />
            <Route path="/forgotpassword" element={<ForgotPassword />} />
            <Route path="/otp" element={<OTP />} />
            <Route path="/resetpassword" element={<ResetPassword />} />

            {/* Approval link can be opened from email */}
            <Route
                path="/admin/approval/:token"
                element={<AdminReviewRequests />}
            />

            

            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <Adminprofile />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/settings"
                element={
                    <ProtectedRoute>
                        <Settings />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/create-profile"
                element={
                    
                        <CreateProfile />
                 
                }
            />

            <Route
                path="/departments"
                element={
                    <ProtectedRoute>
                        <Department />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/employees"
                element={
                    <ProtectedRoute>
                        <Employee />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/projects"
                element={
                    <ProtectedRoute>
                        <Project />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/tasks"
                element={
                    <ProtectedRoute>
                        <Task />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/calendar"
                element={
                    <ProtectedRoute>
                        <Calendar />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/clients"
                element={
                    <ProtectedRoute>
                        <Client />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/approvalrequests"
                element={
                   
                        <AdminApprovalRequest />
                  
                }
            />

            <Route
                path="/review-requests"
                element={
                    <ProtectedRoute>
                        <AdminReviewRequests />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admindashboard"
                element={
                    <ProtectedRoute>
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />

            {/* Every unknown URL redirects to admin login */}
            <Route path="*" element={<Navigate to="/admin-login" replace />} />
        </Routes>
    );
}

export default App;