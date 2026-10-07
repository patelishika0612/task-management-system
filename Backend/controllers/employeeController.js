
import bcrypt from "bcryptjs";
import connection from "../db.js";

const db = connection.promise();

// =====================================================
// GET ALL EMPLOYEES
// =====================================================

const getAllEmployees = async (req, res) => {
    try {
        const [employees] = await db.query(`
            SELECT
                e.emp_id,
                e.employee_code,
                e.emp_name,
                e.email,
                e.phone,
                e.department_id,
                d.department_name,
                e.date_of_join,
                e.image,
                e.status,
                e.created_at,
                e.updated_at
            FROM employe e
            LEFT JOIN departments d
                ON e.department_id = d.department_id
            ORDER BY e.emp_id DESC
        `);

        return res.status(200).json({
            success: true,
            count: employees.length,
            data: employees
        });

    } catch (error) {
        console.error("Get employees error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch employees",
            error: error.message
        });
    }
};


// =====================================================
// GET EMPLOYEE BY ID
// =====================================================

const getEmployeeById = async (req, res) => {
    try {
        const employeeId = Number(req.params.id);

        if (!Number.isInteger(employeeId) || employeeId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid employee ID"
            });
        }

        const [employees] = await db.query(
            `
            SELECT
                e.emp_id,
                e.employee_code,
                e.emp_name,
                e.email,
                e.phone,
                e.department_id,
                d.department_name,
                e.date_of_join,
                e.image,
                e.status,
                e.created_at,
                e.updated_at
            FROM employe e
            LEFT JOIN departments d
                ON e.department_id = d.department_id
            WHERE e.emp_id = ?
            `,
            [employeeId]
        );

        if (employees.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: employees[0]
        });

    } catch (error) {
        console.error("Get employee by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch employee",
            error: error.message
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
            password,
            date_of_join,
            employee_code,
            status = "active"
        } = req.body;

        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (!emp_name || !emp_name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Employee name is required"
            });
        }

        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        if (!phone || !phone.trim()) {
            return res.status(400).json({
                success: false,
                message: "Phone is required"
            });
        }

        if (!department_id) {
            return res.status(400).json({
                success: false,
                message: "Department is required"
            });
        }

        if (!password || !password.trim()) {
            return res.status(400).json({
                success: false,
                message: "Password is required"
            });
        }

        if (!date_of_join) {
            return res.status(400).json({
                success: false,
                message: "Date of joining is required"
            });
        }

        if (!employee_code || !employee_code.trim()) {
            return res.status(400).json({
                success: false,
                message: "Employee code is required"
            });
        }

        const departmentId = Number(department_id);

        if (!Number.isInteger(departmentId) || departmentId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid department ID"
            });
        }

        // ---------------------------------------------
        // EMAIL VALIDATION
        // ---------------------------------------------

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Invalid email address"
            });
        }

        // ---------------------------------------------
        // CHECK EXISTING EMAIL
        // ---------------------------------------------

        const [existingEmail] = await db.query(
            `
            SELECT emp_id
            FROM employe
            WHERE email = ?
            `,
            [email.trim()]
        );

        if (existingEmail.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Employee with this email already exists",
                Employee_ID: existingEmail[0].emp_id
            });
        }

        // ---------------------------------------------
        // CHECK EMPLOYEE CODE
        // ---------------------------------------------

        const [existingCode] = await db.query(
            `
            SELECT emp_id
            FROM employe
            WHERE employee_code = ?
            `,
            [employee_code.trim()]
        );

        if (existingCode.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Employee code already exists"
            });
        }

        // ---------------------------------------------
        // CHECK DEPARTMENT
        // ---------------------------------------------

        const [department] = await db.query(
            `
            SELECT department_id
            FROM departments
            WHERE department_id = ?
            `,
            [departmentId]
        );

        if (department.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        // ---------------------------------------------
        // PASSWORD HASH
        // ---------------------------------------------

        const passwordHash = await bcrypt.hash(password, 10);

        // ---------------------------------------------
        // IMAGE
        // ---------------------------------------------

        const imageName = req.file
            ? req.file.filename
            : null;

        // ---------------------------------------------
        // INSERT EMPLOYEE
        // ---------------------------------------------

        const [result] = await db.query(
            `
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
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                emp_name.trim(),
                email.trim(),
                phone.trim(),
                departmentId,
                passwordHash,
                date_of_join,
                imageName,
                status,
                employee_code.trim()
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Employee created successfully",
            data: {
                Employee_ID: result.insertId,
                employee_code: employee_code.trim(),
                emp_name: emp_name.trim(),
                email: email.trim()
            }
        });

    } catch (error) {
        console.error("Create employee error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create employee",
            error: error.message
        });
    }
};


// =====================================================
// UPDATE EMPLOYEE
// =====================================================

const updateEmployee = async (req, res) => {
    try {
        const employeeId = Number(req.params.id);

        if (!Number.isInteger(employeeId) || employeeId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid employee ID"
            });
        }

        const {
            emp_name,
            email,
            phone,
            department_id,
            password,
            date_of_join,
            employee_code,
            status = "active",
            existing_image = ""
        } = req.body;

        if (!emp_name || !emp_name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Employee name is required"
            });
        }

        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        if (!phone || !phone.trim()) {
            return res.status(400).json({
                success: false,
                message: "Phone is required"
            });
        }

        if (!department_id) {
            return res.status(400).json({
                success: false,
                message: "Department is required"
            });
        }

        if (!date_of_join) {
            return res.status(400).json({
                success: false,
                message: "Date of joining is required"
            });
        }

        if (!employee_code || !employee_code.trim()) {
            return res.status(400).json({
                success: false,
                message: "Employee code is required"
            });
        }

        const departmentId = Number(department_id);

        // ---------------------------------------------
        // CHECK EMPLOYEE EXISTS
        // ---------------------------------------------

        const [employee] = await db.query(
            `
            SELECT emp_id, image
            FROM employe
            WHERE emp_id = ?
            `,
            [employeeId]
        );

        if (employee.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        // ---------------------------------------------
        // CHECK EMAIL DUPLICATE
        // ---------------------------------------------

        const [emailExists] = await db.query(
            `
            SELECT emp_id
            FROM employe
            WHERE email = ?
            AND emp_id != ?
            `,
            [email.trim(), employeeId]
        );

        if (emailExists.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already belongs to another employee"
            });
        }

        // ---------------------------------------------
        // CHECK EMPLOYEE CODE DUPLICATE
        // ---------------------------------------------

        const [codeExists] = await db.query(
            `
            SELECT emp_id
            FROM employe
            WHERE employee_code = ?
            AND emp_id != ?
            `,
            [employee_code.trim(), employeeId]
        );

        if (codeExists.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Employee code already belongs to another employee"
            });
        }

        // ---------------------------------------------
        // CHECK DEPARTMENT
        // ---------------------------------------------

        const [department] = await db.query(
            `
            SELECT department_id
            FROM departments
            WHERE department_id = ?
            `,
            [departmentId]
        );

        if (department.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        // ---------------------------------------------
        // IMAGE
        // ---------------------------------------------

        let imageName =
            existing_image ||
            employee[0].image ||
            null;

        if (req.file) {
            imageName = req.file.filename;
        }

        // ---------------------------------------------
        // UPDATE WITH PASSWORD
        // ---------------------------------------------

        if (password && password.trim()) {

            const passwordHash =
                await bcrypt.hash(password, 10);

            await db.query(
                `
                UPDATE employe
                SET
                    emp_name = ?,
                    email = ?,
                    phone = ?,
                    department_id = ?,
                    password = ?,
                    date_of_join = ?,
                    image = ?,
                    status = ?,
                    employee_code = ?
                WHERE emp_id = ?
                `,
                [
                    emp_name.trim(),
                    email.trim(),
                    phone.trim(),
                    departmentId,
                    passwordHash,
                    date_of_join,
                    imageName,
                    status,
                    employee_code.trim(),
                    employeeId
                ]
            );

        } else {

            // -----------------------------------------
            // UPDATE WITHOUT PASSWORD
            // -----------------------------------------

            await db.query(
                `
                UPDATE employe
                SET
                    emp_name = ?,
                    email = ?,
                    phone = ?,
                    department_id = ?,
                    date_of_join = ?,
                    image = ?,
                    status = ?,
                    employee_code = ?
                WHERE emp_id = ?
                `,
                [
                    emp_name.trim(),
                    email.trim(),
                    phone.trim(),
                    departmentId,
                    date_of_join,
                    imageName,
                    status,
                    employee_code.trim(),
                    employeeId
                ]
            );
        }

        return res.status(200).json({
            success: true,
            message: "Employee updated successfully",
            Employee_ID: employeeId
        });

    } catch (error) {
        console.error("Update employee error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update employee",
            error: error.message
        });
    }
};


// =====================================================
// DELETE EMPLOYEE
// =====================================================

const deleteEmployee = async (req, res) => {
    try {
        const employeeId = Number(req.params.id);

        if (!Number.isInteger(employeeId) || employeeId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid employee ID"
            });
        }

        const [employee] = await db.query(
            `
            SELECT emp_id
            FROM employe
            WHERE emp_id = ?
            `,
            [employeeId]
        );

        if (employee.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        await db.query(
            `
            DELETE FROM employe
            WHERE emp_id = ?
            `,
            [employeeId]
        );

        return res.status(200).json({
            success: true,
            message: "Employee deleted successfully",
            Employee_ID: employeeId
        });

    } catch (error) {
        console.error("Delete employee error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete employee",
            error: error.message
        });
    }
};


// =====================================================
// GET EMPLOYEE PROFILE
// GET /api/employees/profile?email=example@gmail.com
// =====================================================

const getEmployeeProfile = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                e.emp_id,
                e.employee_code,
                e.emp_name,
                e.email,
                e.phone,
                e.department_id,
                d.department_name,
                e.date_of_join,
                e.image,
                e.status,
                e.created_at,
                e.updated_at
            FROM employe e
            LEFT JOIN departments d
                ON e.department_id = d.department_id
            WHERE LOWER(e.email) = LOWER(?)
            LIMIT 1
            `,
            [email.trim()]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee profile not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error(
            "Get employee profile error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch employee profile"
        });
    }
};

