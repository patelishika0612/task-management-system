import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ListChecks,
  Clock3,
  CheckCircle2,
  FolderKanban,
  CalendarDays,
  MessageSquare,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Activity,
  UserPlus,
  Flag,
} from "lucide-react";
import API from "../api";
import EmployeeLayout from "../components/EmployeeLayout";
import "./EmployeeDashboard.css";

const DAY_MS = 86400000;
const UPCOMING_DAYS = 14;
const DASHBOARD_LIST_LIMIT = 4;

const getArrayData = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const safeJson = (value, fallback = null) => {
  if (typeof value !== "string") return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalize = (value) => String(value ?? "").trim().toLowerCase();

const toSlug = (value, fallback = "unknown") =>
  normalize(value || fallback).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const isCompleted = (item) =>
  ["completed", "complete", "done"].includes(normalize(item?.status));

const getInitials = (name = "") =>
  String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "NA";

const toTitle = (value, fallback = "—") => {
  const text = String(value ?? "").trim();
  if (!text) return fallback;
  return text.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

// Plain "YYYY-MM-DD" values are local dates; full timestamps are converted
// from UTC so a deadline saved as IST midnight doesn't land on the day before.
const toDate = (value) => {
  if (!value) return null;
  const raw = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T00:00:00`)
    : new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());


const daysFromToday = (value) => {
  const date = toDate(value);
  if (!date) return null;
  return Math.round((startOfDay(date) - startOfDay(new Date())) / DAY_MS);
};

const formatDate = (value) => {
  const date = toDate(value);
  return date
    ? date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "No deadline";
};

const formatDueLabel = (value) => {
  const days = daysFromToday(value);
  if (days === null) return "No deadline";
  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) > 1 ? "s" : ""}`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due ${formatDate(value)}`;
};

const formatRelativeTime = (value) => {
  const date = toDate(value);
  if (!date) return "";
  const days = -daysFromToday(value);
  // Date-only values (older project assignments) arrive as UTC midnight;
  // showing their time would print a fake "5:30 am", so show the day only.
  const isDateOnly =
    /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ||
    /T00:00:00(\.000)?Z$/.test(String(value));
  const time = isDateOnly
    ? ""
    : ` · ${date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`;
  if (days === 0) return `Today${time}`;
  if (days === 1) return `Yesterday${time}`;
  return `${formatDate(value)}${time}`;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 };

const parseEmployeeCodes = (task) => {
  const values = [
    task.employee_codes,
    task.employee_code,
    task.assigned_employee_codes,
    task.assigned_to,
  ];

  for (const value of values) {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === "string" && value.trim()) {
      const parsed = safeJson(value, null);
      if (Array.isArray(parsed)) return parsed.map(String);
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
};

const FOCUS_FILTERS = [
  { key: "all", label: "All tasks" },
  { key: "today", label: "Due today" },
  { key: "overdue", label: "Overdue" },
  { key: "high", label: "High priority" },
];

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const employeeId = localStorage.getItem("employeeId");

  const [employee, setEmployee] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [focusFilter, setFocusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    if (employeeId == null) {
      setError("Employee information is not available. Please log in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [taskRes, projectRes, memberRes, employeeRes] = await Promise.all([
        API.get("/tasks"),
        API.get("/projects"),
        API.get("/project-members"),
        API.get("/employees"),
      ]);

      const tasks = getArrayData(taskRes.data);
      const projects = getArrayData(projectRes.data);
      const allMembers = getArrayData(memberRes.data);
      const employees = getArrayData(employeeRes.data);

      const me = employees.find(
        (item) => Number(item.emp_id ?? item.employee_id ?? item.id) === Number(employeeId)
      );
      const code = normalize(me?.employee_code);

      const assignments = allMembers.filter(
        (member) => Number(member.employee_id ?? member.emp_id) === Number(employeeId)
      );
      const projectIds = new Set(assignments.map((member) => Number(member.project_id)));

      setEmployee(me || null);
      setAllTasks(tasks);
      setMyTasks(
        tasks.filter((task) =>
          code
            ? parseEmployeeCodes(task).some((item) => normalize(item) === code)
            : Number(task.emp_id) === Number(employeeId)
        )
      );
      setMyProjects(projects.filter((project) => projectIds.has(Number(project.project_id))));
      setMembers(allMembers.filter((member) => projectIds.has(Number(member.project_id))));
      setMyAssignments(assignments);
    } catch (err) {
      console.error("Employee dashboard fetch error:", err);
      setError(
        err.response?.data?.message || "Unable to load your dashboard. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const openTasks = useMemo(() => myTasks.filter((task) => !isCompleted(task)), [myTasks]);

  const dueTodayTasks = useMemo(
    () => openTasks.filter((task) => daysFromToday(task.due_date) === 0),
    [openTasks]
  );

  const overdueTasks = useMemo(
    () => openTasks.filter((task) => (daysFromToday(task.due_date) ?? 0) < 0),
    [openTasks]
  );

  const completedThisWeek = useMemo(() => {
    const today = startOfDay(new Date());
    // Weeks start on Monday.
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));

    return myTasks.filter((task) => {
      const updated = toDate(task.updated_at);
      return isCompleted(task) && updated && updated >= weekStart;
    });
  }, [myTasks]);

  const activeProjects = useMemo(
    () =>
      myProjects.filter(
        (project) => !["completed", "cancelled", "canceled"].includes(normalize(project.status))
      ),
    [myProjects]
  );

  const stats = [
    {
      title: "My open tasks",
      value: openTasks.length,
      detail: `${myTasks.length} assigned in total`,
      icon: ListChecks,
      tone: "navy",
    },
    {
      title: "Due today",
      value: dueTodayTasks.length,
      detail: overdueTasks.length ? `${overdueTasks.length} overdue` : "Nothing overdue",
      icon: Clock3,
      tone: "red",
    },
    {
      title: "Completed this week",
      value: completedThisWeek.length,
      detail: `${myTasks.filter(isCompleted).length} completed in total`,
      icon: CheckCircle2,
      tone: "blue",
    },
    {
      title: "Active projects",
      value: activeProjects.length,
      detail: `${myProjects.length} project${myProjects.length === 1 ? "" : "s"} assigned`,
      icon: FolderKanban,
      tone: "black",
    },
  ];

  const focusTasks = useMemo(() => {
    const filtered = openTasks.filter((task) => {
      const days = daysFromToday(task.due_date);
      if (focusFilter === "today") return days === 0;
      if (focusFilter === "overdue") return days !== null && days < 0;
      if (focusFilter === "high") return ["high", "urgent"].includes(normalize(task.priority));
      return true;
    });

    return filtered.sort((a, b) => {
      const aDays = daysFromToday(a.due_date) ?? Infinity;
      const bDays = daysFromToday(b.due_date) ?? Infinity;
      if (aDays !== bDays) return aDays - bDays;
      return (
        (PRIORITY_RANK[normalize(a.priority)] ?? 9) - (PRIORITY_RANK[normalize(b.priority)] ?? 9)
      );
    });
  }, [openTasks, focusFilter]);

  // Open task deadlines and project end dates over the next two weeks, soonest first.
  const upcomingItems = useMemo(() => {
    const items = [];
    const add = (value, entry) => {
      const days = daysFromToday(value);
      if (days === null || days < 0 || days > UPCOMING_DAYS) return;
      items.push({ ...entry, date: startOfDay(toDate(value)), days });
    };

    openTasks.forEach((task) =>
      add(task.due_date, {
        id: `task-${task.task_id}`,
        type: "task",
        title: task.task_name || `Task ${task.task_id}`,
        meta: `Task · ${task.proj_name || "Internal work"}`,
      })
    );

    activeProjects.forEach((project) =>
      add(project.end_date, {
        id: `project-${project.project_id}`,
        type: "project",
        title: project.proj_name || `Project ${project.project_id}`,
        meta: `Project deadline${project.client_name ? ` · ${project.client_name}` : ""}`,
      })
    );

    return items.sort((a, b) => a.days - b.days || (a.type === "task" ? -1 : 1));
  }, [openTasks, activeProjects]);

  const projectCards = useMemo(
    () =>
      myProjects.map((project) => {
        const projectTasks = allTasks.filter(
          (task) => Number(task.project_id) === Number(project.project_id)
        );
        const team = members.filter(
          (member) => Number(member.project_id) === Number(project.project_id)
        );

        return {
          ...project,
          team,
          taskCount: projectTasks.length,
          myOpenCount: openTasks.filter(
            (task) => Number(task.project_id) === Number(project.project_id)
          ).length,
        };
      }),
    [myProjects, allTasks, members, openTasks]
  );

  // Built from task updates and project assignments, newest first.
  const recentUpdates = useMemo(() => {
    const updates = myTasks
      .filter((task) => task.updated_at || task.created_at)
      .map((task) => {
        const wasEdited =
          task.updated_at && task.created_at && String(task.updated_at) !== String(task.created_at);
        return {
          id: `task-${task.task_id}`,
          time: wasEdited ? task.updated_at : task.created_at,
          icon: isCompleted(task) ? CheckCircle2 : wasEdited ? Activity : ListChecks,
          tone: isCompleted(task) ? "blue" : wasEdited ? "navy" : "black",
          text: isCompleted(task) ? (
            <>
              Your task <strong>{task.task_name}</strong> was marked completed.
            </>
          ) : wasEdited ? (
            <>
              <strong>{task.task_name}</strong> is now {toTitle(task.status, "Pending")}.
            </>
          ) : (
            <>
              New task <strong>{task.task_name}</strong> was assigned to you.
            </>
          ),
        };
      });

    myAssignments
      .filter((member) => member.assigned_at)
      .forEach((member) =>
        updates.push({
          id: `member-${member.id}`,
          time: member.assigned_at,
          icon: UserPlus,
          tone: "black",
          text: (
            <>
              You were added to project <strong>{member.proj_name}</strong>.
            </>
          ),
        })
      );

    return updates
      .sort((a, b) => (toDate(b.time)?.getTime() || 0) - (toDate(a.time)?.getTime() || 0))
      .slice(0, 5);
  }, [myTasks, myAssignments]);

  const firstName =
    String(employee?.emp_name || localStorage.getItem("employeeName") || "there")
      .trim()
      .split(/\s+/)[0];

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

  // Banner summary of the employee's own tasks and projects.
  const deadlineSummary = [
    overdueTasks.length && `${overdueTasks.length} overdue`,
    dueTodayTasks.length && `${dueTodayTasks.length} due today`,
  ]
    .filter(Boolean)
    .join(" and ");

  const hero = {
    eyebrow: "Employee dashboard",
    title: "Your work overview",
    message: openTasks.length
      ? `You have ${plural(openTasks.length, "open task")} across ${plural(
          activeProjects.length,
          "active project"
        )}${deadlineSummary ? `, with ${deadlineSummary}` : ""}. ${
          completedThisWeek.length
            ? `${plural(completedThisWeek.length, "task")} completed this week.`
            : "Track your progress and deadlines below."
        }`
      : `No open tasks assigned to you. ${plural(
          myTasks.filter(isCompleted).length,
          "task"
        )} completed across ${plural(myProjects.length, "project")}.`,
  };

  const quickLinks = [
    { label: "My Tasks", path: "/employeetask", icon: ListChecks },
    { label: "My Projects", path: "/employee-projects", icon: FolderKanban },
    { label: "Calendar", path: "/employee-calendar", icon: CalendarDays },
    { label: "Chat", path: "/employee-chat", icon: MessageSquare },
  ];

  const renderEmpty = (Icon, text) => (
    <div className="ed-empty">
      <Icon size={22} />
      <p>{text}</p>
    </div>
  );

  return (
    <EmployeeLayout>
      <div className="ed-page">
        {/* Greeting */}
        <header className="ed-intro">
          <div>
            <span className="ed-eyebrow">Your personal workspace</span>
            <h1>
              {getGreeting()}, {firstName} <Sparkles size={22} className="ed-sparkle" />
            </h1>
            <p>Here's what's happening with your work. Let's make today productive.</p>
          </div>

          <div className="ed-intro-actions">
            <div className="ed-today">
              <span>Today</span>
              <strong>{todayLabel}</strong>
            </div>
            <button
              type="button"
              className="ed-icon-btn"
              onClick={fetchDashboardData}
              disabled={loading}
              title="Refresh"
              aria-label="Refresh dashboard"
            >
              <RefreshCw size={17} className={loading ? "ed-spin" : ""} />
            </button>
          </div>
        </header>

        {error && (
          <div className="ed-error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button type="button" onClick={fetchDashboardData}>
              Try again
            </button>
          </div>
        )}

        {/* Hero */}
        <section className="ed-hero">
          <div>
            <span className="ed-hero-eyebrow">{hero.eyebrow}</span>
            <h2>{hero.title}</h2>
            <p>{loading ? "Loading your work..." : hero.message}</p>
          </div>
          <button type="button" className="ed-hero-btn" onClick={() => navigate("/employeetask")}>
            View my tasks <ArrowRight size={18} />
          </button>
        </section>

        {/* Stats */}
        <div className="ed-stats">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div className="ed-stat" key={stat.title}>
                <div className={`ed-stat-icon tone-${stat.tone}`}>
                  <Icon size={21} />
                </div>
                <div>
                  <p>{stat.title}</p>
                  <h3>{loading ? "—" : String(stat.value).padStart(2, "0")}</h3>
                  <span>{loading ? "" : stat.detail}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="ed-grid">
          <div className="ed-col">
            {/* Focus for today */}
            <section className="ed-card">
              <div className="ed-card-head">
                <h2>My focus for today</h2>
                <Link to="/employeetask" className="ed-link">
                  View all tasks <ArrowRight size={15} />
                </Link>
              </div>

              <div className="ed-chips">
                {FOCUS_FILTERS.map((filter) => (
                  <button
                    type="button"
                    key={filter.key}
                    className={`ed-chip ${focusFilter === filter.key ? "active" : ""}`}
                    onClick={() => setFocusFilter(filter.key)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {loading ? (
                renderEmpty(RefreshCw, "Loading your tasks...")
              ) : focusTasks.length === 0 ? (
                renderEmpty(CheckCircle2, "No open tasks here. Nice work!")
              ) : (
                <ul className="ed-task-list">
                  {focusTasks.slice(0, DASHBOARD_LIST_LIMIT).map((task) => {
                    const days = daysFromToday(task.due_date);
                    const overdue = days !== null && days < 0;
                    return (
                      <li className="ed-task" key={task.task_id}>
                        <span className={`ed-task-icon ${overdue ? "overdue" : ""}`}>
                          {overdue ? <AlertCircle size={16} /> : <ListChecks size={16} />}
                        </span>
                        <div className="ed-task-info">
                          <h3>{task.task_name || `Task ${task.task_id}`}</h3>
                          <p>
                            {task.proj_name || "Internal work"} ·{" "}
                            <span className={overdue ? "ed-text-danger" : ""}>
                              {formatDueLabel(task.due_date)}
                            </span>
                          </p>
                        </div>
                        <div className="ed-task-tags">
                          <span className={`ed-badge status-${toSlug(task.status, "pending")}`}>
                            {toTitle(task.status, "Pending")}
                          </span>
                          <span className={`ed-priority priority-${toSlug(task.priority, "low")}`}>
                            <Flag size={12} />
                            {toTitle(task.priority, "Low")}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {!loading && focusTasks.length > DASHBOARD_LIST_LIMIT && (
                <Link to="/employeetask" className="ed-more-link">
                  +{focusTasks.length - DASHBOARD_LIST_LIMIT} more · View all tasks{" "}
                  <ArrowRight size={14} />
                </Link>
              )}
            </section>

            {/* My projects */}
            <section className="ed-card">
              <div className="ed-card-head">
                <h2>My projects</h2>
                <Link to="/employee-projects" className="ed-link">
                  All projects <ArrowRight size={15} />
                </Link>
              </div>

              {loading ? (
                renderEmpty(RefreshCw, "Loading your projects...")
              ) : projectCards.length === 0 ? (
                renderEmpty(FolderKanban, "You haven't been added to any projects yet.")
              ) : (
                <ul className="ed-project-list">
                  {projectCards.slice(0, DASHBOARD_LIST_LIMIT).map((project) => (
                    <li className="ed-project" key={project.project_id}>
                      <div className="ed-project-top">
                        <div>
                          <h3>{project.proj_name}</h3>
                          <p>
                            PRJ-{String(project.project_id).padStart(3, "0")}
                            {project.client_name && ` · Client: ${project.client_name}`}
                            {project.end_date && ` · Ends ${formatDate(project.end_date)}`}
                          </p>
                        </div>
                        <span className={`ed-badge status-${toSlug(project.status, "pending")}`}>
                          {toTitle(project.status, "Pending")}
                        </span>
                      </div>

                      <div className="ed-project-meta">
                        <div className="ed-avatars">
                          {project.team.slice(0, 4).map((member) => (
                            <span key={member.id} title={member.emp_name}>
                              {getInitials(member.emp_name)}
                            </span>
                          ))}
                          {project.team.length > 4 && (
                            <span className="ed-avatar-more">+{project.team.length - 4}</span>
                          )}
                        </div>
                        <span>
                          {project.team.length} team member{project.team.length === 1 ? "" : "s"}
                        </span>
                        <span>·</span>
                        <span>
                          {project.myOpenCount} open task{project.myOpenCount === 1 ? "" : "s"} for
                          you
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {!loading && projectCards.length > DASHBOARD_LIST_LIMIT && (
                <Link to="/employee-projects" className="ed-more-link">
                  +{projectCards.length - DASHBOARD_LIST_LIMIT} more · View all projects{" "}
                  <ArrowRight size={14} />
                </Link>
              )}
            </section>
          </div>

          <div className="ed-col">
            {/* Upcoming */}
            <section className="ed-card">
              <div className="ed-card-head">
                <h2>Upcoming Tasks &amp; Projects</h2>
                <Link to="/employee-calendar" className="ed-link">
                  View calendar <ArrowRight size={15} />
                </Link>
              </div>

              {loading ? (
                renderEmpty(RefreshCw, "Loading deadlines...")
              ) : upcomingItems.length === 0 ? (
                renderEmpty(CalendarDays, `No deadlines in the next ${UPCOMING_DAYS} days.`)
              ) : (
                <ul className="ed-upcoming">
                  {upcomingItems.slice(0, DASHBOARD_LIST_LIMIT).map((item) => (
                    <li key={item.id} className="ed-upcoming-item">
                      <span className={`ed-date-pill ${item.days === 0 ? "today" : ""}`}>
                        <strong>{item.date.toLocaleDateString("en-IN", { day: "2-digit" })}</strong>
                        {item.date.toLocaleDateString("en-IN", { month: "short" }).toUpperCase()}
                      </span>
                      <div className="ed-upcoming-info">
                        <h4>{item.title}</h4>
                        <p>
                          <span className={item.days <= 1 ? "ed-upcoming-soon" : ""}>
                            {item.days === 0
                              ? "Today"
                              : item.days === 1
                                ? "Tomorrow"
                                : `In ${item.days} days`}
                          </span>{" "}
                          · {item.meta}
                        </p>
                      </div>
                      <span className={`ed-type-tag type-${item.type}`}>
                        {item.type === "task" ? "Task" : "Project"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {!loading && upcomingItems.length > DASHBOARD_LIST_LIMIT && (
                <Link to="/employee-calendar" className="ed-more-link">
                  +{upcomingItems.length - DASHBOARD_LIST_LIMIT} more · View all deadlines{" "}
                  <ArrowRight size={14} />
                </Link>
              )}
            </section>

            {/* Recent updates */}
            <section className="ed-card">
              <div className="ed-card-head">
                <h2>Recent updates</h2>
              </div>

              {loading ? (
                renderEmpty(RefreshCw, "Loading activity...")
              ) : recentUpdates.length === 0 ? (
                renderEmpty(Activity, "No recent activity yet.")
              ) : (
                <ul className="ed-updates">
                  {recentUpdates.map((update) => {
                    const Icon = update.icon;
                    return (
                      <li key={update.id}>
                        <span className={`ed-update-icon tone-${update.tone}`}>
                          <Icon size={15} />
                        </span>
                        <div>
                          <p>{update.text}</p>
                          <span>{formatRelativeTime(update.time)}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Quick access */}
            <section className="ed-card">
              <div className="ed-card-head">
                <h2>Quick access</h2>
              </div>
              <div className="ed-quick">
                {quickLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link to={item.path} key={item.path} className="ed-quick-item">
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeDashboard;
