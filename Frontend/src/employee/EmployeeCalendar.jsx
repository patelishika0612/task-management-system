
import React, { useEffect, useMemo, useState } from "react";
import API from "../api";
import EmployeeLayout from "../components/EmployeeLayout";
import "./EmployeeCalendar.css";

const EmployeeCalendar = () => {
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [employee, setEmployee] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedEvent, setSelectedEvent] = useState(null);

    const employeeId = localStorage.getItem("employeeId");

    // Convert date to YYYY-MM-DD without timezone issue
   const toDateKey = (value) => {
    if (!value) return "";

    // Date object હોય તો local date લો
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, "0");
        const day = String(value.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    // MySQL date string: YYYY-MM-DD
    const raw = String(value).trim();

    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (match) {
        return `${match[1]}-${match[2]}-${match[3]}`;
    }

    return "";
};

    // Format date for display
    const formatDisplayDate = (value) => {
        if (!value) return "Not set";

        const key = toDateKey(value);

        if (!key) return "Not set";

        const [year, month, day] = key.split("-").map(Number);

        return new Date(year, month - 1, day).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    // Fetch employee calendar
    useEffect(() => {
        let active = true;

        const fetchCalendar = async () => {
            try {
                setLoading(true);
                setError("");

                if (!employeeId) {
                    throw new Error(
                        "Employee ID not found. Please login again."
                    );
                }

                const response = await API.get(
                    `/employee-calendar/${employeeId}`
                );

                if (!active) return;

                const data = response.data;

                if (!data.success) {
                    throw new Error(
                        data.message || "Unable to load calendar"
                    );
                }

                setEmployee(data.employee || null);

                setProjects(
                    Array.isArray(data.projects) ? data.projects : []
                );

                setTasks(
                    Array.isArray(data.tasks) ? data.tasks : []
                );

            } catch (err) {
                console.error(
                    "Employee Calendar Error:",
                    err.response?.data || err
                );

                if (active) {
                    setError(
                        err.response?.data?.error ||
                        err.response?.data?.message ||
                        err.message ||
                        "Unable to load calendar data"
                    );
                }

            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        fetchCalendar();

        return () => {
            active = false;
        };
    }, [employeeId]);

    // Prepare calendar events
    const events = useMemo(() => {
        const result = [];

        // PROJECT EVENTS
        projects.forEach((project) => {
            const projectName =
                project.title ||
                project.proj_name ||
                "Project";

            // Only show project on start date
            if (project.start_date) {
                const date = toDateKey(project.start_date);

                if (date) {
                    result.push({
                        id: `project-start-${project.project_id}`,
                        title: projectName,
                        label: "Project Start",
                        date,
                        type: "project-start",
                        category: "Project",
                        details: project,
                    });
                }
            }

            // Only show project on end date
            if (project.end_date) {
                const date = toDateKey(project.end_date);

                if (date) {
                    result.push({
                        id: `project-end-${project.project_id}`,
                        title: projectName,
                        label: "Project End",
                        date,
                        type: "project-end",
                        category: "Project",
                        details: project,
                    });
                }
            }
        });

        // TASK EVENTS
        tasks.forEach((task) => {
            const taskName =
                task.title ||
                task.task_name ||
                "Task";

            // Task start date
            if (task.start_date) {
                const date = toDateKey(task.start_date);

                if (date) {
                    result.push({
                        id: `task-start-${task.task_id}`,
                        title: taskName,
                        label: "Task Start",
                        date,
                        type: "task-start",
                        category: "Task",
                        details: task,
                    });
                }
            }

            // Task deadline
            if (task.due_date) {
                const date = toDateKey(task.due_date);

                if (date) {
                    result.push({
                        id: `task-due-${task.task_id}`,
                        title: taskName,
                        label: "Task Deadline",
                        date,
                        type: "task-due",
                        category: "Task",
                        details: task,
                    });
                }
            }
        });

        return result;
    }, [projects, tasks]);

    // Calendar date values
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthLabel = currentDate.toLocaleDateString(
        "en-IN",
        {
            month: "long",
            year: "numeric",
        }
    );

    const todayKey = toDateKey(new Date());

    // Get date key for calendar day
    const getDateKey = (day) => {
        const monthValue = String(month + 1).padStart(2, "0");
        const dayValue = String(day).padStart(2, "0");

        return `${year}-${monthValue}-${dayValue}`;
    };

    // Get events of selected date
    const getEventsForDate = (dateKey) => {
        return events.filter(
            (event) => event.date === dateKey
        );
    };

    // Change month
    const changeMonth = (value) => {
        setCurrentDate(
            new Date(year, month + value, 1)
        );

        setSelectedDate("");
    };

    // Go to today
    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(todayKey);
    };

    // Selected date events
    const selectedEvents = selectedDate
        ? getEventsForDate(selectedDate)
        : [];

    // Open event popup
    const openEvent = (event, e) => {
        e.stopPropagation();
        setSelectedEvent(event);
    };

    // Close popup
    const closePopup = () => {
        setSelectedEvent(null);
    };

    // Event details popup
    const renderEventDetails = () => {
        if (!selectedEvent) return null;

        const item = selectedEvent.details;
        const isProject = selectedEvent.category === "Project";

        return (
            <div
                className="ec-modal-overlay"
                onClick={closePopup}
            >
                <div
                    className="ec-modal"
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="ec-modal-title"
                >
                    <div className="ec-modal-header">
                        <div>
                            <span
                                className={`ec-modal-tag ${
                                    isProject ? "project-tag" : "task-tag"
                                }`}
                            >
                                {selectedEvent.label}
                            </span>

                            <h3 id="ec-modal-title">
                                {isProject
                                    ? "Project Details"
                                    : "Task Details"}
                            </h3>

                            <p>{selectedEvent.title}</p>
                        </div>

                        <button
                            type="button"
                            className="ec-modal-close"
                            onClick={closePopup}
                            aria-label="Close popup"
                        >
                            &times;
                        </button>
                    </div>

                    <div className="ec-modal-body">

                        {isProject ? (
                            <>
                                <div className="ec-detail-row">
                                    <span>Project ID</span>
                                    <strong>
                                        {item.project_id ?? "N/A"}
                                    </strong>
                                </div>

                                <div className="ec-detail-row">
                                    <span>Project Name</span>
                                    <strong>
                                        {item.title ||
                                            item.proj_name ||
                                            "N/A"}
                                    </strong>
                                </div>

                                <div className="ec-detail-row">
                                    <span>Client Name</span>
                                    <strong>
                                        {item.client_name || "N/A"}
                                    </strong>
                                </div>

                                <div className="ec-detail-row">
                                    <span>Description</span>
                                    <strong>
                                        {item.description || "N/A"}
                                    </strong>
                                </div>

                                <div className="ec-detail-row">
                                    <span>Start Date</span>
                                    <strong>
                                        {formatDisplayDate(item.start_date)}
                                    </strong>
                                </div>

                                <div className="ec-detail-row">
                                    <span>End Date</span>
                                    <strong>
                                        {formatDisplayDate(item.end_date)}
                                    </strong>
                                </div>

                                <div className="ec-detail-row">
                                    <span>Priority</span>
                                    <strong>
                                        {item.priority || "N/A"}
                                    </strong>
                                </div>

                                <div className="ec-detail-row">
                                    <span>Status</span>
                                    <strong>
                                        {item.status || "N/A"}
                                    </strong>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="ec-detail-row">
                                    <span>Task ID</span>
                                    <strong>
                                        {item.task_id ?? "N/A"}
                                    </strong>
                                </div>

                                <div className="ec-detail-row">
                                    <span>Task Name</span>
                                    <strong>
                                        {item.title ||
                                            item.task_name ||
                                            "N/A"}
                                    </strong>
                                </div>

                                <div className="ec-detail-row">
                                    <span>Project ID</span>
                                    <strong>
                                        {item.project_id ?? "N/A"}
                                    </strong>
                                </div>

                                <div className="ec-detail-row">
                                    <span>Employee Code</span>
                                    <strong>
                                        {item.employee_code || "N/A"}
                                    </strong>
                                </div>

                                <div className="ec-detail-row">
                                    <span>Description</span>
                                    <strong>
                                        {item.description || "N/A"}
                                    </strong>
                                </div>

                                <div className="ec-detail-row">
                                    <span>Start Date</span>
                                    <strong>
                                        {formatDisplayDate(item.start_date)}
                                    </strong>
                                </div>

                                <div className="ec-detail-row">
                                    <span>Due Date</span>
                                    <strong>
                                        {formatDisplayDate(item.due_date)}
                                    </strong>
                                </div>

                                <div className="ec-detail-row">
                                    <span>Priority</span>
                                    <strong>
                                        {item.priority || "N/A"}
                                    </strong>
                                </div>

                                <div className="ec-detail-row">
                                    <span>Status</span>
                                    <strong>
                                        {item.status || "N/A"}
                                    </strong>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="ec-modal-footer">
                        <button
                            type="button"
                            onClick={closePopup}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Loading
    if (loading) {
        return (
            <EmployeeLayout>
                <div className="ec-loading">
                    <div className="ec-loader" />
                    <p>Loading your calendar...</p>
                </div>
            </EmployeeLayout>
        );
    }

    return (
        <EmployeeLayout>
            <div className="ec-page">

                {/* PAGE HEADER */}
                <div className="ec-heading">
                    <div>
                        <span className="ec-heading-label">
                            EMPLOYEE WORKSPACE
                        </span>

                        <h2>My Calendar</h2>

                        <p>
                            {employee?.emp_name
                                ? `Welcome, ${employee.emp_name}`
                                : "View your assigned projects and task deadlines"}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="ec-today-button"
                        onClick={goToToday}
                    >
                        Today
                    </button>

                </div>

                {/* ERROR */}
                {error && (
                    <div className="ec-error">
                        <strong>Calendar Error:</strong> {error}
                    </div>
                )}

                {/* SUMMARY */}
                <div className="ec-summary">
                    <div className="ec-summary-card">
                        <div className="ec-summary-icon project-icon">
                            P
                        </div>

                        <div>
                            <span>Assigned Projects</span>
                            <strong>{projects.length}</strong>
                        </div>
                    </div>

                    <div className="ec-summary-card">
                        <div className="ec-summary-icon task-icon">
                            T
                        </div>

                        <div>
                            <span>Assigned Tasks</span>
                            <strong>{tasks.length}</strong>
                        </div>
                    </div>

                    <div className="ec-summary-card">
                        <div className="ec-summary-icon event-icon">
                            E
                        </div>

                        <div>
                            <span>Total Events</span>
                            <strong>{events.length}</strong>
                        </div>
                    </div>
                </div>

                {/* CALENDAR */}
                <div className="ec-calendar-card">

                    <div className="ec-calendar-toolbar">
                        <div className="ec-month-navigation">
                            <button
                                type="button"
                                onClick={() => changeMonth(-1)}
                                aria-label="Previous month"
                            >
                                &#8249;
                            </button>

                            <button
                                type="button"
                                onClick={() => changeMonth(1)}
                                aria-label="Next month"
                            >
                                &#8250;
                            </button>
                        </div>

                        <h3>{monthLabel}</h3>

                        <button
                            type="button"
                            className="ec-toolbar-today"
                            onClick={goToToday}
                        >
                            Today
                        </button>
                    </div>

                    <div className="ec-weekdays">
                        {[
                            "Sunday",
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                        ].map((day) => (
                            <div key={day}>
                                <span className="ec-weekday-full">
                                    {day}
                                </span>

                                <span className="ec-weekday-short">
                                    {day.slice(0, 3)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="ec-days">

                        {/* Empty spaces before first day */}
                        {Array.from(
                            { length: firstDay },
                            (_, index) => (
                                <div
                                    key={`blank-${index}`}
                                    className="ec-day ec-empty"
                                />
                            )
                        )}

                        {/* Calendar dates */}
                        {Array.from(
                            { length: daysInMonth },
                            (_, index) => {
                                const day = index + 1;
                                const dateKey = getDateKey(day);

                                const dayEvents =
                                    getEventsForDate(dateKey);

                                return (
                                    <div
                                        key={dateKey}
                                        className={[
                                            "ec-day",
                                            todayKey === dateKey
                                                ? "ec-today"
                                                : "",
                                            selectedDate === dateKey
                                                ? "ec-selected"
                                                : "",
                                        ]
                                            .filter(Boolean)
                                            .join(" ")}
                                        onClick={() =>
                                            setSelectedDate(dateKey)
                                        }
                                    >
                                        <span className="ec-day-number">
                                            {day}
                                        </span>

                                        <div className="ec-day-events">
                                            {dayEvents
                                                .slice(0, 3)
                                                .map((event) => (
                                                    <button
                                                        type="button"
                                                        key={event.id}
                                                        className={`ec-event ${event.type}`}
                                                        title={`${event.label}: ${event.title}`}
                                                        onClick={(e) =>
                                                            openEvent(event, e)
                                                        }
                                                    >
                                                        {event.title}
                                                    </button>
                                                ))}

                                            {dayEvents.length > 3 && (
                                                <small>
                                                    +{dayEvents.length - 3} more
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>
                </div>

                {/* LEGEND */}
                <div className="ec-legend">
                    <span>
                        <i className="project-start" />
                        Project Start
                    </span>

                    <span>
                        <i className="project-end" />
                        Project End
                    </span>

                    <span>
                        <i className="task-start" />
                        Task Start
                    </span>

                    <span>
                        <i className="task-due" />
                        Task Deadline
                    </span>
                </div>

                {/* SELECTED DATE EVENTS */}
                {selectedDate && (
                    <div className="ec-selected-card">
                        <div className="ec-section-heading">
                            <div>
                                <h3>Events on this date</h3>
                                <p>
                                    {formatDisplayDate(selectedDate)}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedDate("")}
                            >
                                Clear
                            </button>
                        </div>

                        {selectedEvents.length > 0 ? (
                            selectedEvents.map((event) => (
                                <button
                                    type="button"
                                    key={event.id}
                                    className={`ec-selected-event ${event.type}`}
                                    onClick={() => setSelectedEvent(event)}
                                >
                                    <span className="ec-selected-dot" />

                                    <span className="ec-selected-content">
                                        <strong>{event.title}</strong>
                                        <small>{event.label}</small>
                                    </span>

                                    <span className="ec-selected-category">
                                        {event.category}
                                    </span>

                                    <span className="ec-arrow">
                                        &#8250;
                                    </span>
                                </button>
                            ))
                        ) : (
                            <p className="ec-no-events">
                                No events on this date.
                            </p>
                        )}
                    </div>
                )}

                {/* PROJECTS AND TASKS */}
                <div className="ec-data-grid">

                    {/* PROJECT LIST */}
                    <div className="ec-data-card">
                        <div className="ec-section-heading">
                            <div>
                                <h3>My Assigned Projects</h3>
                                <p>
                                    {projects.length} projects assigned
                                </p>
                            </div>
                        </div>

                        {projects.length > 0 ? (
                            projects.map((project) => (
                                <div
                                    className="ec-data-item"
                                    key={project.project_id}
                                >
                                    <div className="ec-data-item-header">
                                        <strong>
                                            {project.title ||
                                                project.proj_name}
                                        </strong>

                                        <span className="ec-status">
                                            {project.status || "Not set"}
                                        </span>
                                    </div>

                                    <p>
                                        <span>Client:</span>{" "}
                                        {project.client_name || "N/A"}
                                    </p>

                                    <p>
                                        <span>Start Date:</span>{" "}
                                        {formatDisplayDate(
                                            project.start_date
                                        )}
                                    </p>

                                    <p>
                                        <span>End Date:</span>{" "}
                                        {formatDisplayDate(
                                            project.end_date
                                        )}
                                    </p>

                                    <p>
                                        <span>Priority:</span>{" "}
                                        {project.priority || "N/A"}
                                    </p>

                                    <button
                                        type="button"
                                        className="ec-view-button"
                                        onClick={() =>
                                            setSelectedEvent({
                                                id: `project-${project.project_id}`,
                                                title:
                                                    project.title ||
                                                    project.proj_name ||
                                                    "Project",
                                                label: "Project Details",
                                                category: "Project",
                                                details: project,
                                            })
                                        }
                                    >
                                        View Details
                                        <span>&#8594;</span>
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="ec-no-events">
                                No assigned projects found.
                            </p>
                        )}
                    </div>

                    {/* TASK LIST */}
                    <div className="ec-data-card">
                        <div className="ec-section-heading">
                            <div>
                                <h3>My Assigned Tasks</h3>
                                <p>
                                    {tasks.length} tasks assigned
                                </p>
                            </div>
                        </div>

                        {tasks.length > 0 ? (
                            tasks.map((task) => (
                                <div
                                    className="ec-data-item"
                                    key={task.task_id}
                                >
                                    <div className="ec-data-item-header">
                                        <strong>
                                            {task.title ||
                                                task.task_name}
                                        </strong>

                                        <span className="ec-status">
                                            {task.status || "Not set"}
                                        </span>
                                    </div>

                                    <p>
                                        <span>Start Date:</span>{" "}
                                        {formatDisplayDate(
                                            task.start_date
                                        )}
                                    </p>

                                    <p>
                                        <span>Due Date:</span>{" "}
                                        {formatDisplayDate(
                                            task.due_date
                                        )}
                                    </p>

                                    <p>
                                        <span>Priority:</span>{" "}
                                        {task.priority || "N/A"}
                                    </p>

                                    <button
                                        type="button"
                                        className="ec-view-button"
                                        onClick={() =>
                                            setSelectedEvent({
                                                id: `task-${task.task_id}`,
                                                title:
                                                    task.title ||
                                                    task.task_name ||
                                                    "Task",
                                                label: "Task Details",
                                                category: "Task",
                                                details: task,
                                            })
                                        }
                                    >
                                        View Details
                                        <span>&#8594;</span>
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="ec-no-events">
                                No assigned tasks found.
                            </p>
                        )}
                    </div>
                </div>

                {/* DETAILS POPUP */}
                {renderEventDetails()}

            </div>
        </EmployeeLayout>
    );
};

export default EmployeeCalendar;
