
import connection from "../db.js";

const db = connection.promise();

// ==========================================
// GET ALL HR CALENDAR EVENTS
// ==========================================
// Date ને YYYY-MM-DD format માં જ રાખવા માટે
const dateOnly = (value) => {
  if (!value) return "";

  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);

  return match ? match[1] : "";
};


// ==========================================
// GET ALL HR CALENDAR EVENTS
// ==========================================
const getAllCalendarEvents = async (req, res) => {
  try {
    const { employee_id, month, year, status } = req.query;

    const hasMonthFilter = Boolean(month && year);

    if (
      hasMonthFilter &&
      (
        Number(month) < 1 ||
        Number(month) > 12 ||
        !/^\d{4}$/.test(String(year))
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid month or year",
      });
    }

    const monthStart = hasMonthFilter
      ? `${year}-${String(month).padStart(2, "0")}-01`
      : null;

    // ======================================
    // 1. FETCH TASKS
    // ======================================
    let taskSql = `
      SELECT
        t.task_id,
        t.task_name,
        t.project_id,
        p.proj_name,
        t.employee_code,

        e.emp_id AS Employee_ID,
        e.emp_name AS Employee_Name,

        e.department_id AS Department_ID,
        d.department_name AS Department_Name,

        DATE_FORMAT(t.start_date, '%Y-%m-%d') AS Start_Date,
        DATE_FORMAT(t.due_date, '%Y-%m-%d') AS Due_Date,

        t.description,
        t.priority,
        t.status

      FROM task t

      LEFT JOIN projects p
        ON t.project_id = p.project_id

      LEFT JOIN employe e
        ON t.employee_code = e.employee_code

      LEFT JOIN departments d
        ON e.department_id = d.department_id

      WHERE 1 = 1
    `;

    const taskParams = [];

    if (employee_id) {
      taskSql += " AND e.emp_id = ?";
      taskParams.push(employee_id);
    }

    if (hasMonthFilter) {
      taskSql += `
        AND (
          (
            t.start_date >= ?
            AND t.start_date < DATE_ADD(?, INTERVAL 1 MONTH)
          )
          OR
          (
            t.due_date >= ?
            AND t.due_date < DATE_ADD(?, INTERVAL 1 MONTH)
          )
        )
      `;

      taskParams.push(
        monthStart,
        monthStart,
        monthStart,
        monthStart
      );
    }

    if (status) {
      taskSql += " AND t.status = ?";
      taskParams.push(status);
    }

    taskSql += " ORDER BY t.start_date ASC";

    const [taskRows] = await db.query(taskSql, taskParams);

    // ======================================
    // 2. FETCH PROJECTS
    // ======================================
    let projectSql = `
      SELECT
        p.project_id,
        p.proj_name,
        p.description,
        p.client_name,

        DATE_FORMAT(p.start_date, '%Y-%m-%d') AS Start_Date,
        DATE_FORMAT(p.end_date, '%Y-%m-%d') AS End_Date,

        p.priority,
        p.status,

        GROUP_CONCAT(
          DISTINCT e.emp_name
          SEPARATOR ', '
        ) AS Employee_Name,

        GROUP_CONCAT(
          DISTINCT e.emp_id
          SEPARATOR ','
        ) AS Employee_IDs

      FROM projects p

      LEFT JOIN project_members pm
        ON p.project_id = pm.project_id

      LEFT JOIN employe e
        ON pm.employee_id = e.emp_id

      WHERE 1 = 1
    `;

    const projectParams = [];

    if (employee_id) {
      projectSql += `
        AND EXISTS (
          SELECT 1
          FROM project_members pm2
          WHERE pm2.project_id = p.project_id
          AND pm2.employee_id = ?
        )
      `;

      projectParams.push(employee_id);
    }

    if (hasMonthFilter) {
      projectSql += `
        AND (
          (
            p.start_date >= ?
            AND p.start_date < DATE_ADD(?, INTERVAL 1 MONTH)
          )
          OR
          (
            p.end_date >= ?
            AND p.end_date < DATE_ADD(?, INTERVAL 1 MONTH)
          )
        )
      `;

      projectParams.push(
        monthStart,
        monthStart,
        monthStart,
        monthStart
      );
    }

    if (status) {
      projectSql += " AND p.status = ?";
      projectParams.push(status);
    }

    projectSql += `
      GROUP BY p.project_id
      ORDER BY p.start_date ASC
    `;

    const [projectRows] = await db.query(
      projectSql,
      projectParams
    );

    // ======================================
    // 3. FETCH MANUAL CALENDAR EVENTS
    // ======================================
    let eventSql = `
      SELECT
        c.*,

        DATE_FORMAT(c.Assigned_Date, '%Y-%m-%d')
          AS Calendar_Assigned_Date,

        DATE_FORMAT(c.Event_Date, '%Y-%m-%d')
          AS Calendar_Event_Date,

        DATE_FORMAT(c.Deadline, '%Y-%m-%d')
          AS Calendar_Deadline,

        e.emp_name AS Employee_Name,
        e.department_id AS Department_ID,
        d.department_name AS Department_Name,
        p.proj_name

      FROM calendar_events c

      LEFT JOIN employe e
        ON c.Employee_ID = e.emp_id

      LEFT JOIN departments d
        ON e.department_id = d.department_id

      LEFT JOIN projects p
        ON c.Project_ID = p.project_id

      WHERE 1 = 1
    `;

    const eventParams = [];

    if (employee_id) {
      eventSql += " AND c.Employee_ID = ?";
      eventParams.push(employee_id);
    }

    if (hasMonthFilter) {
      eventSql += `
        AND (
          (
            c.Assigned_Date >= ?
            AND c.Assigned_Date < DATE_ADD(?, INTERVAL 1 MONTH)
          )
          OR
          (
            c.Event_Date >= ?
            AND c.Event_Date < DATE_ADD(?, INTERVAL 1 MONTH)
          )
          OR
          (
            c.Deadline >= ?
            AND c.Deadline < DATE_ADD(?, INTERVAL 1 MONTH)
          )
        )
      `;

      eventParams.push(
        monthStart,
        monthStart,
        monthStart,
        monthStart,
        monthStart,
        monthStart
      );
    }

    if (status) {
      eventSql += " AND c.Status = ?";
      eventParams.push(status);
    }

    const [manualEvents] = await db.query(
      eventSql,
      eventParams
    );

    // ======================================
    // 4. CONVERT TASKS INTO CALENDAR EVENTS
    // ======================================
    const taskEvents = [];

    taskRows.forEach((task) => {
      const startDate = dateOnly(task.Start_Date);
      const dueDate = dateOnly(task.Due_Date);

      const commonTaskData = {
        Source_ID: task.task_id,
        Source: "task",

        Description: task.description || "",

        Status: task.status || "Pending",
        Current_Status: task.status || "Pending",

        Priority: task.priority || "Medium",

        Employee_ID: task.Employee_ID || "",
        Employee_Name: task.Employee_Name || "Unassigned",

        Department_ID: task.Department_ID || "",
        Department_Name: task.Department_Name || "—",

        Project_ID: task.project_id || "",
        Project_Name: task.proj_name || "—",

        Task_Name: task.task_name,
        Employee_Code: task.employee_code,

        Start_Date: startDate,
        Due_Date: dueDate,
      };

      // TASK START EVENT - ONLY ON START DATE
      if (startDate) {
        taskEvents.push({
          ...commonTaskData,

          Event_ID: `task-${task.task_id}-start`,
          Event_Title: `${task.task_name} (Start)`,
          Event_Type: "Task Start",

          Event_Date: startDate,
          Assigned_Date: startDate,
          Deadline: dueDate,
        });
      }

      // TASK DEADLINE EVENT - ONLY ON DUE DATE
      if (dueDate) {
        taskEvents.push({
          ...commonTaskData,

          Event_ID: `task-${task.task_id}-due`,
          Event_Title: `${task.task_name} (Deadline)`,
          Event_Type: "Task Deadline",

          Event_Date: dueDate,
          Assigned_Date: startDate,
          Deadline: dueDate,
        });
      }
    });

    // ======================================
    // 5. CONVERT PROJECTS INTO CALENDAR EVENTS
    // ======================================
    const projectEvents = [];

    projectRows.forEach((project) => {
      const startDate = dateOnly(project.Start_Date);
      const endDate = dateOnly(project.End_Date);

      const commonProjectData = {
        Source_ID: project.project_id,
        Source: "project",

        Description: project.description || "",

        Status: project.status || "Pending",
        Current_Status: project.status || "Pending",

        Priority: project.priority || "Medium",

        Employee_Name: project.Employee_Name || "Unassigned",
        Employee_ID: project.Employee_IDs || "",

        Project_ID: project.project_id,
        Project_Name: project.proj_name || "",
        Client_Name: project.client_name || "",

        Start_Date: startDate,
        End_Date: endDate,
      };

      // PROJECT START EVENT
      if (startDate) {
        projectEvents.push({
          ...commonProjectData,

          Event_ID: `project-${project.project_id}-start`,
          Event_Title: `${project.proj_name} (Start)`,
          Event_Type: "Project Start",

          Event_Date: startDate,
        });
      }

      // PROJECT END EVENT
      if (endDate) {
        projectEvents.push({
          ...commonProjectData,

          Event_ID: `project-${project.project_id}-end`,
          Event_Title: `${project.proj_name} (End)`,
          Event_Type: "Project End",

          Event_Date: endDate,
        });
      }
    });

    // ======================================
    // 6. MANUAL CALENDAR EVENTS
    // ======================================
    const today = new Date();
    const todayKey = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const manualEventData = manualEvents.map((event) => {
      const deadline = dateOnly(event.Calendar_Deadline);
      const eventDate = dateOnly(event.Calendar_Event_Date);
      const assignedDate = dateOnly(event.Calendar_Assigned_Date);

      const currentStatus =
        event.Status === "Completed"
          ? "Completed"
          : deadline && deadline < todayKey
            ? "Overdue"
            : event.Status;

      return {
        ...event,

        Source: "calendar",
        Source_ID: event.Event_ID,

        Assigned_Date: assignedDate,
        Event_Date: eventDate,
        Deadline: deadline,

        Project_Name: event.proj_name || "—",
        Current_Status: currentStatus,
      };
    });

    // ======================================
    // 7. COMBINE ALL EVENTS
    // ======================================
    const allEvents = [
      ...taskEvents,
      ...projectEvents,
      ...manualEventData,
    ];

    // Sort by exact event date
    allEvents.sort((a, b) => {
      return String(a.Event_Date || "").localeCompare(
        String(b.Event_Date || "")
      );
    });

    return res.status(200).json({
      success: true,
      count: allEvents.length,
      data: allEvents,
    });

  } catch (error) {
    console.error("Get HR calendar events:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch HR calendar events",
      error: error.message,
    });
  }
};

