import crypto from "crypto";
import connection from "../db.js";

const db = connection.promise();

// =====================================================
// GET ALL APPROVAL REQUESTS
// =====================================================

const getAllApprovals = async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT
                aar.Approval_ID,
                aar.Request_ID,
                aar.Approval_Token_Hash,
                aar.Expires_At,
                aar.Status,

                aar.Approved_By,
                ae.emp_name AS Approved_By_Name,
                aar.Approved_At,

                aar.Rejected_By,
                re.emp_name AS Rejected_By_Name,
                aar.Rejected_At,

                aar.Rejection_Reason,
                aar.Created_At

            FROM admin_approval_requests aar

            LEFT JOIN employe ae
                ON aar.Approved_By = ae.emp_id

            LEFT JOIN employe re
                ON aar.Rejected_By = re.emp_id

            ORDER BY aar.Approval_ID DESC
        `);

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {

        console.error("Get approval requests error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch approval requests"
        });
    }
};

// =====================================================
// APPROVE USING TOKEN
// =====================================================

const approveByToken = async (req, res) => {
    try {

        const { token } = req.params;

        const { Approved_By } = req.body;


        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Approval token is required"
            });
        }


        if (!Approved_By) {
            return res.status(400).json({
                success: false,
                message: "Approved_By is required"
            });
        }


        // =================================================
        // HASH RECEIVED TOKEN
        // =================================================

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");


        // =================================================
        // FIND TOKEN
        // =================================================

        const [rows] = await db.query(`
            SELECT
                Approval_ID,
                Request_ID,
                Status,
                Expires_At
            FROM admin_approval_requests
            WHERE Approval_Token_Hash = ?
        `, [tokenHash]);


        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Invalid approval token"
            });
        }


        const approval = rows[0];


        // =================================================
        // CHECK EXPIRY
        // =================================================

        if (
            new Date(approval.Expires_At) < new Date()
        ) {

            await db.query(`
                UPDATE admin_approval_requests
                SET Status = 'Expired'
                WHERE Approval_ID = ?
                AND Status = 'Pending'
            `, [approval.Approval_ID]);


            return res.status(410).json({
                success: false,
                message: "Approval link has expired"
            });
        }


        // =================================================
        // CHECK STATUS
        // =================================================

        if (approval.Status !== "Pending") {
            return res.status(400).json({
                success: false,
                message:
                    `Approval request is already ${approval.Status}`
            });
        }


        // =================================================
        // CHECK APPROVING EMPLOYEE
        // =================================================

        const [employee] = await db.query(
            `
            SELECT emp_id
            FROM employe
            WHERE emp_id = ?
            `,
            [Approved_By]
        );


        if (employee.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Approving employee not found"
            });
        }


        // =================================================
        // APPROVE
        // =================================================

        await db.query(`
            UPDATE admin_approval_requests
            SET
                Status = 'Approved',
                Approved_By = ?,
                Approved_At = CURRENT_TIMESTAMP
            WHERE Approval_ID = ?
        `, [
            Approved_By,
            approval.Approval_ID
        ]);


        res.status(200).json({
            success: true,
            message: "Request approved successfully"
        });

    } catch (error) {

        console.error(
            "Approve by token error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to approve request"
        });
    }
};

// =====================================================
// GET APPROVAL REQUEST BY ID
// =====================================================

const getApprovalById = async (req, res) => {
    try {

        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT
                aar.Approval_ID,
                aar.Request_ID,
                aar.Approval_Token_Hash,
                aar.Expires_At,
                aar.Status,

                aar.Approved_By,
                ae.emp_name AS Approved_By_Name,
                aar.Approved_At,

                aar.Rejected_By,
                re.emp_name AS Rejected_By_Name,
                aar.Rejected_At,

                aar.Rejection_Reason,
                aar.Created_At

            FROM admin_approval_requests aar

            LEFT JOIN employe ae
                ON aar.Approved_By = ae.emp_id

            LEFT JOIN employe re
                ON aar.Rejected_By = re.emp_id

            WHERE aar.Approval_ID = ?
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

        console.error("Get approval request error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch approval request"
        });
    }
};


// =====================================================
// CREATE APPROVAL REQUEST
// =====================================================

// =====================================================
// CREATE APPROVAL REQUEST
// TOKEN VALID FOR 1 HOUR
// =====================================================

const createApproval = async (req, res) => {
    try {

        const {
            Request_ID
        } = req.body;

        // =================================================
        // REQUIRED FIELD
        // =================================================

        if (!Request_ID) {
            return res.status(400).json({
                success: false,
                message: "Request_ID is required"
            });
        }


        // =================================================
        // CHECK ACCESS REQUEST
        // =================================================

        const [request] = await db.query(
            `
            SELECT Request_ID
            FROM admin_access_requests
            WHERE Request_ID = ?
            `,
            [Request_ID]
        );


        if (request.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Admin access request not found"
            });
        }


        // =================================================
        // GENERATE RANDOM TOKEN
        // =================================================

        const approvalToken = crypto.randomBytes(32).toString("hex");


        // =================================================
        // HASH TOKEN
        // =================================================

        const approvalTokenHash = crypto
            .createHash("sha256")
            .update(approvalToken)
            .digest("hex");


        // =================================================
        // TOKEN EXPIRES AFTER 1 HOUR
        // =================================================

        const expiresAt = new Date(
            Date.now() + 60 * 60 * 1000
        );


        // =================================================
        // SAVE HASH + EXPIRY
        // =================================================

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


        // =================================================
        // CREATE APPROVAL LINK
        // =================================================

        const approvalLink =
            `http://localhost:5173/admin/approval/${approvalToken}`;


        // =================================================
        // RESPONSE
        // =================================================

        res.status(201).json({
            success: true,
            message: "Approval request created successfully",

            Approval_ID: result.insertId,

            approval_link: approvalLink,

            expires_at: expiresAt
        });

    } catch (error) {

        console.error(
            "Create approval request error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to create approval request"
        });
    }
};

