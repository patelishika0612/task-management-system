import React, { useEffect, useState, useRef } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Plus, Search, Pencil, Trash2, X, ListChecks,
  RefreshCw, AlertCircle, CheckCircle, Eye,
  ChevronLeft, ChevronRight, ChevronDown,
  Clock, PauseCircle, AlertTriangle,
  Paperclip, Upload, FileText, FileSpreadsheet, FileArchive,
} from "lucide-react";

import API from "../api";
import "./Task.css";

const PAGE_SIZE = 4;

// Must match the ENUM values of the `task` table
const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];
const STATUS_OPTIONS = ["pending", "on hold", "completed"];

const EMPTY_FORM = {
  task_name: "",
  project_id: "",
  employee_code: "",
  priority: "low",
  status: "pending",
  start_date: "",
  due_date: "",
  description: "",
  comments: "",
};

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = [
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
  ".jpg", ".jpeg", ".png", ".zip",
];

// =====================================================
// HELPERS
// =====================================================
// MySQL DATE columns arrive as UTC ISO strings (e.g. 2026-10-04T18:30:00Z
// for 2026-10-05 in IST), so convert back to the local calendar date.
const toDateInput = (value) => {
  if (!value) return "";

  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text.split("T")[0];

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const capitalize = (text = "") =>
  text.charAt(0).toUpperCase() + text.slice(1);

const getInitials = (name) => {
    if (!name || typeof name !== "string") {
        return "NA";
    }

    const cleanName = name.trim();

    if (!cleanName) {
        return "NA";
    }

    return cleanName
        .split(/\s+/)
        .map((word) => word.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();
};

// Show task_id exactly as stored in the database
const formatTaskCode = (id) => String(id ?? "");

const todayString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().split("T")[0];
};

const isOverdue = (task) =>
  task.status !== "completed" &&
  !!task.due_date &&
  toDateInput(task.due_date) < todayString();

// "8 days left", "2 days overdue", "Due today", "Completed"
const getDueText = (task) => {
  if (!task.due_date) return "";
  if (task.status === "completed") return "Completed";

  const due = new Date(toDateInput(task.due_date));
  const today = new Date(todayString());
  const diff = Math.round((due - today) / 86400000);

  if (diff === 0) return "Due today";
  if (diff > 0) return `${diff} day${diff !== 1 ? "s" : ""} left`;
  return `${Math.abs(diff)} day${diff !== -1 ? "s" : ""} overdue`;
};

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(toDateInput(value)).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getExtension = (name = "") => {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index).toLowerCase() : "";
};

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"];

const getFileIcon = (name = "") => {
  const ext = getExtension(name);
  if ([".xls", ".xlsx"].includes(ext)) return <FileSpreadsheet size={20} />;
  if (ext === ".zip") return <FileArchive size={20} />;
  return <FileText size={20} />;
};

const formatDateTime = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Share of the start→due window that has passed (100% once completed)
const getTimeProgress = (task) => {
  if (task.status === "completed") return 100;
  if (!task.start_date || !task.due_date) return 0;

  const start = new Date(toDateInput(task.start_date));
  const due = new Date(toDateInput(task.due_date));
  const today = new Date(todayString());
  const total = due - start;

  if (total <= 0) return today >= due ? 100 : 0;

  const percent = Math.round(((today - start) / total) * 100);
  return Math.min(100, Math.max(0, percent));
};

// Uploads live on the API origin, where the `download` attribute is ignored,
// so fetch the file and save it under its original name.
const downloadAttachment = async (attachment) => {
  try {
    const response = await fetch(attachment.url);
    if (!response.ok) throw new Error("Download failed");

    const blobUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = attachment.name || attachment.file;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(attachment.url, "_blank", "noopener,noreferrer");
  }
};

const getErrorMessage = (err, fallback) =>
  err.response?.data?.message || err.message || fallback;

