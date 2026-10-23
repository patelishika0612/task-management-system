import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import connection from "./db.js";

import departmentRoutes from "./routes/departmentRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import projectMemberRoutes from "./routes/projectMemberRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import adminAccessRequestRoutes from "./routes/adminAccessRequestRoutes.js";
import adminApprovalRequestRoutes from "./routes/adminApprovalRequestRoutes.js";
import adminLoginRoutes from "./routes/adminLoginRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import directChatRoutes from "./routes/directChat.js";

dotenv.config();

const app = express();

// =====================================================
// DIRNAME FOR ES MODULE
// =====================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================================================
// ALLOWED FRONTEND ORIGINS
// =====================================================

const allowedOrigins = [
    "http://localhost:5173",
    "http://task.dnsoftech.in",
    "https://task.dnsoftech.in",
];

// =====================================================
// SECURITY MIDDLEWARE
// =====================================================

app.use(
    helmet({
        crossOriginResourcePolicy: {
            policy: "cross-origin",
        },
    })
);

// =====================================================
// CORS
// =====================================================

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests without an Origin header,
            // such as server-to-server and some API tools.
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error("CORS policy: Origin not allowed")
            );
        },
        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],
    })
);

// =====================================================
// BODY PARSERS
// =====================================================

app.use(express.json({ limit: "5mb" }));

app.use(
    express.urlencoded({
        extended: true,
        limit: "5mb",
    })
);

// =====================================================
// STATIC UPLOADS
// =====================================================

app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

// =====================================================
// API ROUTES
// =====================================================

app.use("/api/departments", (req, res, next) => {
    console.log("Departments request received");
    next();
}, departmentRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/project-members", projectMemberRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/clients", clientRoutes);

app.use(
    "/api/admin-access-requests",
    adminAccessRequestRoutes
);

app.use(
    "/api/admin-approval-requests",
    adminApprovalRequestRoutes
);

app.use("/api/admin-login", adminLoginRoutes);

app.use("/api/calendar", calendarRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/chat", directChatRoutes);

// =====================================================
// TEST API
// =====================================================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Task Management API is running",
    });
});

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found",
    });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
    if (err.message?.startsWith("CORS policy:")) {
        return res.status(403).json({
            success: false,
            message: "Origin not allowed",
        });
    }

    console.error("Server Error:", err);

    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
});

// =====================================================
// CREATE HTTP SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// =====================================================
// SOCKET.IO
// =====================================================

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
    },
});

app.set("io", io);

// =====================================================
// CONNECTED ADMINS
// =====================================================

io.on("connection", (socket) => {
    console.log("Admin socket connected:", socket.id);

    socket.on("admin-authenticated", async (adminId) => {
        try {
            const [admins] = await connection.promise().query(
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
                    `Admin ${adminId} does not exist`
                );

                socket.emit("adminDeleted", {
                    adminId: Number(adminId),
                    message:
                        "Your admin account no longer exists.",
                });

                return;
            }

            socket.join(`admin-${adminId}`);

            console.log(`Admin ${adminId} connected`);
        } catch (error) {
            console.error(
                "Admin socket authentication error:",
                error.message
            );
        }
    });

    socket.on("disconnect", () => {
        console.log("Admin socket disconnected:", socket.id);
    });

    // =====================================================
    // DIRECT CHAT SOCKET EVENTS
    // =====================================================

    socket.on("chat:join", async (data, callback = () => { }) => {
        try {
            const conversationId = Number(data?.conversationId);

            if (!Number.isInteger(conversationId) || conversationId <= 0) {
                return callback({
                    ok: false,
                    message: "Invalid conversation ID",
                });
            }

            // TODO: અહીં તમારા actual logged-in user ની
            // identity verify કરીને membership ચકાસવી જરૂરી છે.
            // માત્ર client દ્વારા મોકલેલી user ID પર વિશ્વાસ ન કરવો.

            const [members] = await connection.promise().query(
                `
            SELECT user_id
            FROM chat_conversation_members
            WHERE conversation_id = ?
            `,
                [conversationId]
            );

            // નોંધ: હાલના Admin Socket માં socket.user નથી.
            // નીચેનું membership authorization જોડવા માટે
            // authenticated user ID server-side પર ઉપલબ્ધ હોવી જોઈએ.

            if (!members.length) {
                return callback({
                    ok: false,
                    message: "Conversation not found",
                });
            }

            socket.join(`conversation:${conversationId}`);

            callback({ ok: true });
        } catch (error) {
            console.error("Chat socket join error:", error);

            callback({
                ok: false,
                message: "Unable to join conversation",
            });
        }
    });

});

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

        // Initialize the first database snapshot
        if (!isAdminWatcherInitialized) {
            previousAdmins = currentAdmins;
            isAdminWatcherInitialized = true;

            console.log("Admin watcher initialized");

            return;
        }

        // Notify admins who have been deleted
        for (const adminId of previousAdmins) {
            if (!currentAdmins.has(adminId)) {
                console.log(`Admin ${adminId} deleted`);

                io.to(`admin-${adminId}`).emit(
                    "adminDeleted",
                    {
                        adminId: Number(adminId),
                        message:
                            "Your admin account has been deleted.",
                    }
                );
            }
        }

        previousAdmins = currentAdmins;
    } catch (error) {
        console.error(
            "Admin watcher error:",
            error.message
        );
    }
};

// Check for deleted admins every 5 seconds
const watcherInterval = setInterval(
    checkDeletedAdmins,
    5000
);

// =====================================================
// START SERVER
// =====================================================

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================

const shutdown = () => {
    clearInterval(watcherInterval);

    server.close(() => {
        console.log("HTTP server closed");

        connection.end((error) => {
            if (error) {
                console.error("Database pool close error:", error.message);
            }

            process.exit(error ? 1 : 0);
        });
    });
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);