// =====================================================
// APPROVE REQUEST
// =====================================================

const approveRequest = async (req, res) => {
    try {

        const { id } = req.params;

        const {
            Approved_By
        } = req.body;


        if (!Approved_By) {

            return res.status(400).json({
                success: false,
                message: "Approved_By is required"
            });
        }


        // Check employee

        const [employee] = await db.query(
            `
            SELECT emp_id
            FROM employe
            WHERE emp_id = ?
            `,
            [Approved_By]
        );


        if (employee.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Approving employee not found"
            });
        }


        // Update approval

        const [result] = await db.query(`
            UPDATE admin_approval_requests
            SET
                Status = 'Approved',
                Approved_By = ?,
                Approved_At = CURRENT_TIMESTAMP
            WHERE Approval_ID = ?
            AND Status = 'Pending'
        `, [
            Approved_By,
            id
        ]);


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Approval request not found or already processed"
            });
        }


        res.status(200).json({
            success: true,
            message: "Request approved successfully"
        });

    } catch (error) {

        console.error("Approve request error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to approve request"
        });
    }
};


// =====================================================
// REJECT REQUEST
// =====================================================

const rejectRequest = async (req, res) => {
    try {

        const { id } = req.params;

        const {
            Rejected_By,
            Rejection_Reason
        } = req.body;


        if (!Rejected_By) {

            return res.status(400).json({
                success: false,
                message: "Rejected_By is required"
            });
        }


        // Check employee

        const [employee] = await db.query(
            `
            SELECT emp_id
            FROM employe
            WHERE emp_id = ?
            `,
            [Rejected_By]
        );


        if (employee.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Rejecting employee not found"
            });
        }


        // Update approval

        const [result] = await db.query(`
            UPDATE admin_approval_requests
            SET
                Status = 'Rejected',
                Rejected_By = ?,
                Rejected_At = CURRENT_TIMESTAMP,
                Rejection_Reason = ?
            WHERE Approval_ID = ?
            AND Status = 'Pending'
        `, [
            Rejected_By,
            Rejection_Reason || null,
            id
        ]);


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Approval request not found or already processed"
            });
        }


        res.status(200).json({
            success: true,
            message: "Request rejected successfully"
        });

    } catch (error) {

        console.error("Reject request error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to reject request"
        });
    }
};


// =====================================================
// DELETE APPROVAL REQUEST
// =====================================================

const deleteApproval = async (req, res) => {
    try {

        const { id } = req.params;

        const [result] = await db.query(
            `
            DELETE FROM admin_approval_requests
            WHERE Approval_ID = ?
            `,
            [id]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: "Approval request not found"
            });
        }


        res.status(200).json({
            success: true,
            message: "Approval request deleted successfully"
        });

    } catch (error) {

        console.error("Delete approval request error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete approval request"
        });
    }
};

const rejectByToken = async (req, res) => {
    try {
        const { token } = req.params;
        const { Rejected_By, Rejection_Reason } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Approval token is required"
            });
        }

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const [rows] = await db.query(
            `SELECT Approval_ID, Request_ID, Status, Expires_At
             FROM admin_approval_requests
             WHERE Approval_Token_Hash = ?`,
            [tokenHash]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Invalid approval token"
            });
        }

        const approval = rows[0];

        // Check expiry
        if (new Date(approval.Expires_At) < new Date()) {

            await db.query(
                `UPDATE admin_approval_requests
                 SET Status = 'Expired'
                 WHERE Approval_ID = ?
                 AND Status = 'Pending'`,
                [approval.Approval_ID]
            );

            return res.status(410).json({
                success: false,
                message: "Approval link has expired"
            });
        }

        // Already processed
        if (approval.Status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: `Request is already ${approval.Status}`
            });
        }

        // Check employee
        if (Rejected_By) {
            const [employee] = await db.query(
                `SELECT emp_id
                 FROM employe
                 WHERE emp_id = ?`,
                [Rejected_By]
            );

            if (employee.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Rejecting employee not found"
                });
            }
        }

        const [result] = await db.query(
            `UPDATE admin_approval_requests
             SET Status = 'Rejected',
                 Rejected_By = ?,
                 Rejected_At = NOW(),
                 Rejection_Reason = ?
             WHERE Approval_ID = ?
             AND Status = 'Pending'`,
            [
                Rejected_By || null,
                Rejection_Reason || null,
                approval.Approval_ID
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: "Unable to reject request"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Approval request rejected successfully",
            Approval_ID: approval.Approval_ID,
            Request_ID: approval.Request_ID
        });

    } catch (error) {
        console.error("Reject by token error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
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
    createApproval,
    approveRequest,
    rejectRequest,
    approveByToken,
    rejectByToken,
    deleteApproval
};