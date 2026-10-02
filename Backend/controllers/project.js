import connection from "../db.js";

const db = connection.promise();

// =====================================================
// GET ALL PROJECTS
// =====================================================

const getAllProjects = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                p.project_id,
                p.proj_name,
                p.description,
                p.client_name,
                p.start_date,
                p.end_date,
                p.priority,
                p.status,
                p.created_by,
                e.emp_name AS created_by_name,
                p.created_at,
                p.updated_at
            FROM projects p
            LEFT JOIN employe e
                ON p.created_by = e.emp_id
            ORDER BY p.project_id DESC
        `);

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error("Get projects error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch projects"
        });
    }
};


// =====================================================
// GET PROJECT BY ID
// =====================================================

const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT
                p.project_id,
                p.proj_name,
                p.description,
                p.client_name,
                p.start_date,
                p.end_date,
                p.priority,
                p.status,
                p.created_by,
                e.emp_name AS created_by_name,
                p.created_at,
                p.updated_at
            FROM projects p
            LEFT JOIN employe e
                ON p.created_by = e.emp_id
            WHERE p.project_id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        res.status(200).json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error("Get project error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch project"
        });
    }
};


// =====================================================
// CREATE PROJECT
// =====================================================

const createProject = async (req, res) => {
    try {
        const {
            proj_name,
            description,
            client_name,
            start_date,
            end_date,
            priority,
            status,
            created_by
        } = req.body;

        if (
            !proj_name ||
            !client_name ||
            !start_date ||
            !created_by
        ) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing"
            });
        }

        const [result] = await db.query(`
            INSERT INTO projects
            (
                proj_name,
                description,
                client_name,
                start_date,
                end_date,
                priority,
                status,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            proj_name,
            description || null,
            client_name,
            start_date,
            end_date || null,
            priority || "medium",
            status || "not started",
            created_by
        ]);

        res.status(201).json({
            success: true,
            message: "Project created successfully",
            project_id: result.insertId
        });

    } catch (error) {
        console.error("Create project error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create project"
        });
    }
};


// =====================================================
// UPDATE PROJECT
// =====================================================

const updateProject = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            proj_name,
            description,
            client_name,
            start_date,
            end_date,
            priority,
            status
        } = req.body;

        const [result] = await db.query(`
            UPDATE projects
            SET
                proj_name = ?,
                description = ?,
                client_name = ?,
                start_date = ?,
                end_date = ?,
                priority = ?,
                status = ?
            WHERE project_id = ?
        `, [
            proj_name,
            description || null,
            client_name,
            start_date,
            end_date || null,
            priority,
            status,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Project updated successfully"
        });

    } catch (error) {
        console.error("Update project error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update project"
        });
    }
};


// =====================================================
// DELETE PROJECT
// =====================================================

const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            "DELETE FROM projects WHERE project_id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Project deleted successfully"
        });

    } catch (error) {
        console.error("Delete project error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete project"
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

export default {
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject
};