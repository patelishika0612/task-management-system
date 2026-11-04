
import connection from "../db.js";
import { removeTaskFile } from "../middleware/taskUpload.js";
import { createNotification } from "../utils/notificationService.js";

const db = connection.promise();

const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES = ["not started", "in progress", "on hold", "completed"];

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
            await db.query(
                "ALTER TABLE task ADD COLUMN comments TEXT NULL AFTER description"
            );
            console.log("Added comments column to task table");
        }

        if (!existing.includes("attachments")) {
            await db.query(
                "ALTER TABLE task ADD COLUMN attachments LONGTEXT NULL AFTER comments"
            );
            console.log("Added attachments column to task table");
        }
    } catch (error) {
        console.error("Task column check error:", error.message);
    }
};

ensureTaskColumns();

// =====================================================
// ATTACHMENT HELPERS
// =====================================================

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
    (req.files || []).forEach((file) => {
        removeTaskFile(file.filename);
    });
};

// =====================================================
// EMPLOYEE HELPER
// =====================================================

const getEmployeeByCode = async (employeeCode) => {
    const [rows] = await db.query(
        `SELECT emp_id, emp_name, employee_code
         FROM employe
         WHERE employee_code = ?
         LIMIT 1`,
        [String(employeeCode).trim()]
    );

    return rows[0] || null;
};

const employeeExists = async (employeeCode) => {
    const employee = await getEmployeeByCode(employeeCode);
    return Boolean(employee);
};

// =====================================================
// NOTIFICATION HELPER
// =====================================================

