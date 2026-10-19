
import connection from "../db.js";

const db = connection.promise();

const getAllCalendarEvents = async (req, res) => {
  try {
    const { employee_id, month, year, status } = req.query;

    let sql = `
      SELECT
        c.Event_ID,
        c.Event_Title,
        c.Event_Type,
        c.Project_ID,
        p.proj_name,
        c.Created_By,
        c.Employee_ID,
        e.emp_name AS Employee_Name,
        e.department_id AS Department_ID,
        d.department_name AS Department_Name,
        c.Assigned_Date,
        c.Event_Date,
        c.Deadline,
        c.Start_Time,
        c.End_Time,
        c.Description,
        c.Status,
        c.Created_Date,
        CASE
          WHEN c.Status = 'Completed' THEN 'Completed'
          WHEN c.Deadline IS NOT NULL
               AND c.Deadline < CURDATE() THEN 'Overdue'
          ELSE c.Status
        END AS Current_Status
      FROM calendar_events c
      LEFT JOIN employe e
        ON c.Employee_ID = e.emp_id
      LEFT JOIN departments d
        ON e.department_id = d.department_id
      LEFT JOIN projects p
        ON c.Project_ID = p.Project_ID
      WHERE 1 = 1
    `;

    const params = [];

    if (employee_id) {
      sql += " AND c.Employee_ID = ?";
      params.push(employee_id);
    }

    if (month && year) {
      const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
      const nextMonthDate = new Date(Number(year), Number(month), 1);
      const nextMonthStart = [
        nextMonthDate.getFullYear(),
        String(nextMonthDate.getMonth() + 1).padStart(2, "0"),
        "01"
      ].join("-");

      sql += `
        AND COALESCE(c.Deadline, c.Event_Date) >= ?
        AND COALESCE(c.Assigned_Date, c.Event_Date) < ?
      `;
      params.push(monthStart, nextMonthStart);
    }

    if (status) {
      sql += " AND c.Status = ?";
      params.push(status);
    }

    sql += " ORDER BY COALESCE(c.Assigned_Date, c.Event_Date), c.Start_Time";

    const [rows] = await db.query(sql, params);

    return res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error("Get calendar events:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch calendar events",
      error: error.message
    });
  }
};

const getCalendarEventById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, e.emp_name AS Employee_Name,
              p.proj_name,
              d.department_name AS Department_Name,
              CASE
                WHEN c.Status = 'Completed' THEN 'Completed'
                WHEN c.Deadline IS NOT NULL
                     AND c.Deadline < CURDATE() THEN 'Overdue'
                ELSE c.Status
              END AS Current_Status
       FROM calendar_events c
       LEFT JOIN employe e ON c.Employee_ID = e.emp_id
       LEFT JOIN departments d ON e.department_id = d.department_id
       LEFT JOIN projects p ON c.Project_ID = p.Project_ID
       WHERE c.Event_ID = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found"
      });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Get calendar event:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch calendar event"
    });
  }
};

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
      Status = "Scheduled"
    } = req.body;

    if (!Event_Title?.trim() || !Created_By || !Event_Date) {
      return res.status(400).json({
        success: false,
        message: "Event_Title, Created_By and Event_Date are required"
      });
    }

    const allowedStatuses = ["Scheduled", "In Progress", "Completed"];

    if (!allowedStatuses.includes(Status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    if (Assigned_Date && Deadline && Deadline < Assigned_Date) {
      return res.status(400).json({
        success: false,
        message: "Deadline cannot be before Assigned_Date"
      });
    }

    if (Start_Time && End_Time && End_Time < Start_Time) {
      return res.status(400).json({
        success: false,
        message: "End_Time cannot be before Start_Time"
      });
    }

    const [result] = await db.query(
      `INSERT INTO calendar_events
       (Event_Title, Event_Type, Project_ID, Created_By, Employee_ID,
        Assigned_Date, Event_Date, Deadline, Start_Time, End_Time,
        Description, Status)
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
        Status
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Calendar event created successfully",
      data: { Event_ID: result.insertId }
    });
  } catch (error) {
    console.error("Create calendar event:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create calendar event",
      error: error.message
    });
  }
};

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
      Status = "Scheduled"
    } = req.body;

    if (!Event_Title?.trim() || !Created_By || !Event_Date) {
      return res.status(400).json({
        success: false,
        message: "Event_Title, Created_By and Event_Date are required"
      });
    }

    if (!["Scheduled", "In Progress", "Completed"].includes(Status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    if (Assigned_Date && Deadline && Deadline < Assigned_Date) {
      return res.status(400).json({
        success: false,
        message: "Deadline cannot be before Assigned_Date"
      });
    }

    const [result] = await db.query(
      `UPDATE calendar_events SET
        Event_Title = ?, Event_Type = ?, Project_ID = ?, Created_By = ?,
        Employee_ID = ?, Assigned_Date = ?, Event_Date = ?, Deadline = ?,
        Start_Time = ?, End_Time = ?, Description = ?, Status = ?
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
        req.params.id
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found"
      });
    }

    return res.json({
      success: true,
      message: "Calendar event updated successfully"
    });
  } catch (error) {
    console.error("Update calendar event:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update calendar event"
    });
  }
};

const updateCalendarStatus = async (req, res) => {
  try {
    const { Status } = req.body;

    if (!["Scheduled", "In Progress", "Completed"].includes(Status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const [result] = await db.query(
      "UPDATE calendar_events SET Status = ? WHERE Event_ID = ?",
      [Status, req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found"
      });
    }

    return res.json({
      success: true,
      message: "Calendar status updated successfully"
    });
  } catch (error) {
    console.error("Update calendar status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update calendar status"
    });
  }
};

const deleteCalendarEvent = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM calendar_events WHERE Event_ID = ?",
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found"
      });
    }

    return res.json({
      success: true,
      message: "Calendar event deleted successfully"
    });
  } catch (error) {
    console.error("Delete calendar event:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete calendar event"
    });
  }
};

export default {
  getAllCalendarEvents,
  getCalendarEventById,
  createCalendarEvent,
  updateCalendarEvent,
  updateCalendarStatus,
  deleteCalendarEvent
};
