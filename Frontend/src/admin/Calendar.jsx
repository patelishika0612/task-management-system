
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock3,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  User,
} from "lucide-react";

import AdminLayout from "../components/AdminLayout";
import API from "../api";
import "./AdminCalendar.css";

const EMPTY_FORM = {
  Event_Title: "",
  Event_Type: "Project Deadline",
  Project_ID: "",
  Created_By: "",
  Employee_ID: "",
  Assigned_Date: "",
  Event_Date: "",
  Deadline: "",
  Start_Time: "",
  End_Time: "",
  Description: "",
  Status: "Scheduled",
};

const Calendar = () => {
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [filters, setFilters] = useState({
    employee: "All Employees",
    department: "All Departments",
    project: "All Projects",
    eventType: "All Events",
    status: "all",
  });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const dateKey = (value) => {
    if (!value) return "";
    const match = String(value).match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "" : formatDate(parsed);
  };

  const normalizeTask = (item) => ({
    id: item.Event_ID,
    title: item.Event_Title || "Untitled event",
    description: item.Description || "",
    startDate: item.Assigned_Date || item.Event_Date,
    endDate: item.Deadline || item.Event_Date,
    status:
      item.Current_Status === "Overdue"
        ? "Overdue"
        : item.Status === "Scheduled"
          ? "Pending"
          : item.Status || "Pending",
    rawStatus: item.Status || "Scheduled",
    priority: item.Priority || "Medium",
    employee: item.Employee_Name || "Unassigned",
    employeeId: item.Employee_ID || "",
    department:
      item.Department_Name || item.department_name || "—",
    project:
      item.Project_Name ||
      (item.Project_ID ? `Project #${item.Project_ID}` : "—"),
    projectId: item.Project_ID || "",
    eventType: item.Event_Type || "Task",
  });

  const fetchCalendarEvents = useCallback(async () => {
    setLoading(true);
    setApiError("");

    try {
      const response = await API.get("/calendar", {
        params: {
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
        },
      });

      const result = response.data;
      if (result.success === false) {
        throw new Error(result.message || "Unable to load calendar");
      }

      const records = Array.isArray(result.data) ? result.data : [];
      setTasks(records.map(normalizeTask));
    } catch (error) {
      console.error("Calendar API error:", error.response?.data || error);
      setApiError(
        error.response?.data?.message ||
        error.message ||
        "Unable to load calendar events"
      );
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchCalendarEvents();
  }, [fetchCalendarEvents]);

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const employeeMatch =
      filters.employee === "All Employees" ||
      task.employee === filters.employee;
    const departmentMatch =
      filters.department === "All Departments" ||
      task.department === filters.department;
    const projectMatch =
      filters.project === "All Projects" ||
      task.project === filters.project;
    const typeMatch =
      filters.eventType === "All Events" ||
      task.eventType === filters.eventType;
    const statusMatch =
      filters.status === "all" ||
      task.status === filters.status;

    return employeeMatch && departmentMatch &&
      projectMatch && typeMatch && statusMatch;
  }), [tasks, filters]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let i = firstDay.getDay() - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, firstDay.getDate() - i - 1),
        currentMonth: false,
      });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push({ date: new Date(year, month, day), currentMonth: true });
    }

    let nextDay = 1;
    while (days.length < 42) {
      days.push({
        date: new Date(year, month + 1, nextDay++),
        currentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  const getTasksForDate = (date) => {
    const current = formatDate(date);

    return filteredTasks.filter((task) => {
      const start = dateKey(task.startDate);
      const end = dateKey(task.endDate);
      return start && end && current >= start && current <= end;
    });
  };

  const updateFilter = (field, value) => {
    setFilters((previous) => ({ ...previous, [field]: value }));
  };

  const clearFilters = () => setFilters({
    employee: "All Employees",
    department: "All Departments",
    project: "All Projects",
    eventType: "All Events",
    status: "all",
  });

  const goToMonth = (offset) => {
    setCurrentDate(new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + offset,
      1
    ));
  };

  const goToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const uniqueOptions = (field) => [
    ...new Set(tasks.map((task) => task[field]).filter(
      (value) => value && value !== "—" && value !== "Unassigned"
    )),
  ];

  const upcomingTasks = filteredTasks.filter((task) => {
    const end = dateKey(task.endDate);
    return end >= formatDate(today) && task.status !== "Completed";
  }).sort((a, b) => dateKey(a.endDate).localeCompare(dateKey(b.endDate)));

  const overdueTasks = filteredTasks.filter((task) => {
    const end = dateKey(task.endDate);
    return end && end < formatDate(today) && task.status !== "Completed";
  });

  const completedTasks = filteredTasks.filter(
    (task) => task.status === "Completed"
  );

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setApiError("");

    try {
      const payload = {
        ...form,
        Project_ID: form.Project_ID || null,
        Employee_ID: form.Employee_ID || null,
        Assigned_Date: form.Assigned_Date || null,
        Deadline: form.Deadline || null,
        Start_Time: form.Start_Time || null,
        End_Time: form.End_Time || null,
      };

      const response = await API.post("/calendar", payload);

      if (response.data.success === false) {
        throw new Error(response.data.message || "Unable to create event");
      }

      setShowForm(false);
      setForm(EMPTY_FORM);
      await fetchCalendarEvents();
    } catch (error) {
      setApiError(
        error.response?.data?.message ||
        error.message ||
        "Unable to create calendar event"
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;

    try {
      await API.delete(`/calendar/${task.id}`);
      setSelectedTask(null);
      await fetchCalendarEvents();
    } catch (error) {
      setApiError(
        error.response?.data?.message || "Unable to delete event"
      );
    }
  };

  return (
    <AdminLayout>
      <div className="admin-calendar-page">
        <header className="admin-calendar-header">
          <div>
            <h1><CalendarDays size={24} /> Calendar</h1>
            <p>Track tasks, deadlines and project activities</p>
          </div>
          <div className="calendar-actions">
            <button type="button" onClick={goToToday}>Today</button>
            <button type="button" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Add Event
            </button>
          </div>
        </header>

        {apiError && (
          <div className="calendar-empty-state" role="alert">
            {apiError}
            <button type="button" onClick={fetchCalendarEvents}>Retry</button>
          </div>
        )}
        {loading && <p>Loading calendar events...</p>}

        <section className="admin-calendar-filter-card">
          <div className="admin-calendar-filters">
            <label>
              Employee
              <select value={filters.employee}
                onChange={(e) => updateFilter("employee", e.target.value)}>
                <option>All Employees</option>
                {uniqueOptions("employee").map((value) =>
                  <option key={value}>{value}</option>
                )}
              </select>
            </label>

            <label>
              Department
              <select value={filters.department}
                onChange={(e) => updateFilter("department", e.target.value)}>
                <option>All Departments</option>
                {uniqueOptions("department").map((value) =>
                  <option key={value}>{value}</option>
                )}
              </select>
            </label>

            <label>
              Project
              <select value={filters.project}
                onChange={(e) => updateFilter("project", e.target.value)}>
                <option>All Projects</option>
                {uniqueOptions("project").map((value) =>
                  <option key={value}>{value}</option>
                )}
              </select>
            </label>

            <label>
              Event Type
              <select value={filters.eventType}
                onChange={(e) => updateFilter("eventType", e.target.value)}>
                <option>All Events</option>
                {uniqueOptions("eventType").map((value) =>
                  <option key={value}>{value}</option>
                )}
              </select>
            </label>

            <label>
              Status
              <select value={filters.status}
                onChange={(e) => updateFilter("status", e.target.value)}>
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
              </select>
            </label>

            <button type="button" onClick={clearFilters}>Clear Filters</button>
          </div>
        </section>

        <section className="admin-calendar-stats">
          <div className="admin-calendar-stat-card">
            <ClipboardList /> <span>Total Events</span>
            <strong>{filteredTasks.length}</strong>
          </div>
          <div className="admin-calendar-stat-card">
            <Clock3 /> <span>Upcoming</span>
            <strong>{upcomingTasks.length}</strong>
          </div>
          <div className="admin-calendar-stat-card">
            <AlertCircle /> <span>Overdue</span>
            <strong>{overdueTasks.length}</strong>
          </div>
          <div className="admin-calendar-stat-card">
            <CheckCircle2 /> <span>Completed</span>
            <strong>{completedTasks.length}</strong>
          </div>
        </section>

        <section className="admin-calendar-main">
          <div className="admin-calendar-toolbar">
            <div className="admin-calendar-month">
              <button type="button" onClick={() => goToMonth(-1)}>
                <ChevronLeft />
              </button>
              <h2>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button type="button" onClick={() => goToMonth(1)}>
                <ChevronRight />
              </button>
            </div>
          </div>

          <div className="calendar-weekdays">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) =>
              <div key={day}>{day}</div>
            )}
          </div>

          <div className="calendar-grid">
            {calendarDays.map(({ date, currentMonth }, index) => {
              const dayTasks = getTasksForDate(date);
              const isToday = formatDate(date) === formatDate(today);

              return (
                <div key={index} className={[
                  "calendar-day",
                  !currentMonth ? "calendar-day-other-month" : "",
                  isToday ? "calendar-day-today" : "",
                ].join(" ")}>
                  <div className="calendar-day-number">{date.getDate()}</div>
                  <div className="calendar-day-tasks">
                    {dayTasks.slice(0, 3).map((task) => (
                      <button type="button" key={task.id}
                        className={`calendar-task calendar-status-${task.status.toLowerCase().replaceAll(" ", "-")}`}
                        title={task.title}
                        onClick={() => setSelectedTask(task)}>
                        {task.title}
                      </button>
                    ))}
                    {dayTasks.length > 3 &&
                      <span>+{dayTasks.length - 3} more</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="calendar-side-card">
          <h3>Upcoming Deadlines</h3>
          {upcomingTasks.slice(0, 6).map((task) => (
            <button type="button" className="upcoming-task-item"
              key={task.id} onClick={() => setSelectedTask(task)}>
              <CalendarDays size={17} />
              <span>{task.title} — {dateKey(task.endDate)}</span>
              <ChevronRight size={16} />
            </button>
          ))}
          {!upcomingTasks.length && <p>No upcoming deadlines</p>}
        </section>

        {showForm && (
          <div className="calendar-modal-overlay">
            <form className="calendar-task-modal" onSubmit={handleCreate}>
              <button type="button" className="calendar-modal-close"
                onClick={() => setShowForm(false)}><X /></button>
              <h2>Add Calendar Event</h2>

              <label>Event Title *
                <input required value={form.Event_Title}
                  onChange={(e) => setForm({ ...form, Event_Title: e.target.value })} />
              </label>

              <label>Event Type
                <select value={form.Event_Type}
                  onChange={(e) => setForm({ ...form, Event_Type: e.target.value })}>
                  <option>Project Deadline</option>
                  <option>Task</option>
                  <option>Meeting</option>
                </select>
              </label>

              <label>Project ID
                <input type="number" min="1" value={form.Project_ID}
                  onChange={(e) => setForm({ ...form, Project_ID: e.target.value })} />
              </label>

              <label>Created By * (Admin ID)
                <input required type="number" min="1" value={form.Created_By}
                  onChange={(e) => setForm({ ...form, Created_By: e.target.value })} />
              </label>

              <label>Employee ID (optional)
                <input type="number" min="1" value={form.Employee_ID}
                  onChange={(e) => setForm({ ...form, Employee_ID: e.target.value })} />
              </label>

              <label>Start / Assigned Date
                <input type="date" value={form.Assigned_Date}
                  onChange={(e) => setForm({ ...form, Assigned_Date: e.target.value })} />
              </label>

              <label>Event Date *
                <input required type="date" value={form.Event_Date}
                  onChange={(e) => setForm({ ...form, Event_Date: e.target.value })} />
              </label>

              <label>Deadline
                <input type="date" value={form.Deadline}
                  onChange={(e) => setForm({ ...form, Deadline: e.target.value })} />
              </label>

              <label>Start Time
                <input type="time" value={form.Start_Time}
                  onChange={(e) => setForm({ ...form, Start_Time: e.target.value })} />
              </label>

              <label>End Time
                <input type="time" value={form.End_Time}
                  onChange={(e) => setForm({ ...form, End_Time: e.target.value })} />
              </label>

              <label>Status
                <select value={form.Status}
                  onChange={(e) => setForm({ ...form, Status: e.target.value })}>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </label>

              <label>Description
                <textarea value={form.Description}
                  onChange={(e) => setForm({ ...form, Description: e.target.value })} />
              </label>

              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Create Event"}
              </button>
            </form>
          </div>
        )}

        {selectedTask && (
          <div className="calendar-modal-overlay"
            onClick={() => setSelectedTask(null)}>
            <div className="calendar-task-modal"
              onClick={(e) => e.stopPropagation()}>
              <button type="button" className="calendar-modal-close"
                onClick={() => setSelectedTask(null)}><X /></button>
              <h2>{selectedTask.title}</h2>
              <p>{selectedTask.description || "No description"}</p>
              <p><CalendarDays size={16} /> Start: {dateKey(selectedTask.startDate) || "—"}</p>
              <p><CalendarDays size={16} /> Deadline: {dateKey(selectedTask.endDate) || "—"}</p>
              <p><User size={16} /> Employee: {selectedTask.employee}</p>
              <p>Department: {selectedTask.department}</p>
              <p>Project: {selectedTask.project}</p>
              <p>Type: {selectedTask.eventType}</p>
              <p>Status: {selectedTask.status}</p>
              <button type="button" onClick={() => deleteTask(selectedTask)}>
                Delete Event
              </button>
              <button type="button" onClick={() => setSelectedTask(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Calendar;