// =====================================================
// CREATE / UPDATE EMPLOYEE PROFILE
// =====================================================
// Password removed.
// Status removed.
// Only profile image is updated here.
//
// PUT /api/employees/create-profile/:empId
// Content-Type: multipart/form-data
// Field: image
// =====================================================

const createEmployeeProfile = async (req, res) => {
    try {

        const { empId } = req.params;

        const image = req.file;

        // ---------------------------------------------
        // VALIDATE EMPLOYEE ID
        // ---------------------------------------------

        if (!empId) {
            return res.status(400).json({
                success: false,
                message: "Employee ID is required"
            });
        }

        const employeeId = Number(empId);

        if (
            !Number.isInteger(employeeId) ||
            employeeId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid employee ID"
            });
        }

        // ---------------------------------------------
        // IMAGE REQUIRED
        // ---------------------------------------------

        if (!image) {
            return res.status(400).json({
                success: false,
                message: "Profile image is required"
            });
        }

        // ---------------------------------------------
        // CHECK EMPLOYEE
        // ---------------------------------------------

        const [employees] = await db.query(
            `
            SELECT
                emp_id
            FROM employe
            WHERE emp_id = ?
            LIMIT 1
            `,
            [employeeId]
        );

        if (employees.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        // ---------------------------------------------
        // IMAGE PATH
        // ---------------------------------------------

        const imagePath =
            `/uploads/${image.filename}`;

        // ---------------------------------------------
        // UPDATE DATABASE
        // ---------------------------------------------

        await db.query(
            `
            UPDATE employe
            SET
                image = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE emp_id = ?
            `,
            [
                imagePath,
                employeeId
            ]
        );

        // ---------------------------------------------
        // SUCCESS
        // ---------------------------------------------

        return res.status(200).json({
            success: true,
            message: "Profile created successfully",
            data: {
                emp_id: employeeId,
                image: imagePath
            }
        });

    } catch (error) {

        console.error(
            "Create employee profile error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to create employee profile",
            error: error.message
        });
    }
};


// =====================================================
// EXPORT
// =====================================================

export default {
    getAllEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeProfile,
    createEmployeeProfile
};
