import db from "../db.js";

// =====================================================
// PROMISE DATABASE CONNECTION
// =====================================================

const promiseDb = db.promise();


// =====================================================
// GET ALL PROJECT MEMBERS
// =====================================================

const getAllProjectMembers = async (req, res) => {
    try {
        const [rows] = await promiseDb.query(`
            SELECT
                pm.id AS id,
                pm.project_id AS project_id,
                p.proj_name,

                pm.employee_id,
                e.emp_id,
                e.employee_code,
                e.emp_name,
                e.email,

                pm.assigned_at AS assigned_at

            FROM project_members pm

            LEFT JOIN projects p
                ON pm.project_id = p.project_id

            LEFT JOIN employe e
                ON pm.employee_id = e.emp_id

            ORDER BY pm.id DESC
        `);

        return res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error("Get project members error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch project members",
            error: error.message
        });
    }
};


// =====================================================
// GET PROJECT MEMBER BY ID
// =====================================================

const getProjectMemberById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await promiseDb.query(
            `
            SELECT
                pm.id AS id,
                pm.project_id AS project_id,
                p.proj_name,
                pm.employee_id,
                e.emp_id,
                e.employee_code,
                e.emp_name,
                e.email,
                pm.assigned_at AS assigned_at
            FROM project_members pm
            LEFT JOIN projects p
                ON pm.project_id = p.project_id
            LEFT JOIN employe e
                ON pm.employee_id = e.emp_id
            WHERE pm.id = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project member not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error("Get project member error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch project member",
            error: error.message
        });
    }
};


// =====================================================
// CREATE PROJECT MEMBER / ASSIGN EMPLOYEE
// =====================================================

const createProjectMember = async (req, res) => {
    try {
        const { project_id, employee_id } = req.body;

        if (!project_id) {
            return res.status(400).json({
                success: false,
                message: "Project ID is required"
            });
        }

        if (!employee_id) {
            return res.status(400).json({
                success: false,
                message: "Employee ID is required"
            });
        }

        const projectId = Number(project_id);
        const employeeId = Number(employee_id);

        if (
            !Number.isInteger(projectId) ||
            !Number.isInteger(employeeId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid Project ID or Employee ID"
            });
        }

        // =====================================================
        // CHECK PROJECT
        // =====================================================

        const [projects] = await promiseDb.query(
            `
            SELECT project_id
            FROM projects
            WHERE project_id = ?
            LIMIT 1
            `,
            [projectId]
        );

        if (projects.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        // =====================================================
        // CHECK EMPLOYEE
        // =====================================================

        const [employees] = await promiseDb.query(
            `
            SELECT
                emp_id,
                employee_code,
                emp_name,
                email
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

        // =====================================================
        // CHECK DUPLICATE ASSIGNMENT
        // =====================================================

        const [existing] = await promiseDb.query(
            `
            SELECT id
            FROM project_members
            WHERE project_id = ?
              AND employee_id = ?
            LIMIT 1
            `,
            [projectId, employeeId]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Employee is already assigned to this project"
            });
        }

        // =====================================================
        // INSERT PROJECT MEMBER
        // =====================================================

        const [result] = await promiseDb.query(
            `
            INSERT INTO project_members
            (
                project_id,
                employee_id,
                assigned_at
            )
            VALUES (?, ?, CURRENT_TIMESTAMP)
            `,
            [projectId, employeeId]
        );

        return res.status(201).json({
            success: true,
            message: "Employee assigned to project successfully",
            data: {
                id: result.insertId,
                project_id: projectId,
                employee_id: employeeId,
                employee_code: employees[0].employee_code,
                emp_name: employees[0].emp_name,
                email: employees[0].email
            }
        });

    } catch (error) {
        console.error("Create project member error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to assign employee to project",
            error: error.message
        });
    }
};


// =====================================================
// UPDATE PROJECT MEMBER
// =====================================================

const updateProjectMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { project_id, employee_id } = req.body;

        if (!project_id) {
            return res.status(400).json({
                success: false,
                message: "Project ID is required."
            });
        }

        if (!employee_id) {
            return res.status(400).json({
                success: false,
                message: "Employee ID is required."
            });
        }

        const memberId = Number(id);
        const projectId = Number(project_id);
        const employeeId = Number(employee_id);

        if (
            !Number.isInteger(memberId) ||
            !Number.isInteger(projectId) ||
            !Number.isInteger(employeeId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid project member data."
            });
        }

        // Check project
        const [projects] = await promiseDb.query(
            `
            SELECT project_id
            FROM projects
            WHERE project_id = ?
            LIMIT 1
            `,
            [projectId]
        );

        if (projects.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found."
            });
        }

        // Check employee
        const [employees] = await promiseDb.query(
            `
            SELECT
                emp_id,
                employee_code,
                emp_name,
                email
            FROM employe
            WHERE emp_id = ?
            LIMIT 1
            `,
            [employeeId]
        );

        if (employees.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found."
            });
        }

        // Check duplicate assignment
        const [existing] = await promiseDb.query(
            `
            SELECT id
            FROM project_members
            WHERE project_id = ?
              AND employee_id = ?
              AND id != ?
            LIMIT 1
            `,
            [projectId, employeeId, memberId]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Employee is already assigned to this project."
            });
        }

        // Update
        const [result] = await promiseDb.query(
            `
            UPDATE project_members
            SET
                project_id = ?,
                employee_id = ?
            WHERE id = ?
            `,
            [projectId, employeeId, memberId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Project member not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Project member updated successfully.",
            data: {
                id: memberId,
                project_id: projectId,
                employee_id: employeeId,
                employee_code: employees[0].employee_code,
                emp_name: employees[0].emp_name,
                email: employees[0].email
            }
        });

    } catch (error) {
        console.error("Update project member error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update project member.",
            error: error.message
        });
    }
};


// =====================================================
// DELETE PROJECT MEMBER
// =====================================================

const deleteProjectMember = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Project member ID is required"
            });
        }

        const [result] = await promiseDb.query(
            `
            DELETE FROM project_members
            WHERE id = ?
            `,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Project member not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Project member removed successfully"
        });

    } catch (error) {
        console.error("Delete project member error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete project member",
            error: error.message
        });
    }
};


// =====================================================
// EXPORT
// =====================================================

export default {
    getAllProjectMembers,
    getProjectMemberById,
    createProjectMember,
    updateProjectMember,
    deleteProjectMember
};