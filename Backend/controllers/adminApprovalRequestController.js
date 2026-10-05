import crypto from "crypto";
import bcrypt from "bcryptjs";

import connection from "../db.js";

import {
    sendApprovalEmail,
    sendApprovalSuccessEmail,
    sendRejectionEmail
} from "../services/emailService.js";


const db = connection.promise();


// =====================================================
// HELPER
// =====================================================

const hashToken = (token) => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};


// =====================================================
// CREATE APPROVAL REQUEST
// =====================================================

const createApproval = async (req, res) => {
    try {
        const { Request_ID } = req.body;


        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!Request_ID) {
            return res.status(400).json({
                success: false,
                message: "Request_ID is required"
            });
        }


        // -------------------------------------------------
        // GET ACCESS REQUEST
        // -------------------------------------------------

        const [requests] = await db.query(`
            SELECT
                r.Request_ID,
                r.Full_Name,
                r.Email,
                r.Phone,
                r.DOB,
                r.employee_code,
                r.Department_ID,
                r.Joining_Date,
                r.Reason,
                r.Request_Status,
                d.department_name
            FROM admin_access_requests r
            LEFT JOIN departments d
                ON r.Department_ID = d.department_id
            WHERE r.Request_ID = ?
        `, [Request_ID]);


        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Access request not found"
            });
        }


        const request = requests[0];


        // -------------------------------------------------
        // REQUEST STATUS CHECK
        // -------------------------------------------------

        if (request.Request_Status !== "Pending") {
            return res.status(400).json({
                success: false,
                message:
                    `Request is already ${request.Request_Status}`
            });
        }


        // -------------------------------------------------
        // CHECK EXISTING APPROVAL
        // -------------------------------------------------

        const [existingApproval] = await db.query(`
            SELECT
                Approval_ID,
                Status,
                Expires_At
            FROM admin_approval_requests
            WHERE Request_ID = ?
            ORDER BY Approval_ID DESC
            LIMIT 1
        `, [Request_ID]);


        // -------------------------------------------------
        // IF PENDING APPROVAL ALREADY EXISTS
        // -------------------------------------------------

        if (
            existingApproval.length > 0 &&
            existingApproval[0].Status === "Pending"
        ) {
            return res.status(200).json({
                success: true,
                message: "Approval request already exists",
                data: {
                    Approval_ID:
                        existingApproval[0].Approval_ID
                }
            });
        }


        // -------------------------------------------------
        // CREATE RAW TOKEN
        // -------------------------------------------------

        const approvalToken =
            crypto.randomBytes(32).toString("hex");


        // -------------------------------------------------
        // HASH TOKEN
        // -------------------------------------------------

        const approvalTokenHash =
            hashToken(approvalToken);


        // -------------------------------------------------
        // TOKEN EXPIRY - 1 HOUR
        // -------------------------------------------------

        const expiresAt =
            new Date(Date.now() + 60 * 60 * 1000);


        // -------------------------------------------------
        // INSERT APPROVAL
        // -------------------------------------------------

        const [result] = await db.query(`
            INSERT INTO admin_approval_requests
            (
                Request_ID,
                Approval_Token_Hash,
                Expires_At,
                Status
            )
            VALUES (?, ?, ?, 'Pending')
        `, [
            Request_ID,
            approvalTokenHash,
            expiresAt
        ]);


        // -------------------------------------------------
        // APPROVAL LINK
        // -------------------------------------------------

        const frontendUrl =
            process.env.FRONTEND_URL ||
            "http://localhost:5173";


        const approvalLink =
            `${frontendUrl}/admin/approval/${approvalToken}`;


        // -------------------------------------------------
        // SEND EMAIL TO BOSS
        // -------------------------------------------------

        await sendApprovalEmail({
            to: process.env.BOSS_EMAIL,
            employeeName: request.Full_Name,
            employeeCode: request.employee_code,
            departmentName: request.department_name,
            email: request.Email,
            joiningDate: request.Joining_Date,
            reason: request.Reason,
            approvalLink
        });


        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        res.status(201).json({
            success: true,
            message:
                "Approval request created and email sent successfully",
            data: {
                Approval_ID: result.insertId,
                Request_ID: request.Request_ID,
                Status: "Pending",
                Expires_At: expiresAt
            }
        });

    } catch (error) {
        console.error(
            "Create approval request error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to create approval request",
            error: error.message
        });
    }
};


