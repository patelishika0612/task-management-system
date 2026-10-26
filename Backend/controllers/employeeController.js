
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
// EMPLOYEE LOGIN
// POST /api/employees/login
// =====================================================

const employeeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Find employee by email
    const [employees] = await db.query(
      `SELECT
          emp_id,
          emp_name,
          email,
          password,
          department_id,
          employee_code,
          status
       FROM employe
       WHERE email = ?
       LIMIT 1`,
      [email.trim()]
    );

    if (employees.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const employee = employees[0];

    // Compare entered password with stored bcrypt hash
    const passwordMatches = await bcrypt.compare(
      password,
      employee.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check employee account status
    if (employee.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your employee account is inactive.",
      });
    }

    // Never send password hash to frontend
    const {
      password: storedPassword,
      ...safeEmployee
    } = employee;

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: safeEmployee,
    });
  } catch (error) {
    console.error("Employee login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login. Please try again.",
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

        // Optional: employee sets their own password later
        // (column is NOT NULL, so store empty string when not provided)
        const passwordHash = password && password.trim()
            ? await bcrypt.hash(password, 10)
            : "";

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

// =====================================================
// GET EMPLOYEE PROFILE BY EMAIL
// =====================================================

// Get employee profile using email
const getEmployeeProfile = async (req, res) => {
  try {
    const email = String(req.query.email || "").trim();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Employee email is required.",
      });
    }

    const [rows] = await db.query(
      `SELECT
        e.emp_id,
        e.emp_name,
        e.email,
        e.phone,
        e.department_id,
        d.department_name,
        e.date_of_join,
        e.employee_code,
        e.image,
        e.status
       FROM employe e
       LEFT JOIN departments d
         ON e.department_id = d.department_id
       WHERE e.email = ?
       LIMIT 1`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Get employee profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee profile.",
    });
  }
};


// Upload employee profile image
const createEmployeeProfile = async (req, res) => {
  try {
    const empId = Number(req.params.empId);

    if (!Number.isInteger(empId) || empId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID.",
      });
    }

    // Multer should receive the file under field name "image"
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Profile image was not received. Please select an image and try again.",
      });
    }

    const [employees] = await db.query(
      `SELECT emp_id, email, image
       FROM employe
       WHERE emp_id = ?
       LIMIT 1`,
      [empId]
    );

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

   const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const [result] = await db.query(
      `UPDATE employe
       SET image = ?
       WHERE emp_id = ?`,
      [imageUrl, empId]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        message: "Unable to save profile image.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile image uploaded successfully.",
      data: {
        emp_id: empId,
        email: employees[0].email,
        image: imageUrl,
      },
    });
  } catch (error) {
    console.error("Create employee profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload profile image.",
    });
  }
};


// =====================================================
// COMPLETE EMPLOYEE PROFILE
// =====================================================



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
    createEmployeeProfile ,
    employeeLogin
};
