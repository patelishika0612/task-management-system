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
                pm.Project_Member_ID AS id,
                pm.Project_ID AS project_id,
                p.proj_name,

                pm.employee_code,
                e.emp_id,
                e.emp_name,
                e.email,

                pm.Assigned_Date AS assigned_at

            FROM project_members pm

            LEFT JOIN projects p
                ON pm.Project_ID = p.project_id

            LEFT JOIN employe e
                ON pm.employee_code = e.employee_code

            ORDER BY pm.Project_Member_ID DESC
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
            message: "Failed to fetch project members"
        });
    }
};


// =====================================================
// GET PROJECT MEMBER BY ID
// =====================================================

const getProjectMemberById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await promiseDb.query(`
            SELECT
                pm.Project_Member_ID AS id,
                pm.Project_ID AS project_id,
                p.proj_name,

                pm.employee_code,
                e.emp_id,
                e.emp_name,
                e.email,

                pm.Assigned_Date AS assigned_at

            FROM project_members pm

            LEFT JOIN projects p
                ON pm.Project_ID = p.project_id

            LEFT JOIN employe e
                ON pm.employee_code = e.employee_code

            WHERE pm.Project_Member_ID = ?
        `, [id]);

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
            message: "Failed to fetch project member"
        });
    }
};


// =====================================================
// CREATE PROJECT MEMBER / ASSIGN EMPLOYEE
// =====================================================

const createProjectMember = async (req, res) => {
    try {
        const {
            project_id,
            employee_id,
            employee_code
        } = req.body;


        // -------------------------------------------------
        // VALIDATE PROJECT ID
        // -------------------------------------------------

        if (!project_id) {
            return res.status(400).json({
                success: false,
                message: "Project ID is required."
            });
        }

        const projectId = Number(project_id);

        if (!Number.isInteger(projectId)) {
            return res.status(400).json({
                success: false,
                message: "Project ID must be a valid number."
            });
        }


        // -------------------------------------------------
        // CHECK PROJECT EXISTS
        // -------------------------------------------------

        const [projects] = await promiseDb.query(
            `
            SELECT project_id
            FROM projects
            WHERE project_id = ?
            `,
            [projectId]
        );

        if (projects.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found."
            });
        }


        // -------------------------------------------------
        // FIND EMPLOYEE
        //
        // Frontend can send either:
        // employee_id
        // OR
        // employee_code
        // -------------------------------------------------

        let employee = null;

        if (employee_id) {

            const employeeId = Number(employee_id);

            if (!Number.isInteger(employeeId)) {
                return res.status(400).json({
                    success: false,
                    message: "Employee ID must be a valid number."
                });
            }

            const [employees] = await promiseDb.query(
                `
                SELECT
                    emp_id,
                    employee_code,
                    emp_name,
                    email
                FROM employe
                WHERE emp_id = ?
                `,
                [employeeId]
            );

            if (employees.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Employee not found."
                });
            }

            employee = employees[0];

        } else if (employee_code) {

            const [employees] = await promiseDb.query(
                `
                SELECT
                    emp_id,
                    employee_code,
                    emp_name,
                    email
                FROM employe
                WHERE employee_code = ?
                `,
                [employee_code]
            );

            if (employees.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Employee not found."
                });
            }

            employee = employees[0];

        } else {

            return res.status(400).json({
                success: false,
                message: "Employee ID or Employee Code is required."
            });
        }


        // -------------------------------------------------
        // GET EMPLOYEE CODE
        // -------------------------------------------------

        const employeeCode = employee.employee_code;


        // -------------------------------------------------
        // CHECK DUPLICATE ASSIGNMENT
        // -------------------------------------------------

        const [existing] = await promiseDb.query(
            `
            SELECT Project_Member_ID
            FROM project_members
            WHERE Project_ID = ?
              AND employee_code = ?
            `,
            [projectId, employeeCode]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This employee is already assigned to this project."
            });
        }


        // -------------------------------------------------
        // INSERT PROJECT MEMBER
        // -------------------------------------------------

        const [result] = await promiseDb.query(
            `
            INSERT INTO project_members
                (Project_ID, emp_ID, employee_code)
            VALUES
                (?, ?, ?)
            `,
            [projectId, employee.emp_id, employeeCode]
        );


        // -------------------------------------------------
        // SUCCESS RESPONSE
        // -------------------------------------------------

        return res.status(201).json({
            success: true,
            message: "Employee assigned to project successfully.",

            project_member_id: result.insertId,
            project_id: projectId,

            emp_id: employee.emp_id,
            employee_code: employee.employee_code,
            emp_name: employee.emp_name,
            email: employee.email
        });

    } catch (error) {
        console.error("Create project member error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to assign employee to project."
        });
    }
};


