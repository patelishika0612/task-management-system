import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import connection from "./db.js";
// import "./db.js";

// Routes
import departmentRoutes from "./routes/departmentRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import projectMemberRoutes from "./routes/projectMemberRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import adminAccessRequestRoutes from "./routes/adminAccessRequestRoutes.js";
import adminApprovalRequestRoutes from "./routes/adminApprovalRequestRoutes.js";
import adminLoginRoutes from "./routes/adminLoginRoutes.js";

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
app.use(
    "/api/admin-login",
    adminLoginRoutes
);

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
});// =====================================================
// START HTTP SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// =====================================================
// SOCKET.IO
// =====================================================

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// =====================================================
// CONNECTED ADMINS
// =====================================================

io.on("connection", (socket) => {

    console.log(
        "Admin connected:",
        socket.id
    );

    socket.on("admin-authenticated", async (adminId) => {

        try {

            const [admins] =
                await connection.promise().query(
                    `
                    SELECT id
                    FROM admin_login
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [adminId]
                );

            if (admins.length === 0) {

                console.log(
                    `❌ Admin ${adminId} does not exist`
                );

                socket.emit(
                    "adminDeleted",
                    {
                        adminId: Number(adminId),
                        message:
                            "Your admin account no longer exists."
                    }
                );

                return;
            }

            socket.join(`admin-${adminId}`);

            console.log(
                `Admin ${adminId} connected`
            );

        } catch (error) {

            console.error(
                "Admin socket authentication error:",
                error.message
            );
        }
    });

    socket.on("disconnect", () => {

        console.log(
            "Admin disconnected:",
            socket.id
        );

    });
});

// =====================================================
// ADMIN DATABASE WATCHER
// =====================================================
// =====================================================
// ADMIN DATABASE WATCHER
// =====================================================

let previousAdmins = new Set();
let isAdminWatcherInitialized = false;

const checkDeletedAdmins = async () => {
    try {
        const [admins] = await connection.promise().query(
            `
            SELECT id
            FROM admin_login
            `
        );

        const currentAdmins = new Set(
            admins.map((admin) => String(admin.id))
        );

        // First database check
        if (!isAdminWatcherInitialized) {
            previousAdmins = currentAdmins;
            isAdminWatcherInitialized = true;

            console.log(
                "✅ Admin watcher initialized:",
                [...currentAdmins]
            );

            return;
        }

        // Check deleted admins
        for (const adminId of previousAdmins) {

            if (!currentAdmins.has(adminId)) {

                console.log(
                    `❌ Admin ${adminId} deleted`
                );

                io.to(`admin-${adminId}`).emit(
                    "adminDeleted",
                    {
                        adminId: Number(adminId),
                        message:
                            "Your admin account has been deleted."
                    }
                );
            }
        }

        // Update admin list
        previousAdmins = currentAdmins;

    } catch (error) {
        console.error(
            "Admin watcher error:",
            error.message
        );
    }
};

setInterval(() => {
    checkDeletedAdmins();
}, 1000);
// =====================================================
// START SERVER
// =====================================================

server.listen(PORT, () => {
    console.log(
        `🚀 Server running on http://localhost:${PORT}`
    );
});