// =====================================================
// GET APPROVAL BY TOKEN
// =====================================================

const getApprovalByToken = async (req, res) => {
    try {
        const { token } = req.params;


        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Approval token is required"
            });
        }


        const tokenHash = hashToken(token);


        const [rows] = await db.query(`
            SELECT
                a.Approval_ID,
                a.Request_ID,
                a.Status,
                a.Expires_At,

                r.Full_Name,
                r.Email,
                r.Phone,
                r.DOB,
                r.employee_code,
                r.Department_ID,
                r.Joining_Date,
                r.Reason,

                d.department_name

            FROM admin_approval_requests a

            INNER JOIN admin_access_requests r
                ON a.Request_ID = r.Request_ID

            LEFT JOIN departments d
                ON r.Department_ID = d.department_id

            WHERE a.Approval_Token_Hash = ?

            LIMIT 1
        `, [tokenHash]);


        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Invalid approval token"
            });
        }


        const approval = rows[0];


        // -------------------------------------------------
        // CHECK EXPIRY
        // -------------------------------------------------

        if (
            new Date(approval.Expires_At).getTime() <
            Date.now()
        ) {

            if (approval.Status === "Pending") {
                await db.query(`
                    UPDATE admin_approval_requests
                    SET Status = 'Expired'
                    WHERE Approval_ID = ?
                `, [approval.Approval_ID]);
            }


            return res.status(410).json({
                success: false,
                message: "Approval link has expired"
            });
        }


        // -------------------------------------------------
        // CHECK STATUS
        // -------------------------------------------------

        if (approval.Status !== "Pending") {
            return res.status(400).json({
                success: false,
                message:
                    `This approval request is already ${approval.Status}`
            });
        }


        res.status(200).json({
            success: true,
            data: approval
        });

    } catch (error) {
        console.error(
            "Get approval by token error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to get approval request",
            error: error.message
        });
    }
};


// =====================================================
// GET APPROVAL BY ID
// =====================================================

const getApprovalById = async (req, res) => {
    try {
        const { id } = req.params;


        const [rows] = await db.query(`
            SELECT
                a.Approval_ID,
                a.Request_ID,
                a.Status,
                a.Expires_At,
                a.Approved_By,
                a.Approved_At,
                a.Rejected_By,
                a.Rejected_At,
                a.Rejection_Reason,
                a.Created_At,

                r.Full_Name,
                r.Email,
                r.employee_code,
                r.Department_ID,
                r.Joining_Date,
                r.Reason,

                d.department_name

            FROM admin_approval_requests a

            INNER JOIN admin_access_requests r
                ON a.Request_ID = r.Request_ID

            LEFT JOIN departments d
                ON r.Department_ID = d.department_id

            WHERE a.Approval_ID = ?
        `, [id]);


        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Approval request not found"
            });
        }


        res.status(200).json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error(
            "Get approval by ID error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to get approval request",
            error: error.message
        });
    }
};


// =====================================================
// GET ALL APPROVALS
// =====================================================

