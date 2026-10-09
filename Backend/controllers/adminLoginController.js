import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connection from "../db.js";

// =====================================================
// SET PASSWORD
// POST /api/admin-login/set-password
// =====================================================

const setPassword = async (req, res) => {
    try {
        const {
            email,
            password,
            confirmPassword
        } = req.body;

        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        if (!password || !password.trim()) {
            return res.status(400).json({
                success: false,
                message: "Password is required."
            });
        }

        if (!confirmPassword || !confirmPassword.trim()) {
            return res.status(400).json({
                success: false,
                message: "Confirm password is required."
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and confirm password do not match."
            });
        }

        const adminEmail = email.trim().toLowerCase();

        // ---------------------------------------------
        // CHECK ADMIN ACCOUNT
        // ---------------------------------------------

        const [existingAdmin] =
            await connection.promise().query(
                `
                SELECT id
                FROM admin_login
                WHERE email = ?
                LIMIT 1
                `,
                [adminEmail]
            );

        // ---------------------------------------------
        // HASH PASSWORD
        // ---------------------------------------------

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        // ---------------------------------------------
        // CREATE ADMIN ACCOUNT
        // ---------------------------------------------

        if (existingAdmin.length === 0) {

            const [result] =
                await connection.promise().query(
                    `
                    INSERT INTO admin_login
                    (
                        email,
                        password
                    )
                    VALUES (?, ?)
                    `,
                    [
                        adminEmail,
                        hashedPassword
                    ]
                );

            return res.status(201).json({
                success: true,
                message: "Password created successfully.",
                data: {
                    adminId: result.insertId,
                    email: adminEmail
                }
            });
        }

        // ---------------------------------------------
        // UPDATE PASSWORD
        // ---------------------------------------------

        await connection.promise().query(
            `
            UPDATE admin_login
            SET password = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE email = ?
            `,
            [
                hashedPassword,
                adminEmail
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Password updated successfully.",
            data: {
                adminId: existingAdmin[0].id,
                email: adminEmail
            }
        });

    } catch (error) {

        console.error(
            "Set password error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


// =====================================================
// ADMIN LOGIN
// POST /api/admin-login/login
// =====================================================

const adminLogin = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        if (!password || !password.trim()) {
            return res.status(400).json({
                success: false,
                message: "Password is required."
            });
        }

        const adminEmail =
            email.trim().toLowerCase();

        // ---------------------------------------------
        // FIND ADMIN
        // IMPORTANT:
        // ONLY admin_login TABLE IS USED
        // ---------------------------------------------

        const [admins] =
            await connection.promise().query(
                `
                SELECT
                    id,
                    email,
                    password
                FROM admin_login
                WHERE email = ?
                LIMIT 1
                `,
                [adminEmail]
            );

        // ---------------------------------------------
        // ADMIN NOT FOUND
        // ---------------------------------------------

        if (admins.length === 0) {

            return res.status(401).json({
                success: false,
                code: "ADMIN_NOT_FOUND",
                message:
                    "Admin account not found."
            });
        }

        const admin = admins[0];

        // ---------------------------------------------
        // CHECK PASSWORD
        // ---------------------------------------------

        const isPasswordMatch =
            await bcrypt.compare(
                password,
                admin.password
            );

        if (!isPasswordMatch) {

            return res.status(401).json({
                success: false,
                code: "INVALID_ADMIN_PASSWORD",
                message:
                    "Invalid email or password."
            });
        }

        // ---------------------------------------------
        // CREATE JWT
        // ---------------------------------------------

        const token = jwt.sign(
            {
                adminId: admin.id,
                email: admin.email,
                role: "admin"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        // ---------------------------------------------
        // SUCCESS
        // ---------------------------------------------

        return res.status(200).json({
            success: true,
            message: "Admin login successful.",
            data: {
                adminId: admin.id,
                email: admin.email,
                role: "admin",
                token
            }
        });

    } catch (error) {

        console.error(
            "Admin login error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


export default {
    setPassword,
    adminLogin
};