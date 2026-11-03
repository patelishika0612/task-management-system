
import { promiseDb as db } from "../db.js";

export const getEmployeeCalendar = async (req, res) => {
    try {
        const { employeeId } = req.params;

        if (!employeeId || !/^\d+$/.test(employeeId)) {
            return res.status(400).json({
                success: false,
                message: "Valid employee ID is required",
            });
        }

        // 1. Get employee details
        const [employeeRows] = await db.query(
            `SELECT emp_id, emp_name, employee_code
             FROM employe
             WHERE emp_id = ?
             LIMIT 1`,
            [employeeId]
        );

        if (employeeRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found",
            });
        }

        const employee = employeeRows[0];

        // 2. Get employee projects
        const [projects] = await db.query(
            `SELECT
    p.project_id,
    p.proj_name,
    p.description,
    p.client_name,
    DATE_FORMAT(p.start_date, '%Y-%m-%d') AS start_date,
    DATE_FORMAT(p.end_date, '%Y-%m-%d') AS end_date,
    p.priority,
    p.status
FROM projects p
INNER JOIN project_members pm
    ON pm.project_id = p.project_id
WHERE pm.employee_id = ?
             ORDER BY p.start_date ASC`,
            [employee.emp_id]
        );

        // 3. Get employee tasks
        const [tasks] = await db.query(
            `SELECT
    t.task_id,
    t.task_name,
    t.project_id,
    t.employee_code,
    t.priority,
    t.status,
    DATE_FORMAT(t.start_date, '%Y-%m-%d') AS start_date,
    DATE_FORMAT(t.due_date, '%Y-%m-%d') AS due_date,
    t.description
FROM task t
WHERE t.employee_code = ?
             ORDER BY t.start_date ASC`,
            [String(employee.employee_code || "")]
        );

        return res.status(200).json({
            success: true,
            employee: {
                emp_id: employee.emp_id,
                emp_name: employee.emp_name,
                employee_code: employee.employee_code,
            },
            projects,
            tasks,
        });

    } catch (error) {
        console.error(
            "Employee Calendar Controller Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch employee calendar",
            error: error.message,
        });
    }
};
