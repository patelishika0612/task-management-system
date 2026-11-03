import React, { useCallback, useEffect, useMemo, useState } from "react";
import EmployeeLayout from "../components/EmployeeLayout";
import {
  Search,
  RefreshCw,
  ListChecks,
  Eye,
  X,
  Clock3,
  CheckCircle2,
  PauseCircle,
  AlertTriangle,
  Paperclip,
  FileText,
  FileSpreadsheet,
  FileArchive,
  CalendarDays,
  FolderKanban,
  Flag,
  MessageSquare,
} from "lucide-react";
import API from "../api";
import "./EmployeeTask.css";

const PAGE_SIZE = 6;

const getArrayData = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.tasks)) return response.data.tasks;
  if (Array.isArray(response?.tasks)) return response.tasks;
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

const getEmployeeFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem("employee") || "{}");
  } catch {
    return {};
  }
};

const getInitials = (name = "") =>
  String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "NA";

const normalize = (value) => String(value ?? "").trim().toLowerCase();

const toSlug = (value, fallback = "unknown") =>
  normalize(value || fallback).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const formatDate = (value) => {
  if (!value) return "—";
  const raw = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T00:00:00`)
    : new Date(raw);
  if (Number.isNaN(date.getTime())) return raw.split("T")[0] || "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getToday = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const isOverdue = (task) => {
  const status = normalize(task.status);
  return Boolean(
    task.due_date &&
      !["completed", "complete", "done"].includes(status) &&
      String(task.due_date).slice(0, 10) < getToday()
  );
};

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

const parseAttachments = (task) => {
  const raw = task.attachments ?? task.attachment ?? task.files;
  const parsed = safeJson(raw, raw);
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed;
  if (typeof parsed === "object") return [parsed];
  return [];
};

const getFileName = (file) =>
  file?.name || file?.originalname || file?.filename || file?.file || "Attachment";

const getFileUrl = (file) =>
  file?.url || file?.path || file?.file_url || file?.file_path || "";

const getFileIcon = (name = "") => {
  const ext = String(name).split(".").pop().toLowerCase();
  if (["xls", "xlsx", "csv"].includes(ext)) return <FileSpreadsheet size={19} />;
  if (["zip", "rar", "7z"].includes(ext)) return <FileArchive size={19} />;
  return <FileText size={19} />;
};

const getFileSize = (bytes) => {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const OFFICE_EXTENSIONS = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"];

// Browsers can only show images, PDFs and text inline, so Word/Excel/PowerPoint
// files open in Microsoft's online viewer. It fetches the file itself, which
// only works for publicly reachable URLs (not localhost).
const getViewUrl = (url, name) => {
  const ext = String(name).split(".").pop().toLowerCase();
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(url);
  if (!OFFICE_EXTENSIONS.includes(ext) || isLocal) return url;
  return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`;
};

// Uploads live on the API origin, where the `download` attribute is ignored,
// so fetch the file and save it under its original name.
const downloadAttachment = async (url, name) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Download failed");

    const blobUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};

const EmployeeTask = ({ employee }) => {
  const storedEmployee = useMemo(getEmployeeFromStorage, []);
  const employeeId =
    employee?.emp_id ??
    employee?.employee_id ??
    employee?.id ??
    storedEmployee?.emp_id ??
    storedEmployee?.employee_id ??
    storedEmployee?.id ??
    localStorage.getItem("employeeId");

  const storedEmployeeCode =
    employee?.employee_code ||
    employee?.employeeCode ||
    storedEmployee?.employee_code ||
    storedEmployee?.employeeCode ||
    localStorage.getItem("employee_code") ||
    localStorage.getItem("employeeCode") ||
    "";

  const [tasks, setTasks] = useState([]);
  const [employeeCode, setEmployeeCode] = useState(storedEmployeeCode);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewTask, setViewTask] = useState(null);
