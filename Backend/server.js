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

app.use(helmet());

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

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

app.use("/api/employees", employeeRoutes);



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