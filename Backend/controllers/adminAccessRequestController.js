import connection from "../db.js";

const db = connection.promise();


// =====================================================
// GET ALL DEPARTMENTS
// =====================================================

const getDepartments = async (req, res) => {
    try {
        const [departments] = await db.query(`
            SELECT
                department_id,
                department_name
            FROM departments
            ORDER BY department_name ASC
        `);

        res.status(200).json({
            success: true,
            count: departments.length,
            data: departments
        });

    } catch (error) {
        console.error("Get departments error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch departments"
        });
    }
};


// =====================================================
// GET ALL ACCESS REQUESTS
// =====================================================

const getAllRequests = async (req, res) => {
    try {
        const [requests] = await db.query(`
            SELECT
                r.Request_ID,
                r.Full_Name,
                r.Email,
                r.Phone,
                r.DOB,
                r.employee_code,
                r.Department_ID,
                d.department_name,
                r.Joining_Date,
                r.Reason,
                r.Request_Status,
                r.Created_At,
                r.Updated_At
            FROM admin_access_requests r
            LEFT JOIN departments d
                ON r.Department_ID = d.department_id
            ORDER BY r.Created_At DESC
        `);

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });

    } catch (error) {
        console.error("Get all requests error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch access requests"
        });
    }
};


// =====================================================
// GET REQUEST BY ID
// =====================================================

const getRequestById = async (req, res) => {
    try {
        const { id } = req.params;

        const [requests] = await db.query(`
            SELECT
                r.Request_ID,
                r.Full_Name,
                r.Email,
                r.Phone,
                r.DOB,
                r.employee_code,
                r.Department_ID,
                d.department_name,
                r.Joining_Date,
                r.Reason,
                r.Request_Status,
                r.Created_At,
                r.Updated_At
            FROM admin_access_requests r
            LEFT JOIN departments d
                ON r.Department_ID = d.department_id
            WHERE r.Request_ID = ?
        `, [id]);

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Access request not found"
            });
        }

        res.status(200).json({
            success: true,
            data: requests[0]
        });

    } catch (error) {
        console.error("Get request by ID error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch access request"
        });
    }
};


// =====================================================
// CREATE FIRST-TIME REGISTRATION REQUEST
// =====================================================

const createRequest = async (req, res) => {
    try {
        const {
            employee_code,
            Full_Name,
            Email,
            Phone,
            DOB,
            Department_ID,
            Joining_Date,
            Reason
        } = req.body;


        // =================================================
        // NORMALIZE
        // =================================================

        const employeeCode = String(employee_code || "").trim();

        const fullName = String(Full_Name || "").trim();

        const email = String(Email || "")
            .trim()
            .toLowerCase();

        const phone = String(Phone || "").trim();

        const reason = String(Reason || "").trim();


        // =================================================
        // VALIDATION
        // =================================================

        if (!employeeCode) {
            return res.status(400).json({
                success: false,
                message: "Employee Code is required"
            });
        }

        if (employeeCode.length > 50) {
            return res.status(400).json({
                success: false,
                message: "Employee Code cannot exceed 50 characters"
            });
        }


        if (!fullName) {
            return res.status(400).json({
                success: false,
                message: "Full Name is required"
            });
        }

        if (fullName.length < 3) {
            return res.status(400).json({
                success: false,
                message: "Full Name must be at least 3 characters"
            });
        }


        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email address"
            });
        }


        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone is required"
            });
        }

        if (!/^[0-9]{10}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: "Phone must contain exactly 10 digits"
            });
        }


        if (!Department_ID) {
            return res.status(400).json({
                success: false,
                message: "Department is required"
            });
        }


        if (!Joining_Date) {
            return res.status(400).json({
                success: false,
                message: "Joining Date is required"
            });
        }


        if (!reason) {
            return res.status(400).json({
                success: false,
                message: "Reason is required"
            });
        }

        if (reason.length < 10) {
            return res.status(400).json({
                success: false,
                message: "Reason must be at least 10 characters"
            });
        }


        // =================================================
        // CHECK DEPARTMENT
        // =================================================

        const [departments] = await db.query(`
            SELECT
                department_id,
                department_name
            FROM departments
            WHERE department_id = ?
        `, [Department_ID]);


        if (departments.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid Department"
            });
        }


        // =================================================
        // CHECK EXISTING REQUEST
        //
        // IMPORTANT:
        // DO NOT CHECK employe TABLE HERE.
        //
        // New employee can use:
        // employee_code = "002"
        // =================================================

        const [existingRequest] = await db.query(`
            SELECT
                Request_ID,
                Request_Status
            FROM admin_access_requests
            WHERE employee_code = ?
            AND Request_Status IN ('Pending', 'Approved')
            LIMIT 1
        `, [employeeCode]);


        if (existingRequest.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "This Employee Code already has a pending or approved registration request."
            });
        }


        // =================================================
        // INSERT REQUEST
        // =================================================

        const [result] = await db.query(`
            INSERT INTO admin_access_requests
            (
                Full_Name,
                Email,
                Phone,
                DOB,
                employee_code,
                Department_ID,
                Joining_Date,
                Reason,
                Request_Status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
        `, [
            fullName,
            email,
            phone,
            DOB || null,
            employeeCode,
            Department_ID,
            Joining_Date,
            reason
        ]);


        // =================================================
        // RESPONSE
        // =================================================

        res.status(201).json({
            success: true,
            message: "Registration request submitted successfully",

            data: {
                Request_ID: result.insertId,
                employee_code: employeeCode,
                Full_Name: fullName,
                Email: email,
                Phone: phone,
                DOB: DOB || null,
                Department_ID: Number(Department_ID),
                Joining_Date: Joining_Date,
                Reason: reason,
                Request_Status: "Pending"
            }
        });

    } catch (error) {
        console.error(
            "Create access request error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to create registration request",
            error: error.message
        });
    }
};


