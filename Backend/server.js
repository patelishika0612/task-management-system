import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

import "./db.js";

// Routes
import departmentRoutes from "./routes/departmentRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import projectMemberRoutes from "./routes/projectMemberRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import adminAccessRequestRoutes from "./routes/adminAccessRequestRoutes.js";
import adminApprovalRequestRoutes from "./routes/adminApprovalRequestRoutes.js";


dotenv.config();

const app = express();

// =====================================================
// __dirname for ES Module
// =====================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================================================
// SECURITY & MIDDLEWARE
// =====================================================

app.use(
    helmet({
        // allow the frontend (different port) to load images from /uploads
        crossOriginResourcePolicy: { policy: "cross-origin" }
    })
);

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// =====================================================
// STATIC UPLOADS
// =====================================================

app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

// =====================================================
// ROUTES
// =====================================================

app.use("/api/departments", departmentRoutes);
app.use("/api/employees",employeeRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/project-members", projectMemberRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/admin-access-requests", adminAccessRequestRoutes);
app.use("/api/admin-approval-requests",adminApprovalRequestRoutes);

// =====================================================
// TEST API
// =====================================================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Task Management API is running"
    });
});

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found"
    });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
    console.error("Server Error:", err);

    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});

// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});