// ==========================================
// GET CALENDAR EVENT BY ID
// ==========================================
const getCalendarEventById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        c.*,
        e.emp_name AS Employee_Name,
        p.proj_name,
        d.department_name AS Department_Name
       FROM calendar_events c
       LEFT JOIN employe e
         ON c.Employee_ID = e.emp_id
       LEFT JOIN departments d
         ON e.department_id = d.department_id
       LEFT JOIN projects p
         ON c.Project_ID = p.project_id
       WHERE c.Event_ID = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found",
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });

  } catch (error) {
    console.error("Get calendar event:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch calendar event",
      error: error.message,
    });
  }
};


// ==========================================
// CREATE CALENDAR EVENT
// ==========================================
const createCalendarEvent = async (req, res) => {
  try {
    const {
      Event_Title,
      Event_Type = "Task",
      Project_ID,
      Created_By,
      Employee_ID,
      Assigned_Date,
      Event_Date,
      Deadline,
      Start_Time,
      End_Time,
      Description,
      Status = "Scheduled",
    } = req.body;

    if (!Event_Title?.trim() || !Created_By || !Event_Date) {
      return res.status(400).json({
        success: false,
        message: "Event_Title, Created_By and Event_Date are required",
      });
    }

    const allowedStatuses = [
      "Scheduled",
      "In Progress",
      "Completed",
    ];

    if (!allowedStatuses.includes(Status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    if (Assigned_Date && Deadline && Deadline < Assigned_Date) {
      return res.status(400).json({
        success: false,
        message: "Deadline cannot be before Assigned_Date",
      });
    }

    if (Start_Time && End_Time && End_Time < Start_Time) {
      return res.status(400).json({
        success: false,
        message: "End_Time cannot be before Start_Time",
      });
    }

    const [result] = await db.query(
      `INSERT INTO calendar_events
       (
         Event_Title,
         Event_Type,
         Project_ID,
         Created_By,
         Employee_ID,
         Assigned_Date,
         Event_Date,
         Deadline,
         Start_Time,
         End_Time,
         Description,
         Status
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Event_Title.trim(),
        Event_Type,
        Project_ID || null,
        Created_By,
        Employee_ID || null,
        Assigned_Date || null,
        Event_Date,
        Deadline || null,
        Start_Time || null,
        End_Time || null,
        Description || null,
        Status,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Calendar event created successfully",
      data: {
        Event_ID: result.insertId,
      },
    });

  } catch (error) {
    console.error("Create calendar event:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create calendar event",
      error: error.message,
    });
  }
};


// ==========================================
// UPDATE CALENDAR EVENT
// ==========================================
const updateCalendarEvent = async (req, res) => {
  try {
    const {
      Event_Title,
      Event_Type = "Task",
      Project_ID,
      Created_By,
      Employee_ID,
      Assigned_Date,
      Event_Date,
      Deadline,
      Start_Time,
      End_Time,
      Description,
      Status = "Scheduled",
    } = req.body;

    if (!Event_Title?.trim() || !Created_By || !Event_Date) {
      return res.status(400).json({
        success: false,
        message: "Event_Title, Created_By and Event_Date are required",
      });
    }

    if (!["Scheduled", "In Progress", "Completed"].includes(Status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    if (Assigned_Date && Deadline && Deadline < Assigned_Date) {
      return res.status(400).json({
        success: false,
        message: "Deadline cannot be before Assigned_Date",
      });
    }

    const [result] = await db.query(
      `UPDATE calendar_events SET
        Event_Title = ?,
        Event_Type = ?,
        Project_ID = ?,
        Created_By = ?,
        Employee_ID = ?,
        Assigned_Date = ?,
        Event_Date = ?,
        Deadline = ?,
        Start_Time = ?,
        End_Time = ?,
        Description = ?,
        Status = ?
       WHERE Event_ID = ?`,
      [
        Event_Title.trim(),
        Event_Type,
        Project_ID || null,
        Created_By,
        Employee_ID || null,
        Assigned_Date || null,
        Event_Date,
        Deadline || null,
        Start_Time || null,
        End_Time || null,
        Description || null,
        Status,
        req.params.id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found",
      });
    }

    return res.json({
      success: true,
      message: "Calendar event updated successfully",
    });

  } catch (error) {
    console.error("Update calendar event:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update calendar event",
      error: error.message,
    });
  }
};


// ==========================================
// UPDATE MANUAL CALENDAR STATUS
// ==========================================
const updateCalendarStatus = async (req, res) => {
  try {
    const { Status } = req.body;

    if (!["Scheduled", "In Progress", "Completed"].includes(Status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const [result] = await db.query(
      "UPDATE calendar_events SET Status = ? WHERE Event_ID = ?",
      [Status, req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found",
      });
    }

    return res.json({
      success: true,
      message: "Calendar status updated successfully",
    });

  } catch (error) {
    console.error("Update calendar status:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update calendar status",
      error: error.message,
    });
  }
};


// ==========================================
// UPDATE ACTUAL TASK STATUS
// ==========================================
const updateTaskCalendarStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Task status is required",
      });
    }

    const [result] = await db.query(
      `UPDATE task
       SET status = ?, updated_at = NOW()
       WHERE task_id = ?`,
      [status, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.json({
      success: true,
      message: "Task status updated successfully",
    });

  } catch (error) {
    console.error("Update task calendar status:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update task status",
      error: error.message,
    });
  }
};


// ==========================================
// DELETE MANUAL CALENDAR EVENT
// ==========================================
const deleteCalendarEvent = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM calendar_events WHERE Event_ID = ?",
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found",
      });
    }

    return res.json({
      success: true,
      message: "Calendar event deleted successfully",
    });

  } catch (error) {
    console.error("Delete calendar event:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete calendar event",
      error: error.message,
    });
  }
};


// ==========================================
// EXPORT ALL CONTROLLERS
// ==========================================
export default {
  getAllCalendarEvents,
  getCalendarEventById,
  createCalendarEvent,
  updateCalendarEvent,
  updateCalendarStatus,
  updateTaskCalendarStatus,
  deleteCalendarEvent,
};
