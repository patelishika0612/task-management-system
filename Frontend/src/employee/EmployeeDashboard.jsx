
import React, { useEffect, useMemo, useRef, useState } from "react";
import API from "../api";
import {
  Users,
  Briefcase,
  ClipboardCheck,
  Clock3,
  AlertCircle,
  CheckCircle2,
  FolderKanban,
  CalendarDays,
  Activity,
  Target,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,
  BarController,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import "./EmployeeDashboard.css";
import EmployeeLayout from "../components/EmployeeLayout";
import DirectChat from "../components/DirectChat";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,
  BarController,
  Filler,
  Tooltip,
  Legend
);

const getArray = (response) => {
  const data = response?.data?.data ?? response?.data;
  return Array.isArray(data) ? data : [];
};

const getStatus = (item) =>
  String(item?.status ?? "").trim().toLowerCase();

const getDate = (value) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = getDate(value);

  return date
    ? date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No deadline";
};

const EmployeeDashboard = () => {
  const performanceCanvasRef = useRef(null);
  const workloadCanvasRef = useRef(null);
  const performanceChartRef = useRef(null);
  const workloadChartRef = useRef(null);

  // Use the ID and token saved by your employee login.
  const currentUserId =
    localStorage.getItem("employeeId") ||
    localStorage.getItem("emp_id") ||
    localStorage.getItem("userId");

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("employeeToken") ||
    localStorage.getItem("adminToken");

  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const [empRes, projectRes, deptRes, taskRes] =
        await Promise.all([
          API.get("/employees"),
          API.get("/projects"),
          API.get("/departments"),
          API.get("/tasks"),
        ]);

      setEmployees(getArray(empRes));
      setProjects(getArray(projectRes));
      setDepartments(getArray(deptRes));
      setTasks(getArray(taskRes));
    } catch (err) {
      console.error("Employee dashboard fetch error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load dashboard data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const completedTasks = useMemo(
    () => tasks.filter((task) => getStatus(task) === "completed"),
    [tasks]
  );

  const pendingTasks = useMemo(
    () =>
      tasks.filter((task) =>
        ["pending", "todo", "to do", "not started"].includes(
          getStatus(task)
        )
      ),
    [tasks]
  );

  const inProgressTasks = useMemo(
    () =>
      tasks.filter((task) =>
        ["in progress", "in_progress", "inprogress"].includes(
          getStatus(task)
        )
      ),
    [tasks]
  );

  const overdueTasks = useMemo(() => {
    const now = new Date();

    return tasks.filter((task) => {
      const dueDate = getDate(task.due_date);

      return (
        getStatus(task) !== "completed" &&
        dueDate &&
        dueDate < now
      );
    });
  }, [tasks]);

  const completionRate = tasks.length
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;

  const onTimeTasks = completedTasks.filter((task) => {
    const dueDate = getDate(task.due_date);
    const completedDate = getDate(task.updated_at);

    return dueDate && completedDate && completedDate <= dueDate;
  });

  const onTimeRate = completedTasks.length
    ? Math.round((onTimeTasks.length / completedTasks.length) * 100)
    : 0;

  const activeProjects = projects.filter(
    (project) =>
      !["completed", "cancelled", "canceled"].includes(
        getStatus(project)
      )
  );

  const stats = [
    {
      title: "Total Employees",
      value: employees.length,
      icon: Users,
      className: "stat-blue",
      detail: "Employees in system",
    },
    {
      title: "Active Projects",
      value: activeProjects.length,
      icon: FolderKanban,
      className: "stat-purple",
      detail: "Projects in progress",
    },
    {
      title: "Total Tasks",
      value: tasks.length,
      icon: ClipboardCheck,
      className: "stat-green",
      detail: `${completedTasks.length} completed`,
    },
    {
      title: "Overdue Tasks",
      value: overdueTasks.length,
      icon: AlertCircle,
      className: "stat-orange",
      detail: "Tasks past their deadline",
    },
  ];

  const upcomingTasks = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    return tasks
      .filter((task) => {
        const dueDate = getDate(task.due_date);

        return (
          getStatus(task) !== "completed" &&
          dueDate &&
          dueDate >= startOfToday
        );
      })
      .sort(
        (a, b) =>
          getDate(a.due_date).getTime() -
          getDate(b.due_date).getTime()
      )
      .slice(0, 5);
  }, [tasks]);

  // Tasks created and completed over the last seven months.
  useEffect(() => {
    if (loading || !performanceCanvasRef.current) return;

    performanceChartRef.current?.destroy();

    const monthData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      date.setMonth(date.getMonth() - i);

      monthData.push({
        label: date.toLocaleString("en-US", { month: "short" }),
        key: `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`,
      });
    }

    const matchesMonth = (value, key) => {
      const date = getDate(value);
      if (!date) return false;

      const dateKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      return dateKey === key;
    };

    const createdCounts = monthData.map(({ key }) =>
      tasks.filter((task) =>
        matchesMonth(task.created_at, key)
      ).length
    );

    const completedCounts = monthData.map(({ key }) =>
      completedTasks.filter((task) =>
        matchesMonth(task.updated_at, key)
      ).length
    );

    performanceChartRef.current = new Chart(
      performanceCanvasRef.current,
      {
        type: "line",
        data: {
          labels: monthData.map((month) => month.label),
          datasets: [
            {
              label: "Tasks Created",
              data: createdCounts,
              borderColor: "#3b82f6",
              backgroundColor: "rgba(59, 130, 246, 0.10)",
              borderWidth: 2,
              tension: 0.35,
              fill: true,
              pointRadius: 3,
            },
            {
              label: "Tasks Completed",
              data: completedCounts,
              borderColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              borderWidth: 2,
              tension: 0.35,
              fill: true,
              pointRadius: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: "index",
            intersect: false,
          },
          plugins: {
            legend: {
              position: "top",
              align: "end",
              labels: {
                usePointStyle: true,
                boxWidth: 8,
                padding: 16,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { precision: 0 },
              grid: { color: "#eef2f7" },
            },
            x: {
              grid: { display: false },
            },
          },
        },
      }
    );

    return () => {
      performanceChartRef.current?.destroy();
      performanceChartRef.current = null;
    };
  }, [tasks, completedTasks, loading]);

  // Employee count by department.
  useEffect(() => {
    if (
      loading ||
      !workloadCanvasRef.current ||
      departments.length === 0
    ) {
      workloadChartRef.current?.destroy();
      workloadChartRef.current = null;
      return;
    }

    workloadChartRef.current?.destroy();

    const labels = departments.map(
      (department) =>
        department.department_name ||
        department.name ||
        `Department ${department.department_id ?? ""}`
    );

    const counts = departments.map((department) =>
      employees.filter(
        (employee) =>
          String(employee.department_id) ===
          String(department.department_id)
      ).length
    );

    const colors = [
      "#3b82f6",
      "#8b5cf6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#ec4899",
      "#14b8a6",
      "#f97316",
    ];

    workloadChartRef.current = new Chart(
      workloadCanvasRef.current,
      {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Employees",
              data: counts,
              backgroundColor: labels.map(
                (_, index) => colors[index % colors.length]
              ),
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { precision: 0 },
              grid: { color: "#eef2f7" },
            },
            x: {
              grid: { display: false },
            },
          },
        },
      }
    );

    return () => {
      workloadChartRef.current?.destroy();
      workloadChartRef.current = null;
    };
  }, [departments, employees, loading]);