const getAllApprovals = async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT
                a.Approval_ID,
                a.Request_ID,
                a.Status,
                a.Expires_At,
                a.Approved_By,
                a.Approved_At,
                a.Rejected_By,
                a.Rejected_At,
                a.Rejection_Reason,
                a.Created_At,

                r.Full_Name,
                r.Email,
                r.Phone,
                r.employee_code,
                r.Department_ID,
                r.Joining_Date,
                r.Reason,

                d.department_name

            FROM admin_approval_requests a

            INNER JOIN admin_access_requests r
                ON a.Request_ID = r.Request_ID

            LEFT JOIN departments d
                ON r.Department_ID = d.department_id

            ORDER BY a.Created_At DESC
        `);


        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error(
            "Get all approvals error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch approval requests"
        });
    }
};


// =====================================================
// APPROVE BY TOKEN
// =====================================================

const approveByToken = async (req, res) => {
    const dbConnection = await connection.promise().getConnection();

    try {
        const { token } = req.params;


        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Approval token is required"
            });
        }


        const tokenHash = hashToken(token);


        await dbConnection.beginTransaction();


        // =================================================
        // GET APPROVAL + REQUEST
        // =================================================

        const [rows] = await dbConnection.query(`
            SELECT
                a.Approval_ID,
                a.Request_ID,
                a.Status,
                a.Expires_At,

                r.Full_Name,
                r.Email,
                r.Phone,
                r.DOB,
                r.employee_code,
                r.Department_ID,
                r.Joining_Date,
                r.Reason,

                d.department_name

            FROM admin_approval_requests a

            INNER JOIN admin_access_requests r
                ON a.Request_ID = r.Request_ID

            LEFT JOIN departments d
                ON r.Department_ID = d.department_id

            WHERE a.Approval_Token_Hash = ?

            FOR UPDATE
        `, [tokenHash]);


        if (rows.length === 0) {
            await dbConnection.rollback();

            return res.status(404).json({
                success: false,
                message: "Invalid approval token"
            });
        }


        const approval = rows[0];


        // =================================================
        // EXPIRY
        // =================================================

        if (
            new Date(approval.Expires_At).getTime() <
            Date.now()
        ) {

            await dbConnection.query(`
                UPDATE admin_approval_requests
                SET Status = 'Expired'
                WHERE Approval_ID = ?
            `, [approval.Approval_ID]);


            await dbConnection.rollback();

            return res.status(410).json({
                success: false,
                message: "Approval link has expired"
            });
        }


        // =================================================
        // STATUS
        // =================================================

        if (approval.Status !== "Pending") {
            await dbConnection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    `This request is already ${approval.Status}`
            });
        }


        // =================================================
        // CHECK EMPLOYEE CODE
        // =================================================

        const [existingEmployees] =
            await dbConnection.query(`
                SELECT
                    emp_id,
                    employee_code
                FROM employe
                WHERE employee_code = ?
                LIMIT 1
            `, [approval.employee_code]);


        if (existingEmployees.length > 0) {
            await dbConnection.rollback();

            return res.status(409).json({
                success: false,
                message:
                    "An employee with this Employee Code already exists."
            });
        }


        // =================================================
        // CREATE TEMPORARY PASSWORD
        // =================================================

        const temporaryPassword =
            crypto.randomBytes(12).toString("base64url");


        const hashedPassword =
            await bcrypt.hash(temporaryPassword, 10);


        // =================================================
        // CREATE EMPLOYEE
        // =================================================

        const [employeeResult] =
            await dbConnection.query(`
                INSERT INTO employe
                (
                    emp_name,
                    email,
                    phone,
                    department_id,
                    password,
                    date_of_join,
                    image,
                    status,
                    employee_code
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
            `, [
                approval.Full_Name,
                approval.Email,
                approval.Phone,
                approval.Department_ID,
                hashedPassword,
                approval.Joining_Date,
                null,
                approval.employee_code
            ]);


        const employeeId =
            employeeResult.insertId;


        // =================================================
        // UPDATE ACCESS REQUEST
        // =================================================

        await dbConnection.query(`
            UPDATE admin_access_requests
            SET Request_Status = 'Approved'
            WHERE Request_ID = ?
        `, [approval.Request_ID]);


        // =================================================
        // UPDATE APPROVAL
        // =================================================

        await dbConnection.query(`
            UPDATE admin_approval_requests
            SET
                Status = 'Approved',
                Approved_At = NOW()
            WHERE Approval_ID = ?
        `, [approval.Approval_ID]);


        await dbConnection.commit();


        // =================================================
        // SEND SUCCESS EMAIL
        // =================================================

        try {
            await sendApprovalSuccessEmail({
                to: approval.Email,
                employeeName: approval.Full_Name,
                employeeCode: approval.employee_code,
                departmentName: approval.department_name
            });
        } catch (emailError) {
            console.error(
                "Approval success email failed:",
                emailError
            );
        }


        // =================================================
        // RESPONSE
        // =================================================

        res.status(200).json({
            success: true,
            message:
                "Request approved and employee account created successfully",
            data: {
                Request_ID: approval.Request_ID,
                Approval_ID: approval.Approval_ID,
                Employee_ID: employeeId,
                Employee_Code: approval.employee_code
            }
        });

    } catch (error) {

        try {
            await dbConnection.rollback();
        } catch {}

        console.error(
            "Approve request error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to approve request",
            error: error.message
        });

    } finally {
        dbConnection.release();
    }
};


// =====================================================
// REJECT BY TOKEN
// =====================================================

const rejectByToken = async (req, res) => {
    const dbConnection = await connection.promise().getConnection();

    try {
        const { token } = req.params;

        const {
            rejectionReason
        } = req.body;


        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Approval token is required"
            });
        }


        const tokenHash = hashToken(token);


        await dbConnection.beginTransaction();


        // =================================================
        // GET REQUEST
        // =================================================

        const [rows] = await dbConnection.query(`
            SELECT
                a.Approval_ID,
                a.Request_ID,
                a.Status,
                a.Expires_At,

                r.Full_Name,
                r.Email,
                r.employee_code,
                r.Department_ID,

                d.department_name

            FROM admin_approval_requests a

            INNER JOIN admin_access_requests r
                ON a.Request_ID = r.Request_ID

            LEFT JOIN departments d
                ON r.Department_ID = d.department_id

            WHERE a.Approval_Token_Hash = ?

            FOR UPDATE
        `, [tokenHash]);


        if (rows.length === 0) {
            await dbConnection.rollback();

            return res.status(404).json({
                success: false,
                message: "Invalid approval token"
            });
        }


        const approval = rows[0];


        // =================================================
        // EXPIRY
        // =================================================

        if (
            new Date(approval.Expires_At).getTime() <
            Date.now()
        ) {

            await dbConnection.query(`
                UPDATE admin_approval_requests
                SET Status = 'Expired'
                WHERE Approval_ID = ?
            `, [approval.Approval_ID]);


            await dbConnection.rollback();

            return res.status(410).json({
                success: false,
                message: "Approval link has expired"
            });
        }


        // =================================================
        // STATUS
        // =================================================

        if (approval.Status !== "Pending") {
            await dbConnection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    `This request is already ${approval.Status}`
            });
        }


        // =================================================
        // UPDATE ACCESS REQUEST
        // =================================================

        await dbConnection.query(`
            UPDATE admin_access_requests
            SET
                Request_Status = 'Rejected'
            WHERE Request_ID = ?
        `, [approval.Request_ID]);


        // =================================================
        // UPDATE APPROVAL
        // =================================================

        await dbConnection.query(`
            UPDATE admin_approval_requests
            SET
                Status = 'Rejected',
                Rejected_At = NOW(),
                Rejection_Reason = ?
            WHERE Approval_ID = ?
        `, [
            rejectionReason || null,
            approval.Approval_ID
        ]);


        await dbConnection.commit();


        // =================================================
        // SEND REJECTION EMAIL
        // =================================================

        try {
            await sendRejectionEmail({
                to: approval.Email,
                employeeName: approval.Full_Name,
                employeeCode: approval.employee_code,
                departmentName: approval.department_name,
                rejectionReason:
                    rejectionReason ||
                    "No reason provided."
            });
        } catch (emailError) {
            console.error(
                "Rejection email failed:",
                emailError
            );
        }


        // =================================================
        // RESPONSE
        // =================================================

        res.status(200).json({
            success: true,
            message:
                "Request rejected successfully"
        });

    } catch (error) {

        try {
            await dbConnection.rollback();
        } catch {}

        console.error(
            "Reject request error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to reject request",
            error: error.message
        });

    } finally {
        dbConnection.release();
    }
};

// =====================================================
// APPROVE BY REQUEST ID
// =====================================================

const approveByRequestId = async (req, res) => {
    const dbConnection = connection.promise();

    try {
        const { requestId } = req.params;

        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: "Request ID is required"
            });
        }

        await dbConnection.beginTransaction();

        // =================================================
        // GET PENDING APPROVAL + REQUEST
        // =================================================

        const [rows] = await dbConnection.query(`
            SELECT
                a.Approval_ID,
                a.Request_ID,
                a.Status,
                a.Expires_At,

                r.Full_Name,
                r.Email,
                r.Phone,
                r.DOB,
                r.employee_code,
                r.Department_ID,
                r.Joining_Date,
                r.Reason,
                r.Request_Status,

                d.department_name

            FROM admin_approval_requests a

            INNER JOIN admin_access_requests r
                ON a.Request_ID = r.Request_ID

            LEFT JOIN departments d
                ON r.Department_ID = d.department_id

            WHERE a.Request_ID = ?
            AND a.Status = 'Pending'

            ORDER BY a.Approval_ID DESC
            LIMIT 1

            FOR UPDATE
        `, [requestId]);

        if (rows.length === 0) {
            await dbConnection.rollback();

            return res.status(404).json({
                success: false,
                message:
                    "Pending approval request not found."
            });
        }

        const approval = rows[0];

        // =================================================
        // EXPIRY CHECK
        // =================================================

        if (
            new Date(approval.Expires_At).getTime() <
            Date.now()
        ) {
            await dbConnection.query(`
                UPDATE admin_approval_requests
                SET Status = 'Expired'
                WHERE Approval_ID = ?
            `, [approval.Approval_ID]);

            await dbConnection.query(`
                UPDATE admin_access_requests
                SET Request_Status = 'Expired'
                WHERE Request_ID = ?
            `, [approval.Request_ID]);

            await dbConnection.commit();

            return res.status(410).json({
                success: false,
                message: "Approval request has expired."
            });
        }

        // =================================================
        // CHECK EMPLOYEE CODE
        // =================================================

        const [existingEmployees] =
            await dbConnection.query(`
                SELECT emp_id
                FROM employe
                WHERE employee_code = ?
                LIMIT 1
            `, [approval.employee_code]);

        if (existingEmployees.length > 0) {
            await dbConnection.rollback();

            return res.status(409).json({
                success: false,
                message:
                    "An employee with this Employee Code already exists."
            });
        }

        // =================================================
        // TEMPORARY PASSWORD
        // =================================================

        const temporaryPassword =
            crypto.randomBytes(12).toString("base64url");

        const hashedPassword =
            await bcrypt.hash(
                temporaryPassword,
                10
            );

        // =================================================
        // CREATE EMPLOYEE
        // =================================================

        const [employeeResult] =
            await dbConnection.query(`
                INSERT INTO employe
                (
                    emp_name,
                    email,
                    phone,
                    department_id,
                    password,
                    date_of_join,
                    image,
                    status,
                    employee_code
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
            `, [
                approval.Full_Name,
                approval.Email,
                approval.Phone,
                approval.Department_ID,
                hashedPassword,
                approval.Joining_Date,
                null,
                approval.employee_code
            ]);

        const employeeId =
            employeeResult.insertId;

        // =================================================
        // UPDATE ACCESS REQUEST
        // =================================================

        await dbConnection.query(`
            UPDATE admin_access_requests
            SET Request_Status = 'Approved'
            WHERE Request_ID = ?
        `, [approval.Request_ID]);

        // =================================================
        // UPDATE APPROVAL REQUEST
        // =================================================

        await dbConnection.query(`
            UPDATE admin_approval_requests
            SET
                Status = 'Approved',
                Approved_At = NOW()
            WHERE Approval_ID = ?
        `, [approval.Approval_ID]);

        await dbConnection.commit();

        // =================================================
        // SEND SUCCESS EMAIL
        // =================================================

        try {
            await sendApprovalSuccessEmail({
                to: approval.Email,
                employeeName: approval.Full_Name,
                employeeCode: approval.employee_code,
                departmentName:
                    approval.department_name
            });
        } catch (emailError) {
            console.error(
                "Approval success email failed:",
                emailError
            );
        }

        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({
            success: true,
            message:
                "Request approved and employee account created successfully.",
            data: {
                Request_ID: approval.Request_ID,
                Approval_ID: approval.Approval_ID,
                Employee_ID: employeeId,
                Employee_Code:
                    approval.employee_code
            }
        });

    } catch (error) {

        try {
            await dbConnection.rollback();
        } catch {}

        console.error(
            "Approve by request ID error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to approve request.",
            error: error.message
        });

    } 
};


// =====================================================
// REJECT BY REQUEST ID
// =====================================================

const rejectByRequestId = async (req, res) => {
   const dbConnection = connection.promise();

    try {
        const { requestId } = req.params;

        const {
            rejectionReason
        } = req.body;

        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: "Request ID is required"
            });
        }

        if (
            !rejectionReason ||
            !rejectionReason.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Rejection reason is required."
            });
        }

        await dbConnection.beginTransaction();

        // =================================================
        // GET PENDING APPROVAL
        // =================================================

        const [rows] =
            await dbConnection.query(`
                SELECT
                    a.Approval_ID,
                    a.Request_ID,
                    a.Status,
                    a.Expires_At,

                    r.Full_Name,
                    r.Email,
                    r.employee_code,
                    r.Department_ID,

                    d.department_name

                FROM admin_approval_requests a

                INNER JOIN admin_access_requests r
                    ON a.Request_ID = r.Request_ID

                LEFT JOIN departments d
                    ON r.Department_ID =
                       d.department_id

                WHERE a.Request_ID = ?
                AND a.Status = 'Pending'

                ORDER BY a.Approval_ID DESC
                LIMIT 1

                FOR UPDATE
            `, [requestId]);

        if (rows.length === 0) {
            await dbConnection.rollback();

            return res.status(404).json({
                success: false,
                message:
                    "Pending approval request not found."
            });
        }

        const approval = rows[0];

        // =================================================
        // EXPIRY
        // =================================================

        if (
            new Date(approval.Expires_At).getTime() <
            Date.now()
        ) {
            await dbConnection.query(`
                UPDATE admin_approval_requests
                SET Status = 'Expired'
                WHERE Approval_ID = ?
            `, [approval.Approval_ID]);

            await dbConnection.query(`
                UPDATE admin_access_requests
                SET Request_Status = 'Expired'
                WHERE Request_ID = ?
            `, [approval.Request_ID]);

            await dbConnection.commit();

            return res.status(410).json({
                success: false,
                message:
                    "Approval request has expired."
            });
        }

        // =================================================
        // UPDATE ACCESS REQUEST
        // =================================================

        await dbConnection.query(`
            UPDATE admin_access_requests
            SET Request_Status = 'Rejected'
            WHERE Request_ID = ?
        `, [approval.Request_ID]);

        // =================================================
        // UPDATE APPROVAL
        // =================================================

        await dbConnection.query(`
            UPDATE admin_approval_requests
            SET
                Status = 'Rejected',
                Rejected_At = NOW(),
                Rejection_Reason = ?
            WHERE Approval_ID = ?
        `, [
            rejectionReason.trim(),
            approval.Approval_ID
        ]);

        await dbConnection.commit();

        // =================================================
        // SEND REJECTION EMAIL
        // =================================================

        try {
            await sendRejectionEmail({
                to: approval.Email,
                employeeName: approval.Full_Name,
                employeeCode:
                    approval.employee_code,
                departmentName:
                    approval.department_name,
                rejectionReason:
                    rejectionReason.trim()
            });
        } catch (emailError) {
            console.error(
                "Rejection email failed:",
                emailError
            );
        }

        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({
            success: true,
            message:
                "Request rejected successfully."
        });

    } catch (error) {

        try {
            await dbConnection.rollback();
        } catch {}

        console.error(
            "Reject by request ID error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to reject request.",
            error: error.message
        });

    } 
};

// =====================================================
// DELETE APPROVAL
// =====================================================

const deleteApproval = async (req, res) => {
    try {
        const { id } = req.params;


        const [result] = await db.query(`
            DELETE FROM admin_approval_requests
            WHERE Approval_ID = ?
        `, [id]);


        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Approval request not found"
            });
        }


        res.status(200).json({
            success: true,
            message:
                "Approval request deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete approval error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to delete approval request",
            error: error.message
        });
    }
};


// =====================================================
// EXPORT
// =====================================================

export default {
    getAllApprovals,
    getApprovalById,
    getApprovalByToken,
    createApproval,

    approveByToken,
    rejectByToken,

    approveByRequestId,
    rejectByRequestId,

    deleteApproval
};