import connection from "../db.js";

const db = connection.promise();

// =====================================================
// GET ALL ADMIN ACCESS REQUESTS
// =====================================================

const getAllRequests = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                aar.Request_ID,
                aar.Full_Name,
                aar.Email,
                aar.Phone,
                aar.DOB,
                aar.Employee_ID,
                e.emp_name AS Employee_Name,
                aar.Department_ID,
                d.department_name AS Department_Name,
                aar.Joining_Date,
                aar.Reason,
                aar.Request_Status,
                aar.Created_At,
                aar.Updated_At
            FROM admin_access_requests aar
            LEFT JOIN employe e
                ON aar.Employee_ID = e.emp_id
            LEFT JOIN departments d
                ON aar.Department_ID = d.department_id
            ORDER BY aar.Request_ID DESC
        `);

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error("Get admin access requests error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch admin access requests"
        });
    }
};


// =====================================================
// GET ADMIN ACCESS REQUEST BY ID
// =====================================================

const getRequestById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT
                aar.Request_ID,
                aar.Full_Name,
                aar.Email,
                aar.Phone,
                aar.DOB,
                aar.Employee_ID,
                e.emp_name AS Employee_Name,
                aar.Department_ID,
                d.department_name AS Department_Name,
                aar.Joining_Date,
                aar.Reason,
                aar.Request_Status,
                aar.Created_At,
                aar.Updated_At
            FROM admin_access_requests aar
            LEFT JOIN employe e
                ON aar.Employee_ID = e.emp_id
            LEFT JOIN departments d
                ON aar.Department_ID = d.department_id
            WHERE aar.Request_ID = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Admin access request not found"
            });
        }

        res.status(200).json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error("Get admin access request error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch admin access request"
        });
    }
};


// =====================================================
// CREATE ADMIN ACCESS REQUEST
// =====================================================

const createRequest = async (req, res) => {
    try {
        const {
            Full_Name,
            Email,
            Phone,
            DOB,
            Employee_ID,
            Department_ID,
            Joining_Date,
            Reason,
            Request_Status
        } = req.body;

        // Required fields
        if (!Full_Name || !Email) {
            return res.status(400).json({
                success: false,
                message: "Full_Name and Email are required"
            });
        }

        // =================================================
        // CHECK EMPLOYEE
        // =================================================

        if (Employee_ID) {
            const [employee] = await db.query(
                "SELECT emp_id FROM employe WHERE emp_id = ?",
                [Employee_ID]
            );

            if (employee.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Employee not found"
                });
            }
        }

        // =================================================
        // CHECK DEPARTMENT
        // =================================================

        if (Department_ID) {
            const [department] = await db.query(
                "SELECT department_id FROM departments WHERE department_id = ?",
                [Department_ID]
            );

            if (department.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Department not found"
                });
            }
        }

        // =================================================
        // CREATE REQUEST
        // =================================================

        const [result] = await db.query(`
            INSERT INTO admin_access_requests
            (
                Full_Name,
                Email,
                Phone,
                DOB,
                Employee_ID,
                Department_ID,
                Joining_Date,
                Reason,
                Request_Status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            Full_Name,
            Email,
            Phone || null,
            DOB || null,
            Employee_ID || null,
            Department_ID || null,
            Joining_Date || null,
            Reason || null,
            Request_Status || "Pending"
        ]);

        res.status(201).json({
            success: true,
            message: "Admin access request created successfully",
            Request_ID: result.insertId
        });

    } catch (error) {
        console.error("Create admin access request error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create admin access request"
        });
    }
};


// =====================================================
// UPDATE ADMIN ACCESS REQUEST
// =====================================================

const updateRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            Full_Name,
            Email,
            Phone,
            DOB,
            Employee_ID,
            Department_ID,
            Joining_Date,
            Reason,
            Request_Status
        } = req.body;

        // Required fields
        if (!Full_Name || !Email) {
            return res.status(400).json({
                success: false,
                message: "Full_Name and Email are required"
            });
        }

        // =================================================
        // CHECK EMPLOYEE
        // =================================================

        if (Employee_ID) {
            const [employee] = await db.query(
                "SELECT emp_id FROM employe WHERE emp_id = ?",
                [Employee_ID]
            );

            if (employee.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Employee not found"
                });
            }
        }

        // =================================================
        // CHECK DEPARTMENT
        // =================================================

        if (Department_ID) {
            const [department] = await db.query(
                "SELECT department_id FROM departments WHERE department_id = ?",
                [Department_ID]
            );

            if (department.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Department not found"
                });
            }
        }

        // =================================================
        // UPDATE REQUEST
        // =================================================

        const [result] = await db.query(`
            UPDATE admin_access_requests
            SET
                Full_Name = ?,
                Email = ?,
                Phone = ?,
                DOB = ?,
                Employee_ID = ?,
                Department_ID = ?,
                Joining_Date = ?,
                Reason = ?,
                Request_Status = ?
            WHERE Request_ID = ?
        `, [
            Full_Name,
            Email,
            Phone || null,
            DOB || null,
            Employee_ID || null,
            Department_ID || null,
            Joining_Date || null,
            Reason || null,
            Request_Status || "Pending",
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Admin access request not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Admin access request updated successfully"
        });

    } catch (error) {
        console.error("Update admin access request error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update admin access request"
        });
    }
};


// =====================================================
// DELETE ADMIN ACCESS REQUEST
// =====================================================

const deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            "DELETE FROM admin_access_requests WHERE Request_ID = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Admin access request not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Admin access request deleted successfully"
        });

    } catch (error) {
        console.error("Delete admin access request error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete admin access request"
        });
    }
};


// =====================================================
// EXPORT
// =====================================================

export default {
    getAllRequests,
    getRequestById,
    createRequest,
    updateRequest,
    deleteRequest
};