const chatContacts = [
  {
    id: 4,
    name: "HR",
    role: "HR",
  },
];



  return (
    <EmployeeLayout>
      <div className="admin-dashboard employee-dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <p className="dashboard-date">
              <CalendarDays size={16} />
              {formattedDate}
            </p>

            <h1>Employee Dashboard</h1>

            <p className="dashboard-subtitle">
              Overview of employees, projects, and task performance.
            </p>
          </div>

          <button
            type="button"
            className="dashboard-refresh"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            <RefreshCw size={16} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="dashboard-error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button type="button" onClick={fetchDashboardData}>
              Try again
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="dashboard-stats">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div className="dashboard-stat-card" key={stat.title}>
                <div className={`dashboard-stat-icon ${stat.className}`}>
                  <Icon size={22} />
                </div>

                <div className="dashboard-stat-content">
                  <p>{stat.title}</p>
                  <h2>{loading ? "—" : stat.value}</h2>
                  <span>{stat.detail}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="dashboard-content-grid">
          <section className="dashboard-panel performance-panel">
            <div className="dashboard-panel-header">
              <div>
                <h2>Task Performance</h2>
                <p>Tasks created vs completed over seven months</p>
              </div>
              <Activity size={21} />
            </div>

            <div className="dashboard-chart">
              {loading ? (
                <p className="dashboard-empty">Loading chart...</p>
              ) : (
                <canvas ref={performanceCanvasRef} />
              )}
            </div>
          </section>

          <section className="dashboard-panel workload-panel">
            <div className="dashboard-panel-header">
              <div>
                <h2>Department Workload</h2>
                <p>Employees by department</p>
              </div>
              <Users size={21} />
            </div>

            <div className="dashboard-chart">
              {loading ? (
                <p className="dashboard-empty">Loading chart...</p>
              ) : departments.length === 0 ? (
                <p className="dashboard-empty">
                  No department data available.
                </p>
              ) : (
                <canvas ref={workloadCanvasRef} />
              )}
            </div>
          </section>
        </div>

        {/* Task summary and deadlines */}
        <div className="dashboard-bottom-grid">
          <section className="dashboard-panel task-summary-panel">
            <div className="dashboard-panel-header">
              <div>
                <h2>Task Summary</h2>
                <p>Current task status breakdown</p>
              </div>
              <Target size={21} />
            </div>

            <div className="task-progress">
              <div className="task-progress-heading">
                <span>Overall completion</span>
                <strong>
                  {loading ? "—" : `${completionRate}%`}
                </strong>
              </div>

              <div className="task-progress-track">
                <div
                  className="task-progress-fill"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            <div className="task-summary-list">
              <div className="task-summary-item">
                <span className="task-summary-dot dot-green" />
                <span>Completed</span>
                <strong>
                  {loading ? "—" : completedTasks.length}
                </strong>
              </div>

              <div className="task-summary-item">
                <span className="task-summary-dot dot-blue" />
                <span>In Progress</span>
                <strong>
                  {loading ? "—" : inProgressTasks.length}
                </strong>
              </div>

              <div className="task-summary-item">
                <span className="task-summary-dot dot-yellow" />
                <span>Pending</span>
                <strong>
                  {loading ? "—" : pendingTasks.length}
                </strong>
              </div>

              <div className="task-summary-item">
                <span className="task-summary-dot dot-red" />
                <span>Overdue</span>
                <strong>
                  {loading ? "—" : overdueTasks.length}
                </strong>
              </div>
            </div>

            <div className="task-on-time">
              <div className="task-on-time-icon">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span>On-time completion rate</span>
                <strong>
                  {loading ? "—" : `${onTimeRate}%`}
                </strong>
              </div>
            </div>
          </section>

          <section className="dashboard-panel deadlines-panel">
            <div className="dashboard-panel-header">
              <div>
                <h2>Upcoming Deadlines</h2>
                <p>Your upcoming unfinished tasks</p>
              </div>
              <Clock3 size={21} />
            </div>

            {loading ? (
              <p className="dashboard-empty">Loading deadlines...</p>
            ) : upcomingTasks.length === 0 ? (
              <div className="dashboard-empty">
                <CheckCircle2 size={24} />
                <p>No upcoming deadlines found.</p>
              </div>
            ) : (
              <div className="deadline-list">
                {upcomingTasks.map((task, index) => (
                  <div
                    className="deadline-item"
                    key={
                      task.task_id ??
                      task.id ??
                      `${task.title ?? task.task_name ?? "task"}-${index}`
                    }
                  >
                    <div className="deadline-icon">
                      <CalendarDays size={18} />
                    </div>

                    <div className="deadline-info">
                      <h3>
                        {task.title ||
                          task.task_name ||
                          task.task_title ||
                          `Task ${task.task_id ?? ""}`}
                      </h3>
                      <p>
                        {task.project_name ||
                          task.project?.name ||
                          "Project task"}
                      </p>
                    </div>

                    <span className="deadline-date">
                      {formatDate(task.due_date)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Active projects */}
        <section className="dashboard-panel project-overview-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Active Projects</h2>
              <p>Projects that are not completed or cancelled</p>
            </div>
            <Briefcase size={21} />
          </div>

          {loading ? (
            <p className="dashboard-empty">Loading projects...</p>
          ) : activeProjects.length === 0 ? (
            <p className="dashboard-empty">
              No active projects found.
            </p>
          ) : (
            <div className="project-overview-list">
              {activeProjects.slice(0, 4).map((project, index) => {
                const projectId =
                  project.project_id ?? project.id ?? index;

                const projectName =
                  project.project_name ||
                  project.proj_name ||
                  project.name ||
                  project.title ||
                  `Project ${projectId}`;

                const progressValue = Number(
                  project.progress ??
                    project.progress_percentage ??
                    project.completion_percentage ??
                    0
                );

                const progress = Math.max(
                  0,
                  Math.min(
                    100,
                    Number.isFinite(progressValue)
                      ? progressValue
                      : 0
                  )
                );

                return (
                  <div
                    className="project-overview-item"
                    key={projectId}
                  >
                    <div className="project-overview-top">
                      <div>
                        <h3>{projectName}</h3>
                        <p>
                          {project.description ||
                            project.status ||
                            "Project"}
                        </p>
                      </div>
                      <strong>{progress}%</strong>
                    </div>

                    <div className="task-progress-track">
                      <div
                        className="task-progress-fill project-progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Direct Messages */}
        <section className="employee-direct-chat-section">
          <div className="dashboard-panel-header employee-chat-heading">
            <div>
              <h2>
                <MessageCircle size={21} />
                Direct Messages
              </h2>
              <p>Chat with HR and view your conversations.</p>
            </div>
          </div>

          {currentUserId ? (
           <DirectChat
  currentUserId={currentUserId}
  contacts={chatContacts}
  token={token}
/>
          ) : (
            <div className="dashboard-error" role="alert">
              Employee ID not found. Please check the employee login
              and localStorage ID key.
            </div>
          )}
        </section>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeDashboard;
