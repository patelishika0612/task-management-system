
import express from "express";
import adminLoginController from "../controllers/adminLoginController.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// Check logged-in admin
router.get(
    "/check",
    adminAuth,
    (req, res) => {
        return res.status(200).json({
            success: true,
            message: "Admin session is valid.",
            data: {
                adminId: req.admin.id,
                email: req.admin.email
            }
        });
    }
);

// Set Password
router.post(
    "/set-password",
    adminLoginController.setPassword
);

// Login
router.post(
    "/login",
    adminLoginController.adminLogin
);

export default router;
