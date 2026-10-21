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
import "./EmployeeDashboard.css";
import EmployeeLayout from "../components/EmployeeLayout";

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

const EmployeeDashboard = () => {

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
        <EmployeeLayout>
            <div className="admin-dashboard">

            <h2> employee dashboard</h2>
            </div>
        </EmployeeLayout>
    );
};

export default EmployeeDashboard ;