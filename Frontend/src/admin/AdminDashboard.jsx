import React, { useEffect, useMemo, useState } from "react";
import {
    Users, BriefcaseBusiness, ListTodo, Clock3, Search, Bell, ChevronDown,
    Plus, ArrowUp, ArrowRight, CircleHelp, Building2, UserRound, FolderKanban,
    CalendarDays, Check, Info, UserPlus, CheckCircle2, CalendarCheck, MessageCircle,
    ChartNoAxesColumn
} from "lucide-react";
import API from "../api";
import AdminLayout from "../components/AdminLayout";
import "./AdminDashboard.css";

const AdminDashboard = () => {
    const [employees, setEmployees] = useState([]);
    const [projects, setProjects] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("This month");

    const formattedDate = new Date().toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric"
    });

    useEffect(() => {
        let mounted = true;
        const fetchAll = async () => {
            try {
                const [empRes, projRes, deptRes, taskRes] = await Promise.all([
                    API.get("/employees"),
                    API.get("/projects"),
                    API.get("/departments"),
                    API.get("/tasks")
                ]);
                if (!mounted) return;
                setEmployees(empRes.data?.data || []);
                setProjects(projRes.data?.data || []);
                setDepartments(deptRes.data?.data || []);
                setTasks(taskRes.data?.data || []);
                console.log("TASK DATA:", taskRes.data?.data);
                console.log("FIRST TASK CREATED AT:", taskRes.data?.data?.[0]?.created_at);
                console.table(
                    (taskRes.data?.data || []).map(task => ({
                        task_name: task.task_name,
                        status: task.status,
                        created_at: task.created_at,
                        updated_at: task.updated_at
                    }))
                );

            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchAll();
        return () => { mounted = false; };
    }, []);

    const completedTasks = useMemo(
        () => tasks.filter(t =>
            String(t.status || "").toLowerCase() === "completed"
        ),
        [tasks]
    );

    const inProgressTasks = useMemo(
        () => tasks.filter(t =>
            String(t.status || "").toLowerCase() === "in progress"
        ),
        [tasks]
    );

    // Not Started + Pending બંનેને Pending ગણો
    const pendingTasks = useMemo(
        () => tasks.filter(t =>
            ["not started", "pending", "todo", "to do"].includes(
                String(t.status || "").toLowerCase()
            )
        ),
        [tasks]
    );

    // Completed ન હોય અને due date પસાર થઈ ગઈ હોય
    const overdueTasks = useMemo(
        () => tasks.filter(t => {
            const status = String(t.status || "").toLowerCase();

            if (status === "completed" || !t.due_date) return false;

            const dueDate = new Date(t.due_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            return !Number.isNaN(dueDate.getTime()) && dueDate < today;
        }),
        [tasks]
    );
    const activeProjects = projects.filter(p =>
        String(p.status || "").toLowerCase() !== "completed"
    );
    const completionRate = tasks.length
        ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

    const taskStatus = [
        { label: "Completed", count: completedTasks.length, color: "#20a77b" },
        { label: "In Progress", count: inProgressTasks.length, color: "#5276e8" },
        { label: "Not Started", count: pendingTasks.length, color: "#e9a13b" },
        { label: "Overdue", count: overdueTasks.length, color: "#9a7bdc" }
    ];
    const maxTaskCount = Math.max(1, ...taskStatus.map(s => s.count));
    // Monthly task activity
    // Weekly task activity
    // Monthly week-wise task activity
    // Monthly week-wise task activity
const chartBars = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const totalDays = new Date(
        currentYear,
        currentMonth + 1,
        0
    ).getDate();

    const totalWeeks = Math.ceil(totalDays / 7);

    return Array.from({ length: totalWeeks }, (_, index) => {
        const startDay = index * 7 + 1;
        const endDay = Math.min(startDay + 6, totalDays);

        // Task create થયાની તારીખ પ્રમાણે week નક્કી થશે
        const weekTasks = tasks.filter(task => {
            if (!task.created_at) return false;

            const date = new Date(task.created_at);

            return (
                !Number.isNaN(date.getTime()) &&
                date.getFullYear() === currentYear &&
                date.getMonth() === currentMonth &&
                date.getDate() >= startDay &&
                date.getDate() <= endDay
            );
        });

        return {
            week: `Week ${index + 1}`,

            completed: weekTasks.filter(task =>
                String(task.status || "").trim().toLowerCase() === "completed"
            ).length,

            progress: weekTasks.filter(task =>
                String(task.status || "").trim().toLowerCase() === "in progress"
            ).length
        };
    });
}, [tasks]);

    const maxChartCount = Math.max(
        1,
        ...chartBars.map(item =>
            Math.max(item.completed, item.progress)
        )
    );

    const hasChartData = chartBars.some(
        item => item.completed > 0 || item.progress > 0
    );


    const recentEmployees = [...employees].slice(-4).reverse();
    const activities = [
        {
            icon: <UserPlus size={15} />,
            style: { background: "#edf2ff", color: "#5276e8" },
            text: <><strong>{recentEmployees[0]?.emp_name || "A new employee"}</strong> was added to the team.</>,
            time: "Recently"
        },
        {
            icon: <Check size={15} />,
            style: { background: "#eaf8f2", color: "#15966a" },
            text: <><strong>{completedTasks.length}</strong> tasks have been completed.</>,
            time: "Task overview"
        },
        {
            icon: <ListTodo size={15} />,
            style: { background: "#fff4e7", color: "#df922c" },
            text: <><strong>{pendingTasks.length}</strong> tasks are currently pending.</>,
            time: "Task overview"
        },
        {
            icon: <CalendarDays size={15} />,
            style: { background: "#fff0f1", color: "#df5b68" },
            text: <><strong>{overdueTasks.length}</strong> overdue tasks need attention.</>,
            time: "Task overview"
        }
    ];

    const getInitials = (name = "") =>
        name.split(" ").filter(Boolean).map(part => part[0]).join("").slice(0, 2).toUpperCase() || "?";

    const getJoinedDate = (employee) => {
        const date = employee.created_at || employee.joining_date || employee.join_date;
        return date ? new Date(date).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric"
        }) : "—";
    };



    return (
        <AdminLayout>
            <div className="admin-dashboard">
                <main className="main">


                    <section className="welcome">
                        <div>
                            <h1>HR Dashboard</h1>
                            <p>Here's an overview of your organisation and team activity.</p>
                        </div>
                        {/* <div className="date-tools">
                            <select value={period} onChange={e => setPeriod(e.target.value)}>
                                <option>This month</option>
                                <option>This week</option>
                                <option>This year</option>
                            </select>
                            <button type="button" onClick={() => window.location.href = "/adminhome"}>
                                <Plus size={14} /> Add Employee
                            </button>
                        </div> */}
                    </section>

                    <section className="grid-kpi">
                        <article className="card kpi">
                            <div className="kpi-top">
                                <span className="kpi-label">Total Employees</span>
                                <span className="kpi-icon" style={{ background: "#edf2ff", color: "#4c6cdb" }}><Users size={20} /></span>
                            </div>
                            <div className="kpi-value">{loading ? "—" : employees.length}</div>
                            <div className="kpi-foot"><span className="up"><ArrowUp size={11} /> 8.2%</span> compared to last month</div>
                        </article>
                        <article className="card kpi">
                            <div className="kpi-top">
                                <span className="kpi-label">Active Projects</span>
                                <span className="kpi-icon" style={{ background: "#eaf8f2", color: "#15966a" }}><FolderKanban size={20} /></span>
                            </div>
                            <div className="kpi-value">{loading ? "—" : activeProjects.length}</div>
                            <div className="kpi-foot"><span className="up">{projects.length ? `${activeProjects.length} active` : "—"}</span> projects in workspace</div>
                        </article>
                        <article className="card kpi">
                            <div className="kpi-top">
                                <span className="kpi-label">Tasks in Progress</span>
                                <span
                                    className="kpi-icon"
                                    style={{ background: "#fff4e7", color: "#df922c" }}
                                >
                                    <ListTodo size={20} />
                                </span>
                            </div>

                            <div className="kpi-value">
                                {loading ? "—" : inProgressTasks.length}
                            </div>

                            <div className="kpi-foot">
                                <span className="up">
                                    <ArrowUp size={11} /> {tasks.length ? `${Math.round((inProgressTasks.length / tasks.length) * 100)}%` : "0%"}
                                </span>
                                Across all active projects
                            </div>
                        </article>
                        <article className="card kpi">
                            <div className="kpi-top">
                                <span className="kpi-label">Pending Tasks</span>
                                <span className="kpi-icon" style={{ background: "#fff0f1", color: "#df5b68" }}><Clock3 size={20} /></span>
                            </div>
                            <div className="kpi-value">{loading ? "—" : pendingTasks.length}</div>
                            <div className="kpi-foot"><span style={{ color: "var(--red)", fontWeight: 700 }}>{overdueTasks.length} overdue</span> need attention</div>
                        </article>
                    </section>

                    <section className="content-grid">
                        <article className="card panel">
                            <div className="panel-head">
                                <div>
                                    <h2>Team Overview</h2>
                                    <p>Week-wise task activity for this month</p>
                                </div>
                                <div className="chart-legend">
                                    <span><i className="legend-dot" style={{ background: "#5276e8" }} />Completed</span>
                                    <span><i className="legend-dot" style={{ background: "#a8baf7" }} />In progress</span>
                                </div>
                            </div>
                   <div className="team-chart-wrap">
    {loading ? (
        <p className="no-chart-data">Loading chart...</p>
    ) : !hasChartData ? (
        <p className="no-chart-data">
            No task activity found for this month.
        </p>
    ) : (
        <div className="team-chart">
            {chartBars.map(item => (
                <div className="team-chart-group" key={item.week}>
                    <div className="team-chart-bars">

                       <div
    className="team-chart-bar team-completed-bar"
    title={`Completed: ${item.completed}`}
    style={{
        height: `${(item.completed / maxChartCount) * 150}px`
    }}
/>

<div
    className="team-chart-bar team-progress-bar"
    title={`In Progress: ${item.progress}`}
    style={{
        height: `${(item.progress / maxChartCount) * 150}px`
    }}
/>

                    </div>

                    <span className="team-chart-label">
                        {item.week}
                    </span>
                </div>
            ))}
        </div>
    )}
</div>
                        </article>

                        <article className="card panel">
                            <div className="panel-head">
                                <div><h2>Task Status</h2><p>Current task distribution</p></div>
                                <a className="link" href="/tasks">View tasks</a>
                            </div>
                            <div className="status-list">
                                {taskStatus.map(item => (
                                    <div className="status-row" key={item.label}>
                                        <span>{item.label}</span>
                                        <div className="track">
                                            <div className="fill" style={{
                                                width: `${loading ? 0 : (item.count / maxTaskCount) * 100}%`,
                                                background: item.color
                                            }} />
                                        </div>
                                        <strong>{loading ? "—" : item.count}</strong>
                                    </div>
                                ))}
                            </div>
                            <div className="status-note">
                                <Info size={13} style={{ color: "var(--blue)", marginRight: 5, verticalAlign: "middle" }} />
                                Keep an eye on overdue tasks and projects approaching their deadlines.
                            </div>
                        </article>
                    </section>

                    <section className="lower-grid">
                        <article className="card panel">
                            <div className="panel-head">
                                <div><h2>Employee Overview</h2><p>Recently added team members</p></div>
                                <a className="link" href="/employees">View all employees <ArrowRight size={12} /></a>
                            </div>
                            <div className="table-wrap">
                                <table>
                                    <thead><tr><th>EMPLOYEE</th><th>DEPARTMENT</th><th>JOINED DATE</th><th>STATUS</th></tr></thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="4" style={{ textAlign: "center" }}>Loading...</td></tr>
                                        ) : recentEmployees.length ? recentEmployees.map((emp, index) => (
                                            <tr key={emp.emp_id || index}>
                                                <td>
                                                    <div className="person">
                                                        <div className="mini-avatar">{getInitials(emp.emp_name)}</div>
                                                        <div><strong>{emp.emp_name || "—"}</strong><small>{emp.emp_code || emp.employee_code || `EMP-${emp.emp_id || "—"}`}</small></div>
                                                    </div>
                                                </td>
                                                <td>{emp.department_name || "—"}</td>
                                                <td>{getJoinedDate(emp)}</td>
                                                <td><span className={`pill ${String(emp.status).toLowerCase() === "active" ? "green" : "orange"}`}>{emp.status || "Active"}</span></td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="4" style={{ textAlign: "center" }}>No employees found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </article>

                        <article className="card panel">
                            <div className="panel-head">
                                <div><h2>Recent Activity</h2><p>Latest workspace updates</p></div>
                                <a className="link" href="/serviceview">View all</a>
                            </div>
                            <div className="activity">
                                {activities.map((item, index) => (
                                    <div className="activity-item" key={index}>
                                        <div className="activity-icon" style={item.style}>{item.icon}</div>
                                        <div><p>{item.text}</p><small>{item.time}</small></div>
                                    </div>
                                ))}
                            </div>
                            <div className="panel-head" style={{ margin: "23px 0 0" }}>
                                <div><h2>Quick Actions</h2><p>Common HR operations</p></div>
                            </div>
                            <div className="quick-grid">
                                <a className="quick" href="/employees"><UserPlus size={14} />Add Employee</a>
                                <a className="quick" href="/projects"><Plus size={14} />New Project</a>
                                <a className="quick" href="/tasks"><CheckCircle2 size={14} />Create Task</a>
                                <a className="quick" href="/Chat"><MessageCircle size={14} />Chat</a>
                            </div>
                        </article>
                    </section>

  <div className="footer-note">
                        © {new Date().getFullYear()} Task Management System. All rights reserved.
                        Developed & Designed by :{" "}
                        <a
                            href="https://nirvanzainfotech.co.in/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Nirvanza Infotech
                        </a>
                    </div>                  </main>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
