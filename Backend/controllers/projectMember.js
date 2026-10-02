import db from "../db.js";
 
// GET ALL PROJECT MEMBERS
const getAllProjectMembers = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                pm.id,
                pm.project_id,
                p.proj_name,
                pm.employee_id,
                e.emp_name,
                e.email,
                pm.assigned_at
            FROM project_members pm
            LEFT JOIN projects p
                ON pm.project_id = p.project_id
            LEFT JOIN employe e
                ON pm.employee_id = e.emp_id
            ORDER BY pm.id DESC
        `);
 
        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error("Get project members error:", error);
 
        res.status(500).json({
            success: false,
            message: "Failed to fetch project members"
        });
    }
};
 
 
// GET PROJECT MEMBER BY ID
const getProjectMemberById = async (req, res) => {
    try {
        const { id } = req.params;
 
        const [rows] = await db.query(`
            SELECT
                pm.id,
                pm.project_id,
                p.proj_name,
                pm.employee_id,
                e.emp_name,
                e.email,
                pm.assigned_at
            FROM project_members pm
            LEFT JOIN projects p
                ON pm.project_id = p.project_id
            LEFT JOIN employe e
                ON pm.employee_id = e.emp_id
            WHERE pm.id = ?
        `, [id]);
 
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project member not found"
            });
        }
 
        res.status(200).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Get project member error:", error);
 
        res.status(500).json({
            success: false,
            message: "Failed to fetch project member"
        });
    }
};
 
 
// CREATE PROJECT MEMBER
const createProjectMember = async (req, res) => {
    try {
        const {
            project_id,
            employee_id
        } = req.body;
 
        if (!project_id || !employee_id) {
            return res.status(400).json({
                success: false,
                message: "project_id and employee_id are required"
            });
        }
 
        // CHECK PROJECT EXISTS
        const [project] = await db.query(
            "SELECT project_id FROM projects WHERE project_id = ?",
            [project_id]
        );
 
        if (project.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }
 
        // CHECK EMPLOYEE EXISTS
        const [employee] = await db.query(
            "SELECT emp_id FROM employe WHERE emp_id = ?",
            [employee_id]
        );
 
        if (employee.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }
 
        // CHECK DUPLICATE ASSIGNMENT
        const [existing] = await db.query(
            `
            SELECT id
            FROM project_members
            WHERE project_id = ?
            AND employee_id = ?
            `,
            [project_id, employee_id]
        );
 
        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Employee is already assigned to this project"
            });
        }
 
        const [result] = await db.query(
            `
            INSERT INTO project_members
            (
                project_id,
                employee_id
            )
            VALUES (?, ?)
            `,
            [project_id, employee_id]
        );
 
        res.status(201).json({
            success: true,
            message: "Employee assigned to project successfully",
            id: result.insertId
        });
 
    } catch (error) {
        console.error("Create project member error:", error);
 
        res.status(500).json({
            success: false,
            message: "Failed to assign employee to project"
        });
    }
};
 
 
// UPDATE PROJECT MEMBER
const updateProjectMember = async (req, res) => {
    try {
        const { id } = req.params;
 
        const {
            project_id,
            employee_id
        } = req.body;
 
        if (!project_id || !employee_id) {
            return res.status(400).json({
                success: false,
                message: "project_id and employee_id are required"
            });
        }
 
        // CHECK PROJECT EXISTS
        const [project] = await db.query(
            "SELECT project_id FROM projects WHERE project_id = ?",
            [project_id]
        );
 
        if (project.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }
 
        // CHECK EMPLOYEE EXISTS
        const [employee] = await db.query(
            "SELECT emp_id FROM employe WHERE emp_id = ?",
            [employee_id]
        );
 
        if (employee.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }
 
        // CHECK DUPLICATE
        const [existing] = await db.query(
            `
            SELECT id
            FROM project_members
            WHERE project_id = ?
            AND employee_id = ?
            AND id != ?
            `,
            [project_id, employee_id, id]
        );
 
        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Employee is already assigned to this project"
            });
        }
 
        const [result] = await db.query(
            `
            UPDATE project_members
            SET
                project_id = ?,
                employee_id = ?
            WHERE id = ?
            `,
            [
                project_id,
                employee_id,
                id
            ]
        );
 
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Project member not found"
            });
        }
 
        res.status(200).json({
            success: true,
            message: "Project member updated successfully"
        });
 
    } catch (error) {
        console.error("Update project member error:", error);
 
        res.status(500).json({
            success: false,
            message: "Failed to update project member"
        });
    }
};
 
 
// DELETE PROJECT MEMBER
const deleteProjectMember = async (req, res) => {
    try {
        const { id } = req.params;
 
        const [result] = await db.query(
            "DELETE FROM project_members WHERE id = ?",
            [id]
        );
 
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Project member not found"
            });
        }
 
        res.status(200).json({
            success: true,
            message: "Employee removed from project successfully"
        });
 
    } catch (error) {
        console.error("Delete project member error:", error);
 
        res.status(500).json({
            success: false,
            message: "Failed to remove employee from project"
        });
    }
};
 
 
export default {
    getAllProjectMembers,
    getProjectMemberById,
    createProjectMember,
    updateProjectMember,
    deleteProjectMember
};
 