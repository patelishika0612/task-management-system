import connection from "../db.js";
import { removeTaskFile } from "../middleware/taskUpload.js";

const db = connection.promise();

const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES = ["pending", "on hold", "completed"];

const TASK_SELECT = `
    SELECT
        t.task_id,
        t.task_name,
        t.project_id,
        p.proj_name,
        p.client_name,
        t.employee_code,
        e.emp_id,
        e.emp_name,
        t.priority,
        t.status,
        t.start_date,
        t.due_date,
        t.description,
        t.comments,
        t.attachments,
        t.created_at,
        t.updated_at
    FROM task t
    LEFT JOIN projects p
        ON t.project_id = p.project_id
    LEFT JOIN employe e
        ON t.employee_code = e.employee_code
`;

// =====================================================
// ENSURE COMMENTS / ATTACHMENTS COLUMNS EXIST
// =====================================================

const ensureTaskColumns = async () => {
    try {
        const [columns] = await db.query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'task'
              AND COLUMN_NAME IN ('comments', 'attachments')
        `);

        const existing = columns.map((column) => column.COLUMN_NAME);

        if (!existing.includes("comments")) {
            await db.query("ALTER TABLE task ADD COLUMN comments TEXT NULL AFTER description");
            console.log("✅ Added `comments` column to task table");
        }

        if (!existing.includes("attachments")) {
            await db.query("ALTER TABLE task ADD COLUMN attachments LONGTEXT NULL AFTER comments");
            console.log("✅ Added `attachments` column to task table");
        }
    } catch (error) {
        console.error("Task column check error:", error.message);
    }
};

ensureTaskColumns();

// =====================================================
// ATTACHMENT HELPERS
// =====================================================

// Stored as a JSON array: [{ file, name, size, type }]
const parseAttachments = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const filesToAttachments = (files = []) =>
    files.map((file) => ({
        file: file.filename,
        name: file.originalname,
        size: file.size,
        type: file.mimetype
    }));

const withAttachmentUrls = (req, row) => ({
    ...row,
    attachments: parseAttachments(row.attachments).map((attachment) => ({
        ...attachment,
        url: `${req.protocol}://${req.get("host")}/uploads/tasks/${attachment.file}`
    }))
});

const cleanupUploads = (req) => {
    (req.files || []).forEach((file) => removeTaskFile(file.filename));
};

// =====================================================
// VALIDATE TASK BODY
// =====================================================

const validateTask = (body) => {
    const {
        task_name,
        project_id,
        employee_code,
        priority,
        status,
        start_date,
        due_date,
        comments
    } = body;

    if (!task_name || !String(task_name).trim()) {
        return "Task name is required";
    }

    if (!project_id) {
        return "Project is required";
    }

    if (!employee_code || !String(employee_code).trim()) {
        return "Employee is required";
    }

    if (priority && !PRIORITIES.includes(priority)) {
        return "Invalid priority";
    }

    if (status && !STATUSES.includes(status)) {
        return "Invalid status";
    }

    if (start_date && due_date && due_date < start_date) {
        return "Due date cannot be before start date";
    }

    if (comments && String(comments).length > 2000) {
        return "Comments cannot exceed 2000 characters";
    }

    return null;
};

const employeeExists = async (employeeCode) => {
    const [rows] = await db.query(
        "SELECT emp_id FROM employe WHERE employee_code = ? LIMIT 1",
        [employeeCode]
    );

    return rows.length > 0;
};

// =====================================================
// GET ALL TASKS
// =====================================================

const getAllTasks = async (req, res) => {
    try {
        const [rows] = await db.query(`
            ${TASK_SELECT}
            ORDER BY t.task_id DESC
        `);

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows.map((row) => withAttachmentUrls(req, row))
        });

    } catch (error) {
        console.error("Get tasks error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch tasks"
        });
    }
};


// =====================================================
// GET TASK BY ID
// =====================================================

const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            ${TASK_SELECT}
            WHERE t.task_id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.status(200).json({
            success: true,
            data: withAttachmentUrls(req, rows[0])
        });

    } catch (error) {
        console.error("Get task error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch task"
        });
    }
};


// =====================================================
// CREATE TASK
// =====================================================