// =====================================================
// UPDATE PROJECT MEMBER
// =====================================================

const updateProjectMember = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            project_id,
            employee_id,
            employee_code
        } = req.body;


        // -------------------------------------------------
        // VALIDATE PROJECT
        // -------------------------------------------------

        if (!project_id) {
            return res.status(400).json({
                success: false,
                message: "Project ID is required."
            });
        }

        const projectId = Number(project_id);
        const memberId = Number(id);

        if (
            !Number.isInteger(projectId) ||
            !Number.isInteger(memberId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid project member data."
            });
        }


        // -------------------------------------------------
        // CHECK PROJECT
        // -------------------------------------------------

        const [project] = await promiseDb.query(
            `
            SELECT project_id
            FROM projects
            WHERE project_id = ?
            `,
            [projectId]
        );

        if (project.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found."
            });
        }


        // -------------------------------------------------
        // FIND EMPLOYEE
        // -------------------------------------------------

        let employee = null;

        if (employee_id) {

            const employeeId = Number(employee_id);

            if (!Number.isInteger(employeeId)) {
                return res.status(400).json({
                    success: false,
                    message: "Employee ID must be a valid number."
                });
            }

            const [employees] = await promiseDb.query(
                `
                SELECT
                    emp_id,
                    employee_code,
                    emp_name,
                    email
                FROM employe
                WHERE emp_id = ?
                `,
                [employeeId]
            );

            if (employees.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Employee not found."
                });
            }

            employee = employees[0];

        } else if (employee_code) {

            const [employees] = await promiseDb.query(
                `
                SELECT
                    emp_id,
                    employee_code,
                    emp_name,
                    email
                FROM employe
                WHERE employee_code = ?
                `,
                [employee_code]
            );

            if (employees.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Employee not found."
                });
            }

            employee = employees[0];

        } else {

            return res.status(400).json({
                success: false,
                message: "Employee ID or Employee Code is required."
            });
        }


        const employeeCode = employee.employee_code;


        // -------------------------------------------------
        // CHECK DUPLICATE
        // -------------------------------------------------

        const [existing] = await promiseDb.query(
            `
            SELECT Project_Member_ID
            FROM project_members
            WHERE Project_ID = ?
              AND employee_code = ?
              AND Project_Member_ID != ?
            `,
            [
                projectId,
                employeeCode,
                memberId
            ]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Employee is already assigned to this project."
            });
        }


        // -------------------------------------------------
        // UPDATE
        // -------------------------------------------------

        const [result] = await promiseDb.query(
            `
            UPDATE project_members
            SET
                Project_ID = ?,
                emp_ID = ?,
                employee_code = ?
            WHERE Project_Member_ID = ?
            `,
            [
                projectId,
                employee.emp_id,
                employeeCode,
                memberId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Project member not found."
            });
        }


        // -------------------------------------------------
        // SUCCESS
        // -------------------------------------------------

        return res.status(200).json({
            success: true,
            message: "Project member updated successfully.",

            project_member_id: memberId,
            project_id: projectId,

            emp_id: employee.emp_id,
            employee_code: employee.employee_code,
            emp_name: employee.emp_name,
            email: employee.email
        });

    } catch (error) {
        console.error("Update project member error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update project member."
        });
    }
};


// =====================================================
// DELETE PROJECT MEMBER
// =====================================================

const deleteProjectMember = async (req, res) => {
    try {
        const { id } = req.params;

        const memberId = Number(id);

        if (!Number.isInteger(memberId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project member ID."
            });
        }


        // -------------------------------------------------
        // DELETE
        // -------------------------------------------------

        const [result] = await promiseDb.query(
            `
            DELETE FROM project_members
            WHERE Project_Member_ID = ?
            `,
            [memberId]
        );


        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Project member not found."
            });
        }


        // -------------------------------------------------
        // SUCCESS
        // -------------------------------------------------

        return res.status(200).json({
            success: true,
            message: "Employee removed from project successfully."
        });

    } catch (error) {
        console.error("Delete project member error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to remove employee from project."
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