const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const requests = [API.get("/tasks")];
      if (employeeId != null && !storedEmployeeCode) {
        requests.push(API.get("/employees"));
      }

      const responses = await Promise.all(requests);
      const allTasks = getArrayData(responses[0]?.data);

      let code = storedEmployeeCode;

      if (!code && responses[1]) {
        const employees = getArrayData(responses[1]?.data);
        const currentEmployee = employees.find((item) => {
          const id =
            item.emp_id ??
            item.employee_id ??
            item.id ??
            item.employee?.emp_id;
          return id != null && Number(id) === Number(employeeId);
        });

        code =
          currentEmployee?.employee_code ||
          currentEmployee?.employeeCode ||
          currentEmployee?.emp_code ||
          "";
      }

      if (!code) {
        setEmployeeCode("");
        setTasks([]);
        setError(
          "Employee details could not be identified. Please log out and log in again, or contact your administrator."
        );
        return;
      }

      setEmployeeCode(String(code));

      const assigned = allTasks.filter((task) => {
        const assignedCodes = parseEmployeeCodes(task);
        return assignedCodes.some(
          (assignedCode) => normalize(assignedCode) === normalize(code)
        );
      });

      setTasks(assigned);
    } catch (err) {
      console.error("Employee task fetch error:", err);
      setTasks([]);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load your assigned tasks. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [employeeId, storedEmployeeCode]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!viewTask) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setViewTask(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewTask]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        String(task.task_name || "").toLowerCase().includes(query) ||
        String(task.task_id || "").toLowerCase().includes(query) ||
        String(task.proj_name || task.project_name || "").toLowerCase().includes(query) ||
        String(task.description || "").toLowerCase().includes(query);

      const matchesStatus =
        !statusFilter || normalize(task.status) === normalize(statusFilter);
      const matchesPriority =
        !priorityFilter || normalize(task.priority) === normalize(priorityFilter);

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE));
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, priorityFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const stats = useMemo(
    () => [
      {
        label: "My Tasks",
        value: tasks.length,
        icon: <ListChecks size={20} />,
        tone: "blue",
      },
      {
        label: "Pending",
        value: tasks.filter((task) => normalize(task.status) === "pending").length,
        icon: <Clock3 size={20} />,
        tone: "orange",
      },
      {
        label: "In Progress",
        value: tasks.filter((task) => normalize(task.status) === "in progress").length,
        icon: <RefreshCw size={20} />,
        tone: "purple",
      },
      {
        label: "Completed",
        value: tasks.filter((task) =>
          ["completed", "complete", "done"].includes(normalize(task.status))
        ).length,
        icon: <CheckCircle2 size={20} />,
        tone: "green",
      },
      {
        label: "Overdue",
        value: tasks.filter(isOverdue).length,
        icon: <AlertTriangle size={20} />,
        tone: "red",
      },
    ],
    [tasks]
  );



  const handleTaskStatusUpdate = async (newStatus) => {
  if (!viewTask || updatingStatus) return;

  try {
    setUpdatingStatus(true);
    setError("");

    const taskId = viewTask.task_id ?? viewTask.id;

    const response = await API.patch(
      `/tasks/${taskId}/status`,
      { status: newStatus }
    );

    const updatedTask = response.data?.data || {
      ...viewTask,
      status: newStatus,
    };

    // Update task in employee list
    setTasks((previous) =>
      previous.map((task) =>
        String(task.task_id ?? task.id) === String(taskId)
          ? { ...task, ...updatedTask, status: newStatus }
          : task
      )
    );

    // Update open popup
    setViewTask((previous) =>
      previous
        ? { ...previous, ...updatedTask, status: newStatus }
        : null
    );
  } catch (err) {
    console.error("Task status update error:", err);

    setError(
      err.response?.data?.message ||
      "Unable to update task status."
    );
  } finally {
    setUpdatingStatus(false);
  }
};

  const openTask = (task) => setViewTask(task);

  return (
    <EmployeeLayout>
      <div className="employee-task-page">
        <div className="employee-task-header">
          <div className="employee-task-heading">
            <div className="employee-task-heading-icon">
              <ListChecks size={26} />
            </div>
            <div>
              <h1>My Tasks</h1>
              <p>View and manage the tasks assigned to you.</p>
            </div>
          </div>

          <div className="employee-task-header-actions">
            {employeeCode && (
              <span className="employee-task-employee-code">
                Employee ID: {employeeCode}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="employee-task-error" role="alert">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="employee-task-stats">
          {stats.map((stat) => (
            <div className="employee-task-stat" key={stat.label}>
              <div className={`employee-task-stat-icon ${stat.tone}`}>
                {stat.icon}
              </div>
              <div className="employee-task-stat-content">
                <h2>{stat.value}</h2>
                <p>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="employee-task-card">
          <div className="employee-task-card-header">
            <div>
              <h2>Assigned Tasks</h2>
              <p>
                Showing {paginatedTasks.length} of {filteredTasks.length} task
                {filteredTasks.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="employee-task-filters">
              <label className="employee-task-search">
                <Search size={17} />
                <input
                  type="search"
                  placeholder="Search task or project..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                  >
                    <X size={15} />
                  </button>
                )}
              </label>

              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in progress">In Progress</option>
                <option value="on hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>

              <select
                aria-label="Filter by priority"
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
              >
                <option value="">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="employee-task-table-wrap">
            <table className="employee-task-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>Due Date</th>
                  <th>Files</th>
                  <th className="employee-task-action-heading">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9">
                      <div className="employee-task-empty">
                        <RefreshCw size={27} className="employee-task-spin" />
                        <strong>Loading your tasks...</strong>
                        <span>Please wait while we fetch your assignments.</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedTasks.length === 0 ? (
                  <tr>
                    <td colSpan="9">
                      <div className="employee-task-empty">
                        <div className="employee-task-empty-icon">
                          <ListChecks size={30} />
                        </div>
                        <strong>
                          {search || statusFilter || priorityFilter
                            ? "No matching tasks found"
                            : "No tasks assigned yet"}
                        </strong>
                        <span>
                          {search || statusFilter || priorityFilter
                            ? "Try changing your search or filters."
                            : "Tasks assigned to you by the administrator will appear here."}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTasks.map((task, index) => {
                    const attachments = parseAttachments(task);
                    const status = task.status || "Pending";
                    const priority = task.priority || "Medium";
                    const projectName = task.proj_name || task.project_name;

                    return (
                      <tr key={task.task_id ?? task.id ?? `${currentPage}-${index}`}>
                        <td className="employee-task-row-number">
                          {(currentPage - 1) * PAGE_SIZE + index + 1}
                        </td>
                        <td>
                          <div className="employee-task-name-cell">
                            <div className="employee-task-name">
                              <strong>{task.task_name || "Untitled task"}</strong>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="employee-task-project-cell">
                            <span>{projectName || "—"}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`employee-task-badge priority-${toSlug(priority)}`}>
                            <Flag size={12} />
                            {priority}
                          </span>
                        </td>
                        <td>
                          <span className={`employee-task-badge status-${toSlug(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td className="employee-task-nowrap">
                          {formatDate(task.start_date)}
                        </td>
                        <td>
                          <div className={`employee-task-due ${isOverdue(task) ? "is-overdue" : ""}`}>
                            <span>{formatDate(task.due_date)}</span>
                            {isOverdue(task) && <small>Overdue</small>}
                          </div>
                        </td>
                        <td>
                          {attachments.length ? (
                            <span className="employee-task-file-count">
                              <Paperclip size={14} />
                              {attachments.length}
                            </span>
                          ) : (
                            <span className="employee-task-muted">—</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="employee-task-view-btn"
                            onClick={() => openTask(task)}
                          >
                            <Eye size={15} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredTasks.length > 0 && (
            <div className="employee-task-pagination">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div>
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        {viewTask && (
          <div
            className="employee-task-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setViewTask(null);
            }}
          >
            <div
              className="employee-task-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="employee-task-modal-title"
            >
              <div className="employee-task-modal-header">
                <div className="employee-task-modal-title-wrap">
                  <div>
                    <h2 id="employee-task-modal-title">
                      {viewTask.task_name || "Task Details"}
                    </h2>
                    <p>{viewTask.proj_name || viewTask.project_name || "No project linked"}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="employee-task-modal-close"
                  onClick={() => setViewTask(null)}
                  aria-label="Close task details"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="employee-task-modal-body">
                <section className="employee-task-detail-section">
                  <h3>Task Overview</h3>
                  <div className="employee-task-info-grid">
                    <div className="employee-task-info-item">
                      <span>Status</span>
                      <strong className={`employee-task-badge status-${toSlug(viewTask.status || "pending")}`}>
                        {viewTask.status || "Pending"}
                      </strong>
                    </div>
                    <div className="employee-task-info-item">
                      <span>Priority</span>
                      <strong className={`employee-task-badge priority-${toSlug(viewTask.priority || "medium")}`}>
                        <Flag size={12} />
                        {viewTask.priority || "Medium"}
                      </strong>
                    </div>
                    <div className="employee-task-info-item">
                      <span><CalendarDays size={14} /> Start Date</span>
                      <strong>{formatDate(viewTask.start_date)}</strong>
                    </div>
                    <div className="employee-task-info-item">
                      <span><CalendarDays size={14} /> Due Date</span>
                      <strong className={isOverdue(viewTask) ? "employee-task-overdue-text" : ""}>
                        {formatDate(viewTask.due_date)}
                        {isOverdue(viewTask) ? " · Overdue" : ""}
                      </strong>
                    </div>
                    <div className="employee-task-info-item">
                      <span><FolderKanban size={14} /> Project</span>
                      <strong>{viewTask.proj_name || viewTask.project_name || "—"}</strong>
                    </div>
                    <div className="employee-task-info-item">
                      <span>Assigned Employee</span>
                      <strong>{employeeCode || "You"}</strong>
                    </div>
                  </div>
                </section>
<section className="employee-task-detail-section">
  <h3>Update Task Progress</h3>

  {normalize(viewTask.status) === "completed" ? (
    <div className="employee-task-completed-message">
      <CheckCircle2 size={20} />
      <div>
        <strong>Task Completed</strong>
        <p>You have successfully completed this task.</p>
      </div>
    </div>
  ) : normalize(viewTask.status) === "in progress" ? (
    <div className="employee-task-progress-actions">
      <div className="employee-task-progress-message">
        <Clock3 size={18} />
        <span>Work is currently in progress.</span>
      </div>

      <button
        type="button"
        className="employee-task-done-btn"
        disabled={updatingStatus}
        onClick={() => handleTaskStatusUpdate("completed")}
      >
        <CheckCircle2 size={17} />
        {updatingStatus ? "Updating..." : "Mark as Done"}
      </button>
    </div>
  ) : (
    <div className="employee-task-start-actions">
      <p>
        This task is waiting for you to start working.
      </p>

      <button
        type="button"
        className="employee-task-start-btn"
        disabled={updatingStatus}
        onClick={() => handleTaskStatusUpdate("in progress")}
      >
        {updatingStatus ? "Starting..." : "Start Work"}
      </button>
    </div>
  )}
</section>

                <section className="employee-task-detail-section">
                  <h3><FileText size={16} /> Description</h3>
                  <p className="employee-task-description">
                    {viewTask.description || "No description provided."}
                  </p>
                </section>

                <section className="employee-task-detail-section">
                  <h3><MessageSquare size={16} /> Comments & Instructions</h3>
                  <p className="employee-task-description">
                    {viewTask.comments || viewTask.comment || "No comments or instructions available."}
                  </p>
                </section>

                <section className="employee-task-detail-section">
                  <h3><Paperclip size={16} /> Attachments</h3>
                  {parseAttachments(viewTask).length ? (
                    <div className="employee-task-files">
                      {parseAttachments(viewTask).map((file, index) => {
                        const name = getFileName(file);
                        const url = getFileUrl(file);
                        return (
                          <div className="employee-task-file" key={`${name}-${index}`}>
                            <div className="employee-task-file-icon">{getFileIcon(name)}</div>
                            <div className="employee-task-file-info">
                              <strong>{name}</strong>
                              <span>{getFileSize(file.size || file.file_size) || "Attached file"}</span>
                            </div>
                            {url ? (
                              <div className="employee-task-file-actions">
                                <a
                                  href={getViewUrl(url, name)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View
                                </a>
                                <button
                                  type="button"
                                  onClick={() => downloadAttachment(url, name)}
                                >
                                  Download
                                </button>
                              </div>
                            ) : (
                              <span className="employee-task-muted">No file URL</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="employee-task-muted">No attachments available.</p>
                  )}
                </section>
              </div>

              <div className="employee-task-modal-footer">
                <button type="button" onClick={() => setViewTask(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeTask;