const createTask = async (req, res) => {
    try {
        const validationError = validateTask(req.body);

        if (validationError) {
            cleanupUploads(req);

            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const {
            task_name,
            project_id,
            employee_code,
            priority,
            status,
            start_date,
            due_date,
            description,
            comments
        } = req.body;

        if (!(await employeeExists(String(employee_code).trim()))) {
            cleanupUploads(req);

            return res.status(400).json({
                success: false,
                message: "Selected employee does not exist"
            });
        }

        const attachments = filesToAttachments(req.files);

        const [result] = await db.query(`
            INSERT INTO task
            (
                task_name,
                project_id,
                employee_code,
                priority,
                status,
                start_date,
                due_date,
                description,
                comments,
                attachments
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            String(task_name).trim(),
            project_id,
            String(employee_code).trim(),
            priority || "low",
            status || "pending",
            start_date || null,
            due_date || null,
            description || null,
            comments ? String(comments).trim() || null : null,
            JSON.stringify(attachments)
        ]);

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            task_id: result.insertId
        });

    } catch (error) {
        console.error("Create task error:", error);
        cleanupUploads(req);

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                success: false,
                message: "Selected project or employee does not exist"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create task"
        });
    }
};


// =====================================================
// UPDATE TASK
// =====================================================

const updateTask = async (req, res) => {
    try {
        const { id } = req.params;

        const validationError = validateTask(req.body);

        if (validationError) {
            cleanupUploads(req);

            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const {
            task_name,
            project_id,
            employee_code,
            priority,
            status,
            start_date,
            due_date,
            description,
            comments,
            existing_attachments
        } = req.body;

        const [currentRows] = await db.query(
            "SELECT attachments FROM task WHERE task_id = ?",
            [id]
        );

        if (currentRows.length === 0) {
            cleanupUploads(req);

            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        if (!(await employeeExists(String(employee_code).trim()))) {
            cleanupUploads(req);

            return res.status(400).json({
                success: false,
                message: "Selected employee does not exist"
            });
        }

        // existing_attachments = JSON array of stored file names the user kept.
        // If it is not sent at all, keep every current attachment.
        const currentAttachments = parseAttachments(currentRows[0].attachments);

        let keptAttachments = currentAttachments;

        if (existing_attachments !== undefined) {
            const keepFiles = parseAttachments(existing_attachments);

            keptAttachments = currentAttachments.filter((attachment) =>
                keepFiles.includes(attachment.file)
            );
        }

        const removedAttachments = currentAttachments.filter(
            (attachment) => !keptAttachments.includes(attachment)
        );

        const attachments = [
            ...keptAttachments,
            ...filesToAttachments(req.files)
        ];

        await db.query(`
            UPDATE task
            SET
                task_name = ?,
                project_id = ?,
                employee_code = ?,
                priority = ?,
                status = ?,
                start_date = ?,
                due_date = ?,
                description = ?,
                comments = ?,
                attachments = ?
            WHERE task_id = ?
        `, [
            String(task_name).trim(),
            project_id,
            String(employee_code).trim(),
            priority || "low",
            status || "pending",
            start_date || null,
            due_date || null,
            description || null,
            comments ? String(comments).trim() || null : null,
            JSON.stringify(attachments),
            id
        ]);

        removedAttachments.forEach((attachment) => removeTaskFile(attachment.file));

        res.status(200).json({
            success: true,
            message: "Task updated successfully"
        });

    } catch (error) {
        console.error("Update task error:", error);
        cleanupUploads(req);

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                success: false,
                message: "Selected project or employee does not exist"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update task"
        });
    }
};


// =====================================================
// DELETE TASK
// =====================================================

const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        const [currentRows] = await db.query(
            "SELECT attachments FROM task WHERE task_id = ?",
            [id]
        );

        if (currentRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        await db.query(
            "DELETE FROM task WHERE task_id = ?",
            [id]
        );

        parseAttachments(currentRows[0].attachments).forEach((attachment) =>
            removeTaskFile(attachment.file)
        );

        res.status(200).json({
            success: true,
            message: "Task deleted successfully"
        });

    } catch (error) {
        console.error("Delete task error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete task"
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

export default {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
};
