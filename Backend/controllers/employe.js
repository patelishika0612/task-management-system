import connection from "../db.js";
import { getFileUrl } from "../middleware/upload.js";

const db = connection.promise();

// =====================================================
// GET ALL EMPLOYEES
// =====================================================

const getAllEmployees = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                e.emp_id,
                e.emp_name,
                e.email,
                e.phone,
                e.department_id,
                d.department_name,
                e.Date_of_join,
                e.image,
                e.status,
                e.employee_code,
                e.created_at,
                e.updated_at
            FROM employe e
            LEFT JOIN departments d
                ON e.department_id = d.department_id
            ORDER BY e.emp_id DESC
        `);

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error("Get employees error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch employees"
        });
    }
};


// =====================================================
// GET EMPLOYEE BY ID
// =====================================================

const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT
                e.emp_id,
                e.emp_name,
                e.email,
                e.phone,
                e.department_id,
                d.department_name,
                e.Date_of_join,
                e.image,
                e.status,
                e.employee_code,
                e.created_at,
                e.updated_at
            FROM employe e
            LEFT JOIN departments d
                ON e.department_id = d.department_id
            WHERE e.emp_id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        res.status(200).json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error("Get employee error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch employee"
        });
    }
};


// =====================================================
// CREATE EMPLOYEE
// =====================================================

const createEmployee = async (req, res) => {
    try {
        const {
            emp_name,
            email,
            phone,
            department_id,
            Date_of_join,
            status,
            employee_code
        } = req.body;

        if (
            !emp_name ||
            !email ||
            !phone ||
            !department_id ||
            !Date_of_join ||
            !employee_code
        ) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing"
            });
        }

        const hashedPassword = null;
        const imageFile = req.file ? getFileUrl(req, req.file.filename) : null;

        const [result] = await db.query(`
    INSERT INTO employe 
    (
        emp_name,
        email,
        phone,
        department_id,
        Date_of_join,
        image,
        status,
        employee_code
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`, [
            emp_name,
            email,
            phone,
            department_id,
            Date_of_join,
            imageFile,
            status || "active",
            employee_code
        ]);
        res.status(201).json({
            success: true,
            message: "Employee created successfully",
            emp_id: result.insertId
        });

    } catch (error) {
        console.error("Create employee error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create employee"
        });
    }
};


// =====================================================
// UPDATE EMPLOYEE
// =====================================================

const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            emp_name,
            email,
            phone,
            department_id,
            Date_of_join,
            status,
            employee_code,
            existing_image
        } = req.body;

        const imageFile = req.file ? getFileUrl(req, req.file.filename) : (existing_image || null);

        const [result] = await db.query(`
            UPDATE employe
            SET
                emp_name = ?,
                email = ?,
                phone = ?,
                department_id = ?,
                Date_of_join = ?,
                image = ?,
                status = ?,
                employee_code = ?
            WHERE emp_id = ?
        `, [
            emp_name,
            email,
            phone,
            department_id,
            Date_of_join,
            imageFile,
            status,
            employee_code,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Employee updated successfully"
        });

    } catch (error) {
        console.error("Update employee error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update employee"
        });
    }
};


// =====================================================
// DELETE EMPLOYEE
// =====================================================

const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            "DELETE FROM employe WHERE emp_id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Employee deleted successfully"
        });

    } catch (error) {
        console.error("Delete employee error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete employee"
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

export default {
    getAllEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee
};