const Task = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewTask, setViewTask] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  // Attachments: already saved on the server / newly picked files
  const [existingFiles, setExistingFiles] = useState([]);
  const [newFiles, setNewFiles] = useState([]);

  const [projectSearch, setProjectSearch] = useState("");
  const [projectDropOpen, setProjectDropOpen] = useState(false);
  const projectDropRef = useRef(null);

  const [empSearch, setEmpSearch] = useState("");
  const [empDropOpen, setEmpDropOpen] = useState(false);
  const empDropRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // FETCH TASKS
  // =====================================================
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/tasks");

      setTasks(response.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to fetch tasks."));
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH PROJECTS
  // =====================================================
  const fetchProjects = async () => {
    try {
      const response = await API.get("/projects");

      setProjects(response.data.data || []);
    } catch (err) {
      console.error("Project fetch error:", err.message);
    }
  };

  // =====================================================
  // FETCH EMPLOYEES
  // =====================================================
  const fetchEmployees = async () => {
    try {
      const response = await API.get("/employees");

      setEmployees(response.data.data || []);
    } catch (err) {
      console.error("Employee fetch error:", err.message);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchEmployees();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, priorityFilter, projectFilter, employeeFilter]);

  // =====================================================
  // CLOSE DROPDOWNS ON OUTSIDE CLICK
  // =====================================================
  useEffect(() => {
    const handler = (event) => {
      if (
        projectDropRef.current &&
        !projectDropRef.current.contains(event.target)
      ) {
        setProjectDropOpen(false);
      }

      if (
        empDropRef.current &&
        !empDropRef.current.contains(event.target)
      ) {
        setEmpDropOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  // =====================================================
  // FORM CHANGE
  // =====================================================
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  // =====================================================
  // ATTACHMENTS
  // =====================================================
  const handleFileSelect = (event) => {
    const picked = Array.from(event.target.files || []);
    event.target.value = "";

    if (picked.length === 0) return;

    const invalidType = picked.find(
      (file) => !ALLOWED_EXTENSIONS.includes(getExtension(file.name))
    );
    if (invalidType) {
      setError(`"${invalidType.name}" is not allowed. Use PDF, DOC, XLS, JPG, PNG or ZIP.`);
      return;
    }

    const tooLarge = picked.find((file) => file.size > MAX_FILE_SIZE);
    if (tooLarge) {
      setError(`"${tooLarge.name}" is larger than 10 MB.`);
      return;
    }

    if (existingFiles.length + newFiles.length + picked.length > MAX_FILES) {
      setError(`You can attach up to ${MAX_FILES} files.`);
      return;
    }

    setNewFiles((previous) => [...previous, ...picked]);
    setError("");
  };

  const removeNewFile = (index) => {
    setNewFiles((previous) => previous.filter((_, i) => i !== index));
  };

  const removeExistingFile = (file) => {
    setExistingFiles((previous) =>
      previous.filter((attachment) => attachment.file !== file)
    );
  };

  const resetFiles = () => {
    setExistingFiles([]);
    setNewFiles([]);
  };

  const resetDropdowns = () => {
    setProjectSearch("");
    setProjectDropOpen(false);
    setEmpSearch("");
    setEmpDropOpen(false);
  };

  // =====================================================
  // ADD TASK
  // =====================================================
  const openAddModal = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    resetDropdowns();
    resetFiles();
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  // =====================================================
  // EDIT TASK
  // =====================================================
  const openEditModal = async (task) => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await API.get(`/tasks/${task.task_id}`);
      const data = response.data.data;

      setEditId(data.task_id);

      setForm({
        task_name: data.task_name || "",
        project_id: data.project_id ? String(data.project_id) : "",
        employee_code: data.employee_code || "",
        priority: data.priority || "low",
        status: data.status || "pending",
        start_date: toDateInput(data.start_date),
        due_date: toDateInput(data.due_date),
        description: data.description || "",
        comments: data.comments || "",
      });

      setExistingFiles(data.attachments || []);
      setNewFiles([]);
      resetDropdowns();
      setIsModalOpen(true);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to open task."));
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CLOSE FORM MODAL
  // =====================================================
  const closeModal = () => {
    if (saving) return;

    setIsModalOpen(false);
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    resetDropdowns();
    resetFiles();
    setError("");
  };

  // =====================================================
  // SAVE TASK
  // =====================================================
  const handleSubmit = async (event) => {
    event.preventDefault();

    const taskName = form.task_name.trim();

    if (!taskName) {
      setError("Task name is required.");
      return;
    }

    if (taskName.length < 3 || taskName.length > 255) {
      setError("Task name must be 3–255 characters.");
      return;
    }

    if (!form.project_id) {
      setError("Please select a project.");
      return;
    }

    if (!form.employee_code) {
      setError("Please select an employee.");
      return;
    }

    if (form.due_date && form.start_date && form.due_date < form.start_date) {
      setError("Due date cannot be before start date.");
      return;
    }

    if (form.description.length > 1000) {
      setError("Description cannot exceed 1000 characters.");
      return;
    }

    if (form.comments.length > 2000) {
      setError("Comments cannot exceed 2000 characters.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const isEditing = editId !== null;

      // multipart/form-data so attachments are uploaded with the task
      const payload = new FormData();
      payload.append("task_name", taskName);
      payload.append("project_id", form.project_id);
      payload.append("employee_code", form.employee_code);
      payload.append("priority", form.priority);
      payload.append("status", form.status);
      payload.append("start_date", form.start_date || "");
      payload.append("due_date", form.due_date || "");
      payload.append("description", form.description);
      payload.append("comments", form.comments);

      if (isEditing) {
        payload.append(
          "existing_attachments",
          JSON.stringify(existingFiles.map((attachment) => attachment.file))
        );
      }

      newFiles.forEach((file) => payload.append("attachments", file));

      const response = isEditing
        ? await API.put(`/tasks/${editId}`, payload)
        : await API.post("/tasks", payload);

      setSuccess(
        response.data.message ||
          (isEditing
            ? "Task updated successfully."
            : "Task created successfully.")
      );

      setIsModalOpen(false);
      setEditId(null);
      setForm({ ...EMPTY_FORM });
      resetDropdowns();
      resetFiles();

      await fetchTasks();
    } catch (err) {
      console.error("Task save error:", err);
      setError(getErrorMessage(err, "Unable to save task."));
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE TASK
  // =====================================================
  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.task_name}"?`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await API.delete(`/tasks/${task.task_id}`);

      setSuccess(response.data.message || "Task deleted successfully.");

      await fetchTasks();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to delete task."));
    }
  };

  // =====================================================
  // STATS
  // =====================================================
  const stats = [
    {
      label: "Total Tasks",
      value: tasks.length,
      icon: <ListChecks size={20} />,
      tone: "blue",
    },
    {
      label: "Pending",
      value: tasks.filter((task) => task.status === "pending").length,
      icon: <Clock size={20} />,
      tone: "orange",
    },
    {
      label: "On Hold",
      value: tasks.filter((task) => task.status === "on hold").length,
      icon: <PauseCircle size={20} />,
      tone: "purple",
    },
    {
      label: "Completed",
      value: tasks.filter((task) => task.status === "completed").length,
      icon: <CheckCircle size={20} />,
      tone: "green",
    },
    {
      label: "Overdue",
      value: tasks.filter(isOverdue).length,
      icon: <AlertTriangle size={20} />,
      tone: "red",
    },
  ];

  // =====================================================
  // FILTER AND PAGINATION
  // =====================================================
  const filtered = tasks.filter((task) => {
    const query = search.toLowerCase().trim();

    const matchesSearch =
      !query ||
      task.task_name?.toLowerCase().includes(query) ||
      formatTaskCode(task.task_id).toLowerCase().includes(query) ||
      String(task.task_id).includes(query);

    const matchesStatus =
      !statusFilter ||
      (statusFilter === "overdue"
        ? isOverdue(task)
        : task.status === statusFilter);

    const matchesPriority =
      !priorityFilter || task.priority === priorityFilter;

    const matchesProject =
      !projectFilter || String(task.project_id) === projectFilter;

    const matchesEmployee =
      !employeeFilter || task.employee_code === employeeFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority &&
      matchesProject &&
      matchesEmployee
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    const lastPage = Math.max(1, totalPages);

    if (currentPage > lastPage) {
      setCurrentPage(lastPage);
    }
  }, [totalPages, currentPage]);

  const hasFilters =
    search || statusFilter || priorityFilter || projectFilter || employeeFilter;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setProjectFilter("");
    setEmployeeFilter("");
  };

  // =====================================================
  // DROPDOWN DATA
  // =====================================================
  const filteredProjects = projects.filter((project) =>
    String(project.proj_name || "")
      .toLowerCase()
      .includes(projectSearch.toLowerCase())
  );

  const filteredEmployees = employees.filter((employee) => {
    const name = String(employee.emp_name || "").toLowerCase();
    const code = String(employee.employee_code || "").toLowerCase();
    const query = empSearch.toLowerCase();

    return name.includes(query) || code.includes(query);
  });

  const selectedProject = projects.find(
    (project) => String(project.project_id) === form.project_id
  );

  const selectedEmployee = employees.find(
    (employee) => employee.employee_code === form.employee_code
  );

  return (
    <AdminLayout>
      <div className="admin-page">
        {/* HEADER */}
        <div className="admin-page-header">
          <div className="admin-page-heading">
            <div className="admin-page-heading-icon">
              <ListChecks size={25} />
            </div>
            <div>
              <h1>Task Management</h1>
              <p>Create, assign and monitor tasks across your teams</p>
            </div>
          </div>

          <button
            type="button"
            className="admin-add-btn"
            onClick={openAddModal}
          >
            <Plus size={19} /> Create Task
          </button>
        </div>

        {/* ALERTS */}
        {success && (
          <div className="admin-alert admin-alert-success">
            <CheckCircle size={18} />
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess("")}>
              <X size={17} />
            </button>
          </div>
        )}

        {error && !isModalOpen && (
          <div className="admin-alert admin-alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>
              <X size={17} />
            </button>
          </div>
        )}

        {/* STATS */}
        <div className="task-stats">
          {stats.map((stat) => (
            <div className="task-stat-card" key={stat.label}>
              <div className={`task-stat-icon task-tone-${stat.tone}`}>
                {stat.icon}
              </div>
              <h2>{stat.value}</h2>
              <p>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div className="task-filters">
          <div className="task-filter task-filter-search">
            <label>Search Tasks</label>
            <div className="admin-search">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search by task name or ID..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="task-filter">
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {capitalize(status)}
                </option>
              ))}
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="task-filter">
            <label>Priority</label>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
            >
              <option value="">All Priority</option>
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {capitalize(priority)}
                </option>
              ))}
            </select>
          </div>

          <div className="task-filter">
            <label>Project</label>
            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option
                  key={project.project_id}
                  value={String(project.project_id)}
                >
                  {project.proj_name}
                </option>
              ))}
            </select>
          </div>

          <div className="task-filter">
            <label>Employee</label>
            <select
              value={employeeFilter}
              onChange={(event) => setEmployeeFilter(event.target.value)}
            >
              <option value="">All Employees</option>
              {employees.map((employee) => (
                <option key={employee.emp_id} value={employee.employee_code}>
                  {employee.emp_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TASK TABLE */}
        <div className="admin-table-card">
          <div className="admin-table-card-header">
            <div>
              <h2>All Tasks</h2>
              <p>
                Showing {paginated.length} of {filtered.length} task
                {filtered.length !== 1 ? "s" : ""}
              </p>
            </div>

            {hasFilters && (
              <button
                type="button"
                className="task-clear-btn"
                onClick={clearFilters}
              >
                <X size={14} /> Clear filters
              </button>
            )}
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table task-table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assigned To</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Comments</th>
                  <th>Attachments</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading && tasks.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="admin-table-empty">
                      <RefreshCw size={22} className="admin-spinning" />
                      <p>Loading tasks...</p>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="admin-table-empty">
                      <ListChecks size={32} />
                      <h3>
                        {hasFilters ? "No tasks found" : "No tasks added yet"}
                      </h3>
                      <p>
                        {hasFilters
                          ? "Try different filters."
                          : "Click Create Task to get started."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((task) => {
                    const overdue = isOverdue(task);

                    return (
                      <tr key={task.task_id}>
                        <td>
                          <span className="task-code">
                            {formatTaskCode(task.task_id)}
                          </span>
                        </td>

                        <td>
                          <div className="task-cell-main">
                            <strong>{task.task_name}</strong>
                            {task.description && (
                              <small>{task.description}</small>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="task-cell-main">
                            <strong>{task.proj_name || "—"}</strong>
                            {task.client_name && (
                              <small>{task.client_name}</small>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="task-assignee">
                            <span className="task-avatar">
                              {getInitials(task.emp_name)}
                            </span>
                            <div className="task-cell-main">
                              <strong>{task.emp_name || "—"}</strong>
                              {task.employee_code && (
                                <small>{task.employee_code}</small>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`task-badge task-priority-${task.priority}`}
                          >
                            {task.priority}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`task-badge task-status-${
                              overdue
                                ? "overdue"
                                : task.status?.replace(/\s+/g, "-")
                            }`}
                          >
                            {overdue ? "overdue" : task.status}
                          </span>
                        </td>

                        <td>
                          <div className="task-cell-main">
                            <strong className={overdue ? "task-due-late" : ""}>
                              {formatDate(task.due_date)}
                            </strong>
                            <small>{getDueText(task)}</small>
                          </div>
                        </td>

                        <td>
                          {task.comments ? (
                            <p className="task-comment-cell" title={task.comments}>
                              {task.comments}
                            </p>
                          ) : (
                            <span className="task-muted">—</span>
                          )}
                        </td>

                        <td>
                          {task.attachments?.length ? (
                            <div className="task-attach-cell">
                              {task.attachments.slice(0, 2).map((attachment) => (
                                <a
                                  key={attachment.file}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={attachment.name}
                                >
                                  <Paperclip size={12} />
                                  <span>{attachment.name}</span>
                                </a>
                              ))}
                              {task.attachments.length > 2 && (
                                <small>+{task.attachments.length - 2} more</small>
                              )}
                            </div>
                          ) : (
                            <span className="task-muted">—</span>
                          )}
                        </td>

                        <td>
                          <div className="admin-actions">
                            <button
                              type="button"
                              className="admin-view-btn"
                              onClick={() => setViewTask(task)}
                            >
                              <Eye size={16} />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              className="admin-edit-btn"
                              onClick={() => openEditModal(task)}
                            >
                              <Pencil size={16} />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              className="admin-delete-btn"
                              onClick={() => handleDelete(task)}
                            >
                              <Trash2 size={16} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="admin-pagination">
              <span className="admin-pagination-info">
                Page {currentPage} of {totalPages}
              </span>

              <div className="admin-pagination-btns">
                <button
                  type="button"
                  className="admin-page-btn"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((page) => (
                  <button
                    type="button"
                    key={page}
                    className={`admin-page-btn ${
                      currentPage === page ? "admin-page-active" : ""
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  className="admin-page-btn"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          <div className="admin-table-footer">
            Showing {paginated.length} of {filtered.length} tasks
          </div>
        </div>

        {/* ADD / EDIT MODAL */}
        {isModalOpen && (
          <div
            className="admin-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeModal();
              }
            }}
          >
            <div className="admin-modal" role="dialog" aria-modal="true">
              <div className="admin-modal-header">
                <div className="admin-modal-title">
                  <div className="admin-modal-icon">
                    <ListChecks size={23} />
                  </div>
                  <div>
                    <h2>{editId !== null ? "Edit Task" : "Create Task"}</h2>
                    <p>
                      {editId !== null
                        ? "Update task information."
                        : "Enter task details and assign it."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={closeModal}
                  disabled={saving}
                >
                  <X size={21} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="admin-modal-body">
                  {error && (
                    <div className="admin-alert admin-alert-error">
                      <AlertCircle size={18} />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="admin-form-grid">
                    {editId !== null && (
                      <div className="admin-field admin-field-full">
                        <label>Task ID</label>
                        <input
                          type="text"
                          value={formatTaskCode(editId)}
                          readOnly
                          className="admin-readonly"
                        />
                      </div>
                    )}

                    {/* TASK NAME */}
                    <div className="admin-field">
                      <label>
                        Task Name <span>*</span>
                      </label>
                      <input
                        type="text"
                        name="task_name"
                        placeholder="e.g. Homepage Development"
                        value={form.task_name}
                        onChange={handleChange}
                        maxLength={255}
                        required
                      />
                    </div>

                    {/* PROJECT DROPDOWN */}
                    <div className="admin-field">
                      <label>
                        Project <span>*</span>
                      </label>

                      <div className="task-drop" ref={projectDropRef}>
                        <button
                          type="button"
                          className="task-drop-trigger"
                          onClick={() => setProjectDropOpen((open) => !open)}
                        >
                          <span
                            className={
                              selectedProject ? "" : "task-drop-placeholder"
                            }
                          >
                            {selectedProject?.proj_name ||
                              "-- Select Project --"}
                          </span>

                          <ChevronDown
                            size={16}
                            className={`task-drop-chevron${
                              projectDropOpen ? " task-drop-chevron-open" : ""
                            }`}
                          />
                        </button>

                        {projectDropOpen && (
                          <div className="task-drop-panel">
                            <div className="task-drop-search">
                              <Search size={14} />
                              <input
                                type="text"
                                placeholder="Search project..."
                                value={projectSearch}
                                onChange={(event) =>
                                  setProjectSearch(event.target.value)
                                }
                                autoFocus
                              />
                              {projectSearch && (
                                <button
                                  type="button"
                                  onClick={() => setProjectSearch("")}
                                >
                                  <X size={13} />
                                </button>
                              )}
                            </div>

                            <div className="task-drop-list">
                              {filteredProjects.map((project) => (
                                <div
                                  key={project.project_id}
                                  className={`task-drop-option${
                                    String(project.project_id) ===
                                    form.project_id
                                      ? " task-drop-option-active"
                                      : ""
                                  }`}
                                  onClick={() => {
                                    setForm((previous) => ({
                                      ...previous,
                                      project_id: String(project.project_id),
                                    }));
                                    setProjectDropOpen(false);
                                    setProjectSearch("");
                                    setError("");
                                  }}
                                >
                                  <span>{project.proj_name}</span>
                                  <small>{project.client_name}</small>
                                </div>
                              ))}

                              {filteredProjects.length === 0 && (
                                <p className="task-drop-empty">
                                  No projects found
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* EMPLOYEE DROPDOWN */}
                    <div className="admin-field">
                      <label>
                        Assigned To <span>*</span>
                      </label>

                      <div className="task-drop" ref={empDropRef}>
                        <button
                          type="button"
                          className="task-drop-trigger"
                          onClick={() => setEmpDropOpen((open) => !open)}
                        >
                          <span
                            className={
                              selectedEmployee ? "" : "task-drop-placeholder"
                            }
                          >
                            {selectedEmployee
                              ? `${selectedEmployee.emp_name} (${selectedEmployee.employee_code})`
                              : "-- Select Employee --"}
                          </span>

                          <ChevronDown
                            size={16}
                            className={`task-drop-chevron${
                              empDropOpen ? " task-drop-chevron-open" : ""
                            }`}
                          />
                        </button>

                        {empDropOpen && (
                          <div className="task-drop-panel">
                            <div className="task-drop-search">
                              <Search size={14} />
                              <input
                                type="text"
                                placeholder="Search employee..."
                                value={empSearch}
                                onChange={(event) =>
                                  setEmpSearch(event.target.value)
                                }
                                autoFocus
                              />
                              {empSearch && (
                                <button
                                  type="button"
                                  onClick={() => setEmpSearch("")}
                                >
                                  <X size={13} />
                                </button>
                              )}
                            </div>

                            <div className="task-drop-list">
                              {filteredEmployees.map((employee) => (
                                <div
                                  key={employee.emp_id}
                                  className={`task-drop-option${
                                    employee.employee_code ===
                                    form.employee_code
                                      ? " task-drop-option-active"
                                      : ""
                                  }`}
                                  onClick={() => {
                                    setForm((previous) => ({
                                      ...previous,
                                      employee_code: employee.employee_code,
                                    }));
                                    setEmpDropOpen(false);
                                    setEmpSearch("");
                                    setError("");
                                  }}
                                >
                                  <span>{employee.emp_name}</span>
                                  <small>{employee.employee_code}</small>
                                </div>
                              ))}

                              {filteredEmployees.length === 0 && (
                                <p className="task-drop-empty">
                                  No employees found
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* PRIORITY */}
                    <div className="admin-field">
                      <label>
                        Priority <span>*</span>
                      </label>
                      <select
                        name="priority"
                        value={form.priority}
                        onChange={handleChange}
                      >
                        {PRIORITY_OPTIONS.map((priority) => (
                          <option key={priority} value={priority}>
                            {capitalize(priority)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* STATUS */}
                    <div className="admin-field">
                      <label>
                        Status <span>*</span>
                      </label>
                      <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {capitalize(status)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* START DATE */}
                    <div className="admin-field">
                      <label>Start Date</label>
                      <input
                        type="date"
                        name="start_date"
                        value={form.start_date}
                        onChange={handleChange}
                      />
                    </div>

                    {/* DUE DATE */}
                    <div className="admin-field">
                      <label>Due Date</label>
                      <input
                        type="date"
                        name="due_date"
                        min={form.start_date || undefined}
                        value={form.due_date}
                        onChange={handleChange}
                      />
                    </div>

                    {/* DESCRIPTION */}
                    <div className="admin-field admin-field-full">
                      <label>Description</label>
                      <textarea
                        name="description"
                        placeholder="Brief task description..."
                        value={form.description}
                        onChange={handleChange}
                        maxLength={1000}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* COMMENTS & NOTES */}
                  <div className="task-form-section">
                    <div className="task-form-section-title">
                      <h4>Comments &amp; Notes</h4>
                    </div>

                    <div className="admin-field admin-field-full">
                      <label>Task Comments</label>
                      <textarea
                        name="comments"
                        placeholder="Add instructions, notes or comments for the employee..."
                        value={form.comments}
                        onChange={handleChange}
                        maxLength={2000}
                        rows={4}
                      />
                    </div>
                  </div>

                  {/* ATTACHMENTS */}
                  <div className="task-form-section">
                    <div className="task-form-section-title">
                      <h4>Attachments</h4>
                    </div>

                    <label className="task-file-upload">
                      <input
                        type="file"
                        multiple
                        hidden
                        accept={ALLOWED_EXTENSIONS.join(",")}
                        onChange={handleFileSelect}
                        disabled={saving}
                      />
                      <div className="task-file-upload-icon">
                        <Upload size={20} />
                      </div>
                      <strong>Upload task attachments</strong>
                      <span>PDF, DOC, XLS, JPG, PNG, ZIP — Max 10 MB</span>
                    </label>

                    {(existingFiles.length > 0 || newFiles.length > 0) && (
                      <div className="task-file-list">
                        {existingFiles.map((attachment) => (
                          <div className="task-file-item" key={attachment.file}>
                            <FileText size={16} />
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {attachment.name}
                            </a>
                            <small>{formatFileSize(attachment.size)}</small>
                            <button
                              type="button"
                              onClick={() => removeExistingFile(attachment.file)}
                              disabled={saving}
                              aria-label={`Remove ${attachment.name}`}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}

                        {newFiles.map((file, index) => (
                          <div
                            className="task-file-item task-file-item-new"
                            key={`${file.name}-${index}`}
                          >
                            <FileText size={16} />
                            <span>{file.name}</span>
                            <small>{formatFileSize(file.size)}</small>
                            <button
                              type="button"
                              onClick={() => removeNewFile(index)}
                              disabled={saving}
                              aria-label={`Remove ${file.name}`}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* FORM FOOTER */}
                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="admin-cancel-btn"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="admin-save-btn"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <RefreshCw size={17} className="admin-spinning" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={17} />
                        {editId !== null ? "Update Task" : "Save Task"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW TASK MODAL */}
        {viewTask && (() => {
          const overdue = isOverdue(viewTask);
          const progress = getTimeProgress(viewTask);

          return (
            <div
              className="admin-modal-overlay"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setViewTask(null);
                }
              }}
            >
              <div
                className="admin-modal task-view-modal"
                role="dialog"
                aria-modal="true"
              >
                <div className="admin-modal-header">
                  <div className="admin-modal-title">
                    <div className="admin-modal-icon">
                      <ListChecks size={23} />
                    </div>
                    <div>
                      <span className="task-code">
                        {formatTaskCode(viewTask.task_id)}
                      </span>
                      <h2>{viewTask.task_name}</h2>
                      <p>
                        {viewTask.proj_name || "No project"}
                        {viewTask.client_name ? ` · ${viewTask.client_name}` : ""}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="admin-modal-close"
                    onClick={() => setViewTask(null)}
                  >
                    <X size={21} />
                  </button>
                </div>

                <div className="admin-modal-body task-view-grid">
                  {/* LEFT COLUMN */}
                  <div className="task-view-col">
                    <section className="task-view-card">
                      <h3>Task Description</h3>
                      <p className="task-view-text">
                        {viewTask.description || "No description provided."}
                      </p>
                    </section>

                    {/* <section className="task-view-card">
                      <h3>Task Progress</h3>
                      <div className="task-view-progress-head">
                        <span>Time Elapsed</span>
                        <strong>{progress}%</strong>
                      </div>
                      <div className="task-view-progress">
                        <div
                          className={`task-view-progress-bar${
                            overdue ? " task-view-progress-late" : ""
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <small className="task-view-progress-note">
                        {getDueText(viewTask) || "No deadline set"}
                      </small>
                    </section> */}

                    <section className="task-view-card">
                      <h3>Comments</h3>
                      {viewTask.comments ? (
                        <div className="task-view-comment">
                          <div className="task-view-comment-head">
                            <strong>Admin</strong>
                            <small>
                              {formatDate(viewTask.updated_at || viewTask.created_at)}
                            </small>
                          </div>
                          <p>{viewTask.comments}</p>
                        </div>
                      ) : (
                        <p className="task-view-empty">No comments yet.</p>
                      )}
                    </section>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="task-view-col">
                    <section className="task-view-card">
                      <h3>Task Information</h3>
                      <div className="task-view-info">
                        <div>
                          <label>Status</label>
                          <span
                            className={`task-badge task-status-${
                              overdue
                                ? "overdue"
                                : viewTask.status?.replace(/\s+/g, "-")
                            }`}
                          >
                            {overdue ? "overdue" : viewTask.status}
                          </span>
                        </div>
                        <div>
                          <label>Priority</label>
                          <span
                            className={`task-badge task-priority-${viewTask.priority}`}
                          >
                            {viewTask.priority}
                          </span>
                        </div>
                        <div>
                          <label>Start Date</label>
                          <strong>{formatDate(viewTask.start_date)}</strong>
                        </div>
                        <div>
                          <label>Deadline</label>
                          <strong className={overdue ? "task-due-late" : ""}>
                            {formatDate(viewTask.due_date)}
                          </strong>
                        </div>
                        {/* <div>
                          <label>Created At</label>
                          <strong>{formatDateTime(viewTask.created_at)}</strong>
                        </div> */}
                        {/* <div>
                          <label>Updated At</label>
                          <strong>{formatDateTime(viewTask.updated_at)}</strong>
                        </div> */}
                      </div>
                    </section>

                    <section className="task-view-card">
                      <h3>Assigned Employee</h3>
                      <div className="task-view-employee">
                        <span className="task-view-avatar">
                          {getInitials(viewTask.emp_name)}
                        </span>
                        <div>
                          <strong>{viewTask.emp_name || "Unassigned"}</strong>
                          {viewTask.employee_code && (
                            <small>{viewTask.employee_code}</small>
                          )}
                        </div>
                      </div>
                    </section>

                    <section className="task-view-card">
                      <h3>Attachments</h3>
                      {viewTask.attachments?.length ? (
                        <div className="task-view-files">
                          {viewTask.attachments.map((attachment) => {
                            const isImage = IMAGE_EXTENSIONS.includes(
                              getExtension(attachment.name)
                            );

                            return (
                              <div className="task-view-file" key={attachment.file}>
                                <a
                                  className="task-view-file-icon"
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open"
                                >
                                  {isImage ? (
                                    <img src={attachment.url} alt="" />
                                  ) : (
                                    getFileIcon(attachment.name)
                                  )}
                                </a>

                                <div className="task-view-file-info">
                                  <strong title={attachment.name}>
                                    {attachment.name}
                                  </strong>
                                  <small>{formatFileSize(attachment.size)}</small>
                                </div>

                                <div className="task-view-file-actions">
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    View
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => downloadAttachment(attachment)}
                                  >
                                    Download
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="task-view-empty">No attachments.</p>
                      )}
                    </section>
                  </div>
                </div>

                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="admin-cancel-btn"
                    onClick={() => setViewTask(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </AdminLayout>
  );
};

export default Task;
