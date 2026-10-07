
import jwt from "jsonwebtoken";
import connection from "../db.js";

const adminAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                code: "ADMIN_AUTH_REQUIRED",
                message: "Admin authentication required."
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (!decoded.adminId) {
            return res.status(401).json({
                success: false,
                code: "ADMIN_SESSION_INVALID",
                message: "Invalid admin session."
            });
        }

        const [admins] = await connection.promise().query(
            `
            SELECT id, email
            FROM admin_login
            WHERE id = ?
            LIMIT 1
            `,
            [decoded.adminId]
        );

        // Admin SQL mathi delete thai gayo
        if (admins.length === 0) {
            return res.status(401).json({
                success: false,
                code: "ADMIN_ACCOUNT_DELETED",
                message: "Admin account no longer exists."
            });
        }

        req.admin = admins[0];

        next();

    } catch (error) {
        console.error(
            "Admin authentication error:",
            error.message
        );

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                code: "ADMIN_SESSION_EXPIRED",
                message: "Admin session expired."
            });
        }

        return res.status(401).json({
            success: false,
            code: "ADMIN_SESSION_INVALID",
            message: "Invalid admin session."
        });
    }
};

export default adminAuth;