// =====================================================
// UPDATE ACCESS REQUEST
// =====================================================

const updateRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            employee_code,
            Full_Name,
            Email,
            Phone,
            DOB,
            Department_ID,
            Joining_Date,
            Reason,
            Request_Status
        } = req.body;


        const employeeCode = String(employee_code || "").trim();

        const fullName = String(Full_Name || "").trim();

        const email = String(Email || "")
            .trim()
            .toLowerCase();

        const phone = String(Phone || "").trim();

        const reason = String(Reason || "").trim();


        // =================================================
        // CHECK REQUEST
        // =================================================

        const [existing] = await db.query(`
            SELECT Request_ID
            FROM admin_access_requests
            WHERE Request_ID = ?
        `, [id]);


        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Access request not found"
            });
        }


        // =================================================
        // VALIDATION
        // =================================================

        if (!employeeCode) {
            return res.status(400).json({
                success: false,
                message: "Employee Code is required"
            });
        }

        if (!fullName) {
            return res.status(400).json({
                success: false,
                message: "Full Name is required"
            });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email address"
            });
        }

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone is required"
            });
        }

        if (!/^[0-9]{10}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: "Phone must contain exactly 10 digits"
            });
        }

        if (!Department_ID) {
            return res.status(400).json({
                success: false,
                message: "Department is required"
            });
        }

        if (!Joining_Date) {
            return res.status(400).json({
                success: false,
                message: "Joining Date is required"
            });
        }

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: "Reason is required"
            });
        }


        // =================================================
        // CHECK DEPARTMENT
        // =================================================

        const [departments] = await db.query(`
            SELECT department_id
            FROM departments
            WHERE department_id = ?
        `, [Department_ID]);


        if (departments.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid Department"
            });
        }


        // =================================================
        // UPDATE
        // =================================================

        await db.query(`
            UPDATE admin_access_requests
            SET
                Full_Name = ?,
                Email = ?,
                Phone = ?,
                DOB = ?,
                employee_code = ?,
                Department_ID = ?,
                Joining_Date = ?,
                Reason = ?,
                Request_Status = ?
            WHERE Request_ID = ?
        `, [
            fullName,
            email,
            phone,
            DOB || null,
            employeeCode,
            Department_ID,
            Joining_Date,
            reason,
            Request_Status || "Pending",
            id
        ]);


        res.status(200).json({
            success: true,
            message: "Access request updated successfully"
        });

    } catch (error) {
        console.error(
            "Update access request error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to update access request",
            error: error.message
        });
    }
};


// =====================================================
// DELETE ACCESS REQUEST
// =====================================================

const deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(`
            DELETE FROM admin_access_requests
            WHERE Request_ID = ?
        `, [id]);


        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Access request not found"
            });
        }


        res.status(200).json({
            success: true,
            message: "Access request deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete access request error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to delete access request",
            error: error.message
        });
    }
};


// =====================================================
// EXPORT
// =====================================================

export default {
    getDepartments,
    getAllRequests,
    getRequestById,
    createRequest,
    updateRequest,
    deleteRequest
};