import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CheckCircle2,
  AlertCircle,
  CircleDot,
  X,
  ClipboardList,
  User,
  Flag,
  ListFilter,
} from "lucide-react";
import "./AdminCalendar.css";
import AdminLayout from "../components/AdminLayout";

const Calendar = () => {
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [selectedTask, setSelectedTask] = useState(null);

  // =========================================================
  // FILTER STATE
  // =========================================================

  const [filters, setFilters] = useState({
    employee: "All Employees",
    department: "All Departments",
    project: "All Projects",
    eventType: "All Events",
    status: "all",
  });

  // =========================================================
  // TASK DATA
  // =========================================================

  const tasks = [
    {
      id: 1,
      title: "Complete Employee Dashboard",
      description:
        "Finish the employee dashboard UI and connect the required API data.",
      startDate: "2026-10-01",
      endDate: "2026-10-03",
      status: "In Progress",
      priority: "High",
      employee: "Foram Patel",
      department: "Web Development",
      project: "ABC Website",
      eventType: "Task",
    },

    {
      id: 2,
      title: "Backend API Integration",
      description:
        "Integrate employee task APIs with the frontend dashboard.",
      startDate: "2026-10-02",
      endDate: "2026-10-05",
      status: "In Progress",
      priority: "High",
      employee: "Ishika Patel",
      department: "Software Development",
      project: "Mobile Application",
      eventType: "Task",
    },

    {
      id: 3,
      title: "Admin Panel Testing",
      description:
        "Test all admin panel pages and report UI and functional issues.",
      startDate: "2026-10-04",
      endDate: "2026-10-07",
      status: "Pending",



      priority: "Medium",
      employee: "Gopika",
      department: "Software Development",
      project: "ABC Website",
      eventType: "Task",
    },

    {
      id: 4,
      title: "Employee Profile Page",
      description:
        "Complete employee profile page with edit and view functionality.",
      startDate: "2026-10-06",
      endDate: "2026-10-10",
      status: "Pending",
      priority: "Medium",
      employee: "Nandini",
      department: "Web Development",
      project: "Company Redesign",
      eventType: "Task",
    },

    {
      id: 5,
      title: "Calendar Module",
      description:
        "Create calendar module with upcoming deadlines and overdue tasks.",
      startDate: "2026-09-25",
      endDate: "2026-09-30",
      status: "Completed",
      priority: "Low",
      employee: "Dhruvi",
      department: "Software Development",
      project: "Mobile Application",
      eventType: "Project Deadline",
    },

    {
      id: 6,
      title: "Project Documentation",
      description:
        "Prepare documentation for the employee task management system.",
      startDate: "2026-10-11",
      endDate: "2026-10-15",
      status: "Pending",
      priority: "Low",
      employee: "Foram Patel",
      department: "Web Development",
      project: "ABC Website",
      eventType: "Task",
    },

    {
      id: 7,
      title: "Final Project Testing",
      description:
        "Perform final testing before project deployment.",
      startDate: "2026-10-18",
      endDate: "2026-10-20",
      status: "Pending",
      priority: "High",
      employee: "Gopika",
      department: "Graphics Design",
      project: "Company Redesign",
      eventType: "Project Deadline",
    },

    {
      id: 8,
      title: "Client Discussion",
      description:
        "Discuss project progress and upcoming requirements with the client.",
      startDate: "2026-10-08",
      endDate: "2026-10-08",
      status: "Pending",
      priority: "Medium",
      employee: "Ishika Patel",
      department: "Software Development",
      project: "Mobile Application",
      eventType: "Meeting",
    },

    {
      id: 9,
      title: "Graphics Review Meeting",
      description:
        "Review the latest graphics and design changes.",
      startDate: "2026-10-13",
      endDate: "2026-10-13",
      status: "Pending",
      priority: "Medium",
      employee: "Nandini",
      department: "Graphics Design",
      project: "Company Redesign",
      eventType: "Meeting",
    },
  ];

  // =========================================================
  // MONTH / DAY NAMES
  // =========================================================

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // =========================================================
  // TODAY CHECK
  // =========================================================

  const isToday = (date) => {
    return formatDate(date) === formatDate(today);
  };

  // =========================================================
  // TASK DATE RANGE
  // =========================================================

  const isDateInTaskRange = (date, task) => {
    const current = new Date(formatDate(date));
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);

    return current >= start && current <= end;
  };

  // =========================================================
  // FILTER TASKS
  // =========================================================

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const employeeMatch =
        filters.employee === "All Employees" ||
        task.employee === filters.employee;

      const departmentMatch =
        filters.department === "All Departments" ||
        task.department === filters.department;

      const projectMatch =
        filters.project === "All Projects" ||
        task.project === filters.project;

      const eventTypeMatch =
        filters.eventType === "All Events" ||
        task.eventType === filters.eventType;

      const statusMatch =
        filters.status === "all" ||
        task.status === filters.status;

      return (
        employeeMatch &&
        departmentMatch &&
        projectMatch &&
        eventTypeMatch &&
        statusMatch
      );
    });
  }, [filters]);

  // =========================================================
  // GET TASKS FOR DATE
  // =========================================================

  const getTasksForDate = (date) => {
    return filteredTasks.filter((task) =>
      isDateInTaskRange(date, task)
    );
  };

  // =========================================================
  // FILTER CHANGE
  // =========================================================

  const handleFilterChange = (field, value) => {
    setFilters((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setFilters({
      employee: "All Employees",
      department: "All Departments",
      project: "All Projects",
      eventType: "All Events",
      status: "all",
    });
  };

  // =========================================================
  // CALENDAR DAYS
  // =========================================================

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const previousMonthLastDay = new Date(year, month, 0);

    const days = [];

    // Previous month days
    for (let i = firstDay.getDay() - 1; i >= 0; i--) {
      days.push({
        date: new Date(
          year,
          month - 1,
          previousMonthLastDay.getDate() - i
        ),
        currentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        currentMonth: true,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;

    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        currentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // =========================================================
  // MONTH NAVIGATION
  // =========================================================

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      )
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      )
    );
  };

  const goToToday = () => {
    setCurrentDate(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status) => {
    switch (status) {
      case "Completed":
        return "calendar-status-completed";

      case "In Progress":
        return "calendar-status-progress";

      case "Pending":
        return "calendar-status-pending";

      default:
        return "";
    }
  };

  // =========================================================
  // PRIORITY CLASS
  // =========================================================

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "High":
        return "calendar-priority-high";

      case "Medium":
        return "calendar-priority-medium";

      case "Low":
        return "calendar-priority-low";

      default:
        return "";
    }
  };

  // =========================================================
  // UPCOMING TASKS
  // =========================================================

  const upcomingTasks = filteredTasks
    .filter((task) => {
      const endDate = new Date(task.endDate);
      const todayDate = new Date(formatDate(today));

      return (
        endDate >= todayDate &&
        task.status !== "Completed"
      );
    })
    .sort(
      (a, b) =>
        new Date(a.endDate) - new Date(b.endDate)
    )
    .slice(0, 6);

  // =========================================================
  // OVERDUE TASKS
  // =========================================================

  const overdueTasks = filteredTasks.filter((task) => {
    const endDate = new Date(task.endDate);
    const todayDate = new Date(formatDate(today));

    return (
      endDate < todayDate &&
      task.status !== "Completed"
    );
  });

  // =========================================================
  // COMPLETED TASKS
  // =========================================================

  const completedTasks = filteredTasks.filter(
    (task) => task.status === "Completed"
  );

  return (
    <>
      <AdminLayout>
        <div className="admin-calendar-page">

          {/* =====================================================
          PAGE HEADER
      ===================================================== */}

          <div className="admin-calendar-header">

            <div className="admin-calendar-header-left">

              <div className="admin-calendar-title-icon">
                <CalendarDays size={24} />
              </div>

              <div>
                <h1>Calendar</h1>

                <p>
                  Track tasks, deadlines and project activities
                </p>
              </div>

            </div>

            <button
              className="admin-calendar-today-btn"
              onClick={goToToday}
            >
              <CalendarDays size={17} />
              Today
            </button>

          </div>

          {/* =====================================================
          FILTERS
      ===================================================== */}

          <div className="admin-calendar-filter-card">

            <div className="admin-calendar-filter-header">

              <div className="admin-calendar-filter-title">
                <ListFilter size={19} />
                <span>Filter Calendar</span>
              </div>

              <button
                type="button"
                className="admin-calendar-clear-btn"
                onClick={clearFilters}
              >
                Clear Filters
              </button>

            </div>

            <div className="admin-calendar-filters">

              {/* Employee */}

              <div className="admin-calendar-filter-group">

                <label>Employee</label>

                <select
                  value={filters.employee}
                  onChange={(e) =>
                    handleFilterChange(
                      "employee",
                      e.target.value
                    )
                  }
                >
                  <option>All Employees</option>
                  <option>Foram Patel</option>
                  <option>Ishika Patel</option>
                  <option>Nandini</option>
                  <option>Dhruvi</option>
                  <option>Gopika</option>
                </select>

              </div>

              {/* Department */}

              <div className="admin-calendar-filter-group">

                <label>Department</label>

                <select
                  value={filters.department}
                  onChange={(e) =>
                    handleFilterChange(
                      "department",
                      e.target.value
                    )
                  }
                >
                  <option>All Departments</option>
                  <option>Web Development</option>
                  <option>Software Development</option>
                  <option>Graphics Design</option>
                </select>

              </div>

              {/* Project */}

              <div className="admin-calendar-filter-group">

                <label>Project</label>

                <select
                  value={filters.project}
                  onChange={(e) =>
                    handleFilterChange(
                      "project",
                      e.target.value
                    )
                  }
                >
                  <option>All Projects</option>
                  <option>ABC Website</option>
                  <option>Mobile Application</option>
                  <option>Company Redesign</option>
                </select>

              </div>

              {/* Event Type */}

              <div className="admin-calendar-filter-group">

                <label>Event Type</label>

                <select
                  value={filters.eventType}
                  onChange={(e) =>
                    handleFilterChange(
                      "eventType",
                      e.target.value
                    )
                  }
                >
                  <option>All Events</option>
                  <option>Task</option>
                  <option>Project Deadline</option>
                  <option>Meeting</option>
                </select>

              </div>

              {/* Status */}

              <div className="admin-calendar-filter-group">

                <label>Status</label>

                <select
                  value={filters.status}
                  onChange={(e) =>
                    handleFilterChange(
                      "status",
                      e.target.value
                    )
                  }
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">
                    In Progress
                  </option>
                  <option value="Completed">
                    Completed
                  </option>
                </select>

              </div>

            </div>

          </div>

          {/* =====================================================
          STAT CARDS
      ===================================================== */}

          <div className="admin-calendar-stats">

            <div className="admin-calendar-stat-card">

              <div className="calendar-stat-icon blue">
                <ClipboardList size={21} />
              </div>

              <div>
                <span>Total Tasks</span>
                <strong>{filteredTasks.length}</strong>
              </div>

            </div>

            <div className="admin-calendar-stat-card">

              <div className="calendar-stat-icon orange">
                <Clock3 size={21} />
              </div>

              <div>
                <span>Upcoming</span>
                <strong>{upcomingTasks.length}</strong>
              </div>

            </div>

            <div className="admin-calendar-stat-card">

              <div className="calendar-stat-icon red">
                <AlertCircle size={21} />
              </div>

              <div>
                <span>Overdue</span>
                <strong>{overdueTasks.length}</strong>
              </div>

            </div>

            <div className="admin-calendar-stat-card">

              <div className="calendar-stat-icon green">
                <CheckCircle2 size={21} />
              </div>

              <div>
                <span>Completed</span>
                <strong>{completedTasks.length}</strong>
              </div>

            </div>

          </div>

          {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

          <div className="admin-calendar-layout">

            {/* ===================================================
            CALENDAR
        =================================================== */}

            <div className="admin-calendar-main">

              {/* CALENDAR TOP */}

              <div className="admin-calendar-toolbar">

                <div className="admin-calendar-month">

                  <button
                    onClick={goToPreviousMonth}
                    className="calendar-navigation-btn"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <h2>
                    {monthNames[currentDate.getMonth()]}{" "}
                    {currentDate.getFullYear()}
                  </h2>

                  <button
                    onClick={goToNextMonth}
                    className="calendar-navigation-btn"
                  >
                    <ChevronRight size={20} />
                  </button>

                </div>

                <div className="calendar-legend">

                  <span>
                    <i className="legend-dot blue-dot"></i>
                    In Progress
                  </span>

                  <span>
                    <i className="legend-dot orange-dot"></i>
                    Pending
                  </span>

                  <span>
                    <i className="legend-dot green-dot"></i>
                    Completed
                  </span>

                </div>

              </div>

              {/* WEEK DAYS */}

              <div className="calendar-weekdays">

                {dayNames.map((day) => (
                  <div key={day}>
                    {day}
                  </div>
                ))}

              </div>

              {/* CALENDAR GRID */}

              <div className="calendar-grid">

                {calendarDays.map(
                  ({ date, currentMonth }, index) => {

                    const dayTasks =
                      getTasksForDate(date);

                    return (
                      <div
                        key={index}
                        className={`calendar-day ${!currentMonth
                            ? "calendar-day-other-month"
                            : ""
                          } ${isToday(date)
                            ? "calendar-day-today"
                            : ""
                          }`}
                      >

                        <div className="calendar-day-number">
                          {date.getDate()}
                        </div>

                        <div className="calendar-day-tasks">

                          {dayTasks
                            .slice(0, 3)
                            .map((task) => (
                              <button
                                key={task.id}
                                className={`calendar-task ${getStatusClass(
                                  task.status
                                )}`}
                                onClick={() =>
                                  setSelectedTask(task)
                                }
                                title={task.title}
                              >
                                <span></span>
                                {task.title}
                              </button>
                            ))}

                          {dayTasks.length > 3 && (
                            <div className="calendar-more-tasks">
                              +{dayTasks.length - 3} more
                            </div>
                          )}

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            </div>

            {/* ===================================================
            RIGHT SIDEBAR
        =================================================== */}

            <div className="admin-calendar-sidebar">

              {/* UPCOMING */}

              <div className="calendar-side-card">

                <div className="calendar-side-header">

                  <div>
                    <h3>Upcoming Deadlines</h3>
                    <p>Tasks that need attention</p>
                  </div>

                  <Clock3 size={20} />

                </div>

                <div className="upcoming-task-list">

                  {upcomingTasks.length > 0 ? (
                    upcomingTasks.map((task) => (
                      <button
                        key={task.id}
                        className="upcoming-task-item"
                        onClick={() =>
                          setSelectedTask(task)
                        }
                      >

                        <div
                          className={`upcoming-task-date ${getPriorityClass(
                            task.priority
                          )}`}
                        >
                          <span>
                            {new Date(
                              task.endDate
                            ).getDate()}
                          </span>

                          <small>
                            {monthNames[
                              new Date(
                                task.endDate
                              ).getMonth()
                            ].substring(0, 3)}
                          </small>
                        </div>

                        <div className="upcoming-task-info">

                          <strong>{task.title}</strong>

                          <span>
                            <CalendarDays size={13} />
                            Due:{" "}
                            {new Date(
                              task.endDate
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>

                          <span>
                            <User size={13} />
                            {task.employee}
                          </span>

                        </div>

                        <ChevronRight size={17} />

                      </button>
                    ))
                  ) : (
                    <div className="calendar-empty-state">
                      No upcoming deadlines
                    </div>
                  )}

                </div>

              </div>

              {/* OVERDUE */}

              <div className="calendar-side-card overdue-card">

                <div className="calendar-side-header">

                  <div>
                    <h3>Overdue Tasks</h3>
                    <p>Tasks past their deadline</p>
                  </div>

                  <AlertCircle size={20} />

                </div>

                {overdueTasks.length > 0 ? (
                  <div className="overdue-list">

                    {overdueTasks.map((task) => (
                      <button
                        key={task.id}
                        className="overdue-item"
                        onClick={() =>
                          setSelectedTask(task)
                        }
                      >

                        <div className="overdue-icon">
                          <AlertCircle size={17} />
                        </div>

                        <div>

                          <strong>{task.title}</strong>

                          <span>
                            Due:{" "}
                            {new Date(
                              task.endDate
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>

                        </div>

                      </button>
                    ))}

                  </div>
                ) : (
                  <div className="no-overdue">
                    <CheckCircle2 size={28} />
                    <span>No overdue tasks</span>
                  </div>
                )}

              </div>

            </div>

          </div>

          {/* =====================================================
          TASK MODAL
      ===================================================== */}

          {selectedTask && (
            <div
              className="calendar-modal-overlay"
              onClick={() => setSelectedTask(null)}
            >

              <div
                className="calendar-task-modal"
                onClick={(e) =>
                  e.stopPropagation()
                }
              >

                <button
                  className="calendar-modal-close"
                  onClick={() =>
                    setSelectedTask(null)
                  }
                >
                  <X size={20} />
                </button>

                <div className="calendar-modal-icon">
                  <ClipboardList size={24} />
                </div>

                <div className="calendar-modal-heading">

                  <span>Task Details</span>

                  <h2>
                    {selectedTask.title}
                  </h2>

                </div>

                <div className="calendar-modal-status-row">

                  <span
                    className={`task-detail-status ${getStatusClass(
                      selectedTask.status
                    )}`}
                  >
                    <CircleDot size={14} />
                    {selectedTask.status}
                  </span>

                  <span
                    className={`task-detail-priority ${getPriorityClass(
                      selectedTask.priority
                    )}`}
                  >
                    <Flag size={14} />
                    {selectedTask.priority} Priority
                  </span>

                </div>

                <div className="calendar-modal-description">

                  <label>Description</label>

                  <p>
                    {selectedTask.description}
                  </p>

                </div>

                <div className="calendar-task-details-grid">

                  <div className="calendar-detail-box">

                    <span>
                      <CalendarDays size={16} />
                      Start Date
                    </span>

                    <strong>
                      {new Date(
                        selectedTask.startDate
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </strong>

                  </div>

                  <div className="calendar-detail-box">

                    <span>
                      <CalendarDays size={16} />
                      End Date
                    </span>

                    <strong>
                      {new Date(
                        selectedTask.endDate
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </strong>

                  </div>

                  <div className="calendar-detail-box">

                    <span>
                      <User size={16} />
                      Assigned To
                    </span>

                    <strong>
                      {selectedTask.employee}
                    </strong>

                  </div>

                  <div className="calendar-detail-box">

                    <span>
                      <Flag size={16} />
                      Priority
                    </span>

                    <strong>
                      {selectedTask.priority}
                    </strong>

                  </div>

                  <div className="calendar-detail-box">

                    <span>
                      <ClipboardList size={16} />
                      Department
                    </span>

                    <strong>
                      {selectedTask.department}
                    </strong>

                  </div>

                  <div className="calendar-detail-box">

                    <span>
                      <ClipboardList size={16} />
                      Project
                    </span>

                    <strong>
                      {selectedTask.project}
                    </strong>

                  </div>

                  <div className="calendar-detail-box">

                    <span>
                      <CircleDot size={16} />
                      Event Type
                    </span>

                    <strong>
                      {selectedTask.eventType}
                    </strong>

                  </div>

                </div>

                <button
                  className="calendar-modal-done-btn"
                  onClick={() =>
                    setSelectedTask(null)
                  }
                >
                  Close
                </button>

              </div>

            </div>
          )}

        </div>
      </AdminLayout>

    </>
  );
};

export default Calendar;