const notifyTaskEmployee = async ({
    employeeId,
    title,
    message,
    type,
    taskId,
    eventKey = null
}) => {
    if (!employeeId) return;

    try {
        await createNotification({
            recipientId: employeeId,
            recipientType: "employee",
            title,
            message,
            type,
            referenceId: Number(taskId),
            referenceType: "task",
            url: "/employeedashboard",
            eventKey
        });
    } catch (error) {
        // Notification failure must not stop task operations.
        console.error("Task notification error:", error.message);
    }
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

// =====================================================
// GET ALL TASKS
// =====================================================

const getAllTasks = async (req, res) => {
    try {
        const [rows] = await db.query(`
            ${TASK_SELECT}
            ORDER BY t.task_id DESC
        `);

        return res.status(200).json({
            success: true,
            count: rows.length,
            data: rows.map((row) => withAttachmentUrls(req, row))
        });
    } catch (error) {
        console.error("Get tasks error:", error);

        return res.status(500).json({
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

        const [rows] = await db.query(
            `${TASK_SELECT} WHERE t.task_id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: withAttachmentUrls(req, rows[0])
        });
    } catch (error) {
        console.error("Get task error:", error);

        return res.status(500).json({
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

        const assignedEmployee = await getEmployeeByCode(employee_code);

        if (!assignedEmployee) {
            cleanupUploads(req);

            return res.status(400).json({
                success: false,
                message: "Selected employee does not exist"
            });
        }

        const attachments = filesToAttachments(req.files);

        // First create the task.
        const [result] = await db.query(
            `INSERT INTO task
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
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                String(task_name).trim(),
                project_id,
                String(employee_code).trim(),
                priority || "low",
               status || "not started",
                start_date || null,
                due_date || null,
                description || null,
                comments ? String(comments).trim() || null : null,
                JSON.stringify(attachments)
            ]
        );

        // Notify assigned employee after task creation.
        await notifyTaskEmployee({
            employeeId: assignedEmployee.emp_id,
            title: "New Task Assigned",
            message: `You have been assigned a new task: ${String(task_name).trim()}`,
            type: "task_assigned",
            taskId: result.insertId,
            eventKey: `task-created-${result.insertId}`
        });

        return res.status(201).json({
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

        return res.status(500).json({
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

        // Get existing task details.
        const [currentRows] = await db.query(
            `SELECT
                attachments,
                employee_code,
                status,
                task_name
             FROM task
             WHERE task_id = ?
             LIMIT 1`,
            [id]
        );

        if (currentRows.length === 0) {
            cleanupUploads(req);

            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const currentTask = currentRows[0];

        // Check new assigned employee.
        const assignedEmployee = await getEmployeeByCode(employee_code);

        if (!assignedEmployee) {
            cleanupUploads(req);

            return res.status(400).json({
                success: false,
                message: "Selected employee does not exist"
            });
        }

        // Handle existing attachments.
        const currentAttachments = parseAttachments(
            currentTask.attachments
        );

        let keptAttachments = currentAttachments;

        if (existing_attachments !== undefined) {
            const keepFiles = parseAttachments(existing_attachments);

            const keepFileNames = keepFiles.map((item) =>
                typeof item === "string" ? item : item.file
            );

            keptAttachments = currentAttachments.filter((attachment) =>
                keepFileNames.includes(attachment.file)
            );
        }

        const removedAttachments = currentAttachments.filter(
            (attachment) =>
                !keptAttachments.some(
                    (kept) => kept.file === attachment.file
                )
        );

        const attachments = [
            ...keptAttachments,
            ...filesToAttachments(req.files)
        ];

        // Update task.
        await db.query(
            `UPDATE task
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
                attachments = ?,
                updated_at = NOW()
             WHERE task_id = ?`,
            [
                String(task_name).trim(),
                project_id,
                String(employee_code).trim(),
                priority || "low",
                status || "not started",
                start_date || null,
                due_date || null,
                description || null,
                comments ? String(comments).trim() || null : null,
                JSON.stringify(attachments),
                id
            ]
        );

        // Remove deleted attachment files.
        removedAttachments.forEach((attachment) => {
            removeTaskFile(attachment.file);
        });

        // Notify the currently assigned employee.
        await notifyTaskEmployee({
            employeeId: assignedEmployee.emp_id,
            title: "Task Updated",
            message: `Task "${String(task_name).trim()}" has been updated.`,
            type: "task_updated",
            taskId: id
        });

        // Send an additional notification only if status changed.
       const newStatus = status || "not started";

        if (currentTask.status !== newStatus) {
            await notifyTaskEmployee({
                employeeId: assignedEmployee.emp_id,
                title: "Task Status Updated",
                message: `Task "${String(task_name).trim()}" status changed to ${newStatus}.`,
                type: "task_status",
                taskId: id
            });
        }

        return res.status(200).json({
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

        return res.status(500).json({
            success: false,
            message: "Failed to update task"
        });
    }
};

// =====================================================
// UPDATE TASK STATUS
// =====================================================

export const updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

        if (!STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status"
            });
        }

        // Fetch task before updating.
        const [taskRows] = await db.query(
            `SELECT
                t.task_id,
                t.task_name,
                t.status,
                e.emp_id
             FROM task t
             LEFT JOIN employe e
                ON t.employee_code = e.employee_code
             WHERE t.task_id = ?
             LIMIT 1`,
            [id]
        );

        if (taskRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const task = taskRows[0];

        // Update status.
        await db.query(
            `UPDATE task
             SET status = ?, updated_at = NOW()
             WHERE task_id = ?`,
            [status, id]
        );

        // Notify only if the status actually changed.
        if (task.status !== status && task.emp_id) {
            await notifyTaskEmployee({
                employeeId: task.emp_id,
                title: "Task Status Updated",
                message: `Task "${task.task_name}" status changed to ${status}.`,
                type: "task_status",
                taskId: id
            });
        }

        return res.status(200).json({
            success: true,
            message: "Task status updated successfully"
        });

    } catch (error) {
        console.error("Update task status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update task status"
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
            `SELECT attachments
             FROM task
             WHERE task_id = ?
             LIMIT 1`,
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

        parseAttachments(currentRows[0].attachments).forEach(
            (attachment) => removeTaskFile(attachment.file)
        );

        return res.status(200).json({
            success: true,
            message: "Task deleted successfully"
        });

    } catch (error) {
        console.error("Delete task error:", error);

        return res.status(500).json({
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
    updateTaskStatus,
    deleteTask
};
