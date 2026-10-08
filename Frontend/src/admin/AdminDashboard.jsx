import React, { useEffect, useMemo, useRef, useState } from "react";
import API from "../api";
import {
    Users,
    Briefcase,
    ClipboardCheck,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Clock3,
    AlertCircle,
    CheckCircle2,
    FolderKanban,
    CalendarDays,
    UserPlus,
    Plus,
    MoreHorizontal,
    Activity,
    Target,
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
import "./AdminDashboard.css";
import AdminLayout from "../components/AdminLayout";

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

const AdminDashboard = () => {

    const performanceChartRef = useRef(null);
    const workloadChartRef = useRef(null);
    const performanceChartInstance = useRef(null);
    const workloadChartInstance = useRef(null);
    const [employees, setEmployees] = useState([]);
    const [projects, setProjects] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const today = new Date();

    const formattedDate = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
});

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [empRes, projRes, deptRes, taskRes] = await Promise.all([
                    API.get("/employees"),
                    API.get("/projects"),
                    API.get("/departments"),
                    API.get("/tasks"),
                ]);
                setEmployees(empRes.data.data || []);
                setProjects(projRes.data.data || []);
                setDepartments(deptRes.data.data || []);
                setTasks(taskRes.data.data || []);
            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);
    const activeProjects = projects.filter(
        (p) => p.status && p.status.toLowerCase() !== "completed"
    );

    const staticProjects = [
        {
            name: "ABC Website",
            type: "Website Development",
            progress: 72,
            tasks: "18 / 25 tasks",
            className: "project-blue",
        },
        {
            name: "CRM System",
            type: "Software Development",
            progress: 55,
            tasks: "11 / 20 tasks",
            className: "project-purple",
        },
        {
            name: "Mobile Application",
            type: "App Development",
            progress: 84,
            tasks: "21 / 25 tasks",
            className: "project-green",
        },
        {
            name: "E-Commerce",
            type: "Web Development",
            progress: 38,
            tasks: "8 / 21 tasks",
            className: "project-orange",
        },
    ];

    const deadlines = [
        {
            title: "ABC Website",
            subtitle: "Homepage development",
            date: "Today",
            time: "05:00 PM",
            type: "Task",
        },
        {
            title: "CRM System",
            subtitle: "Project milestone",
            date: "Tomorrow",
            time: "11:30 AM",
            type: "Deadline",
        },
        {
            title: "Team Meeting",
            subtitle: "Monthly performance review",
            date: "Oct 09",
            time: "03:00 PM",
            type: "Meeting",
        },
        {
            title: "Mobile Application",
            subtitle: "Final testing",
            date: "Oct 11",
            time: "06:00 PM",
            type: "Task",
        },
    ];

    const activities = [
        {
            icon: CheckCircle2,
            title: "Task completed",
            description: "Rahul Patel completed Dashboard UI",
            time: "15 min ago",
        },
        {
            icon: UserPlus,
            title: "New employee added",
            description: "Neha Shah joined Web Development",
            time: "1 hour ago",
        },
        {
            icon: FolderKanban,
            title: "Project updated",
            description: "ABC Website progress changed to 72%",
            time: "2 hours ago",
        },
        {
            icon: ClipboardCheck,
            title: "Task assigned",
            description: "New task assigned to Priya Shah",
            time: "3 hours ago",
        },
    ];

    const completedTasks = tasks.filter((t) => t.status === "completed");
    const overdueTasks = tasks.filter(
        (t) => t.status !== "completed" && t.due_date && new Date(t.due_date) < new Date()
    );
    const completionRate = tasks.length
        ? Math.round((completedTasks.length / tasks.length) * 100)
        : 0;

    const attentionItems = [
        {
            title: "Overdue Tasks",
            count: loading ? "—" : String(overdueTasks.length).padStart(2, "0"),
            text: "Tasks need immediate attention",
            icon: AlertCircle,
            className: "attention-red",
        },
        {
            title: "Pending Approvals",
            count: "03",
            text: "Requests waiting for approval",
            icon: Clock3,
            className: "attention-yellow",
        },
        {
            title: "Low Performance",
            count: "04",
            text: "Employees below target",
            icon: TrendingUp,
            className: "attention-purple",
        },
    ];

    useEffect(() => {
        if (loading) return;
        const canvas = performanceChartRef.current;
        if (!canvas) return;
        const existingChart = Chart.getChart(canvas);
        if (existingChart) existingChart.destroy();

        // Build last 7 months labels
        const monthLabels = [];
        const monthKeys = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            monthLabels.push(d.toLocaleString("en-US", { month: "short" }));
            monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        }

        const createdByMonth = monthKeys.map((key) =>
            tasks.filter((t) => t.created_at && t.created_at.slice(0, 7) === key).length
        );
        const completedByMonth = monthKeys.map((key) =>
            tasks.filter((t) => t.status === "completed" && t.updated_at && t.updated_at.slice(0, 7) === key).length
        );

        const chart = new Chart(canvas, {
            type: "line",
            data: {
                labels: monthLabels,
                datasets: [
                    {
                        label: "Tasks Created",
                        data: createdByMonth,
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        backgroundColor: "rgba(59, 130, 246, 0.08)",
                        borderColor: "#3b82f6",
                        pointBackgroundColor: "#3b82f6",
                        pointRadius: 3,
                    },
                    {
                        label: "Tasks Completed",
                        data: completedByMonth,
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        backgroundColor: "rgba(16, 185, 129, 0.06)",
                        borderColor: "#10b981",
                        pointBackgroundColor: "#10b981",
                        pointRadius: 3,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: {
                    legend: {
                        position: "top",
                        align: "end",
                        labels: { usePointStyle: true, boxWidth: 8, padding: 18 },
                    },
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: "#eef2f7" }, ticks: { color: "#8a94a6" } },
                    x: { grid: { display: false }, ticks: { color: "#8a94a6" } },
                },
            },
        });

        performanceChartInstance.current = chart;
        return () => {
            if (performanceChartInstance.current) {
                performanceChartInstance.current.destroy();
                performanceChartInstance.current = null;
            }
        };
    }, [tasks, loading]);

    useEffect(() => {
        if (loading || departments.length === 0) return;

        const canvas = workloadChartRef.current;
        if (!canvas) return;

        const existingChart = Chart.getChart(canvas);
        if (existingChart) existingChart.destroy();

        const barColors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6", "#f97316"];

        const deptLabels = departments.map((d) => d.department_name);
        const deptCounts = departments.map(
            (d) => employees.filter((e) => e.department_id === d.department_id).length
        );

        const chart = new Chart(canvas, {
            type: "bar",
            data: {
                labels: deptLabels,
                datasets: [{
                    label: "Employees",
                    data: deptCounts,
                    backgroundColor: deptLabels.map((_, i) => barColors[i % barColors.length]),
                    borderRadius: 8,
                    borderSkipped: false,
                    barThickness: 24,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: "#eef2f7" }, ticks: { color: "#8a94a6", stepSize: 1 } },
                    x: { grid: { display: false }, ticks: { color: "#8a94a6", maxRotation: 0 } },
                },
            },
        });

        workloadChartInstance.current = chart;

        return () => {
            if (workloadChartInstance.current) {
                workloadChartInstance.current.destroy();
                workloadChartInstance.current = null;
            }
        };
    }, [departments, employees, loading]);

    const onTimeTasks = completedTasks.filter(
        (t) => t.due_date && t.updated_at && t.updated_at.slice(0, 10) <= t.due_date.slice(0, 10)
    );
    const onTimeRate = completedTasks.length
        ? Math.round((onTimeTasks.length / completedTasks.length) * 100)
        : 0;
    const activeEmpCodes = new Set(tasks.map((t) => t.employee_code));
    const utilizationRate = employees.length
        ? Math.round((activeEmpCodes.size / employees.length) * 100)
        : 0;
    const overallScore = Math.round((completionRate + onTimeRate + utilizationRate) / 3);

    return (
        <AdminLayout>
            <div className="admin-dashboard">

                {/* PAGE INTRO */}
                <section className="dashboard-intro">
                    <div>
                        <span className="dashboard-eyebrow">
                            HR OPERATIONS
                        </span>

                        <h1>
                            Good morning, <strong>HR Manager</strong>
                        </h1>

                        <p>
                            Here's a quick overview of your team's activity,
                            projects and performance.
                        </p>
                    </div>

                <div className="dashboard-actions">
    <div className="dashboard-date">
        <CalendarDays size={18} />
        <span>{formattedDate}</span>
    </div>

    <button className="create-task-btn">
        <Plus size={18} />
        Create Task
    </button>
</div>
                </section>

                {/* KPI CARDS */}
                <section className="stats-grid">

                    <div className="stat-card stat-blue">
                        <div className="stat-card-top">
                            <div className="stat-icon">
                                <Users size={21} />
                            </div>

                            <span className="stat-trend positive">
                                <ArrowUpRight size={15} />
                                8.2%
                            </span>
                        </div>

                        <div className="stat-number">{loading ? "—" : employees.length}</div>
                        <div className="stat-label">Total Employees</div>

                        <div className="stat-bottom">
                            <span>{loading ? "" : `${employees.length} total employees`}</span>
                        </div>
                    </div>

                    <div className="stat-card stat-purple">
                        <div className="stat-card-top">
                            <div className="stat-icon">
                                <Briefcase size={21} />
                            </div>

                            <span className="stat-trend positive">
                                <ArrowUpRight size={15} />
                                5.4%
                            </span>
                        </div>

                        <div className="stat-number">{loading ? "—" : activeProjects.length}</div>
                        <div className="stat-label">Active Projects</div>

                        <div className="stat-bottom">
                            <span>{loading ? "" : `${projects.length} total projects`}</span>
                        </div>
                    </div>

                    <div className="stat-card stat-green">
                        <div className="stat-card-top">
                            <div className="stat-icon">
                                <ClipboardCheck size={21} />
                            </div>

                            <span className="stat-trend positive">
                                <ArrowUpRight size={15} />
                                12.6%
                            </span>
                        </div>

                        <div className="stat-number">{loading ? "—" : tasks.length}</div>
                        <div className="stat-label">Total Tasks</div>

                        <div className="stat-bottom">
                            <span>{loading ? "" : `${completedTasks.length} completed`}</span>
                        </div>
                    </div>

                    <div className="stat-card stat-orange">
                        <div className="stat-card-top">
                            <div className="stat-icon">
                                <Target size={21} />
                            </div>

                            <span className="stat-trend negative">
                                <ArrowDownRight size={15} />
                                2.1%
                            </span>
                        </div>

                        <div className="stat-number">{completionRate}%</div>
                        <div className="stat-label">Completion Rate</div>

                        <div className="mini-progress">
                            <span style={{ width: `${completionRate}%` }}></span>
                        </div>
                    </div>

                </section>

                {/* ANALYTICS */}
                <section className="analytics-grid">

                    <div className="dashboard-card performance-card">
                        <div className="card-heading">
                            <div>
                                <span className="section-label">
                                    PERFORMANCE
                                </span>
                                <h2>Task Performance</h2>
                                <p>Tasks created vs completed</p>
                            </div>

                            <button className="icon-button">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>

                        <div className="chart-wrapper performance-chart">
                            <canvas ref={performanceChartRef}></canvas>
                        </div>
                    </div>

                    <div className="dashboard-card overall-card">
                        <div className="card-heading">
                            <div>
                                <span className="section-label">
                                    OVERVIEW
                                </span>
                                <h2>Overall Performance</h2>
                                <p>Team performance score</p>
                            </div>

                            <button className="icon-button">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>

                        <div className="score-section">
                            <div className="score-circle">
                                <div>
                                    <strong>{loading ? "—" : overallScore}</strong>
                                    <span>/ 100</span>
                                </div>
                            </div>

                            <div className="score-status">
                                <CheckCircle2 size={17} />
                                {overallScore >= 75 ? "Good Performance" : overallScore >= 50 ? "Average Performance" : "Needs Improvement"}
                            </div>
                        </div>

                        <div className="score-metrics">

                            <div className="score-metric">
                                <div>
                                    <span>Task Completion</span>
                                    <strong>{completionRate}%</strong>
                                </div>

                                <div className="metric-progress">
                                    <span
                                        style={{ width: `${completionRate}%` }}
                                        className="blue-progress"
                                    ></span>
                                </div>
                            </div>

                            <div className="score-metric">
                                <div>
                                    <span>On-Time Delivery</span>
                                    <strong>{onTimeRate}%</strong>
                                </div>

                                <div className="metric-progress">
                                    <span
                                        style={{ width: `${onTimeRate}%` }}
                                        className="purple-progress"
                                    ></span>
                                </div>
                            </div>

                            <div className="score-metric">
                                <div>
                                    <span>Team Utilization</span>
                                    <strong>{utilizationRate}%</strong>
                                </div>

                                <div className="metric-progress">
                                    <span
                                        style={{ width: `${utilizationRate}%` }}
                                        className="green-progress"
                                    ></span>
                                </div>
                            </div>
                        </div>
                    </div>

                </section>

                {/* WORKLOAD + PROJECTS */}
                <section className="middle-grid">

                    <div className="dashboard-card workload-card">
                        <div className="card-heading">
                            <div>
                                <span className="section-label">
                                    DEPARTMENTS
                                </span>
                                <h2>Department Workload</h2>
                                <p>Current task distribution</p>
                            </div>

                            <button className="icon-button">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>

                        <div className="chart-wrapper workload-chart">
                            <canvas ref={workloadChartRef}></canvas>
                        </div>
                    </div>

                    <div className="dashboard-card projects-card">
                        <div className="card-heading">
                            <div>
                                <span className="section-label">
                                    PROJECTS
                                </span>
                                <h2>Project Progress</h2>
                                <p>Current project status</p>
                            </div>

                            <button className="view-all-btn">
                                View All
                                <ArrowUpRight size={15} />
                            </button>
                        </div>

                        <div className="project-list">

                            {(loading ? staticProjects : projects.slice(0, 4)).map((project, i) => {
                                const dotColors = ["project-blue", "project-purple", "project-green", "project-orange"];
                                const colorClass = project.className || dotColors[i % dotColors.length];
                                const name = project.proj_name || project.name;
                                const type = project.client_name || project.type || "";
                                const progress = project.progress ?? 0;
                                return (
                                    <div className="project-item" key={project.project_id || project.name}>
                                        <div className="project-item-top">
                                            <div className="project-info">
                                                <div className={`project-dot ${colorClass}`}></div>
                                                <div>
                                                    <h3>{name}</h3>
                                                    <p>{type}</p>
                                                </div>
                                            </div>
                                            <strong>{project.status || `${progress}%`}</strong>
                                        </div>
                                        <div className="project-progress">
                                            <span className={colorClass} style={{ width: `${progress}%` }}></span>
                                        </div>
                                        <div className="project-task-count">
                                            {project.tasks || (project.start_date ? `Started: ${new Date(project.start_date).toLocaleDateString()}` : "")}
                                        </div>
                                    </div>
                                );
                            })}

                        </div>
                    </div>

                </section>

                {/* ATTENTION */}
                <section className="attention-section">

                    <div className="section-title-row">
                        <div>
                            <span className="section-label">
                                ATTENTION REQUIRED
                            </span>
                            <h2>Things that need your attention</h2>
                        </div>

                        <Activity size={22} />
                    </div>

                    <div className="attention-grid">

                        {attentionItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <div
                                    className={`attention-card ${item.className}`}
                                    key={item.title}
                                >
                                    <div className="attention-icon">
                                        <Icon size={21} />
                                    </div>

                                    <div className="attention-content">
                                        <span>{item.title}</span>
                                        <strong>{item.count}</strong>
                                        <p>{item.text}</p>
                                    </div>

                                    <ArrowUpRight
                                        className="attention-arrow"
                                        size={19}
                                    />
                                </div>
                            );
                        })}

                    </div>

                </section>

                {/* EMPLOYEE TABLE */}
                <section className="dashboard-card employee-card">

                    <div className="card-heading employee-heading">
                        <div>
                            <span className="section-label">
                                TEAM
                            </span>
                            <h2>Employee Performance</h2>
                            <p>Performance overview of your team</p>
                        </div>

                        <button className="view-all-btn">
                            View Employees
                            <ArrowUpRight size={15} />
                        </button>
                    </div>

                    <div className="employee-table-wrapper">
                        <table className="employee-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Tasks</th>
                                    <th>Completed</th>
                                    <th>Performance</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "20px", color: "#9aa3b2" }}>Loading...</td></tr>
                                ) : employees.slice(0, 8).map((emp) => {
                                    const initials = emp.emp_name
                                        ? emp.emp_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                                        : "?";
                                    const isActive = emp.status === "active";
                                    return (
                                        <tr key={emp.emp_id}>
                                            <td>
                                                <div className="employee-info">
                                                    <div className="employee-avatar">{initials}</div>
                                                    <div>
                                                        <strong>{emp.emp_name}</strong>
                                                        <span>{emp.department_name || "—"}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><strong>—</strong></td>
                                            <td>—</td>
                                            <td>
                                                <div className="performance-cell">
                                                    <div className="performance-value"><strong>—</strong></div>
                                                    <div className="table-progress"><span style={{ width: "0%" }}></span></div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${isActive ? "status-active" : "status-away"}`}>
                                                    {isActive ? "Active" : emp.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="table-more"><MoreHorizontal size={18} /></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                </section>

                {/* BOTTOM GRID */}
                <section className="bottom-grid">

                    {/* DEADLINES */}
                    <div className="dashboard-card deadline-card">

                        <div className="card-heading">
                            <div>
                                <span className="section-label">
                                    SCHEDULE
                                </span>
                                <h2>Upcoming Deadlines</h2>
                                <p>Important dates and activities</p>
                            </div>

                            <CalendarDays size={21} />
                        </div>

                        <div className="deadline-list">

                            {deadlines.map((item, index) => (
                                <div
                                    className="deadline-item"
                                    key={`${item.title}-${index}`}
                                >
                                    <div className="deadline-date">
                                        <strong>{item.date}</strong>
                                        <span>{item.time}</span>
                                    </div>

                                    <div className="deadline-line">
                                        <span></span>
                                    </div>

                                    <div className="deadline-content">
                                        <div>
                                            <strong>{item.title}</strong>
                                            <p>{item.subtitle}</p>
                                        </div>

                                        <span className="deadline-type">
                                            {item.type}
                                        </span>
                                    </div>
                                </div>
                            ))}

                        </div>
                    </div>

                    {/* ACTIVITY */}
                    <div className="dashboard-card activity-card">

                        <div className="card-heading">
                            <div>
                                <span className="section-label">
                                    ACTIVITY
                                </span>
                                <h2>Recent Activity</h2>
                                <p>Latest team updates</p>
                            </div>

                            <button className="view-all-btn">
                                View All
                                <ArrowUpRight size={15} />
                            </button>
                        </div>

                        <div className="activity-list">

                            {activities.map((item, index) => {
                                const Icon = item.icon;

                                return (
                                    <div
                                        className="activity-item"
                                        key={`${item.title}-${index}`}
                                    >
                                        <div className="activity-icon">
                                            <Icon size={18} />
                                        </div>

                                        <div className="activity-content">
                                            <strong>{item.title}</strong>
                                            <p>{item.description}</p>
                                        </div>

                                        <span className="activity-time">
                                            {item.time}
                                        </span>
                                    </div>
                                );
                            })}

                        </div>
                    </div>

                </section>

            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;