
import React, { useEffect, useMemo, useState } from "react";
import API from "../api";
import {
  FolderKanban,
  Search,
  Eye,
  X,
  CalendarDays,
  CalendarCheck,
  Building2,
  Flag,
  RefreshCw,
  AlertCircle,
  Users,
  UserCircle2,
  Clock,
  FileText,
} from "lucide-react";
import "./EmployeeProject.css";
import EmployeeLayout from "../components/EmployeeLayout";



const getArrayData = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }
  return [];
};

const toDate = (date) => {
  if (!date) return null;
  const parsed = new Date(`${String(date).split("T")[0]}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (date) => {
  if (!date) return "Not specified";

  const parsed = toDate(date);

  return parsed
    ? parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : String(date).split("T")[0];
};

const toSlug = (value, fallback) =>
  String(value || fallback)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

const getInitials = (name) =>
  String(name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

// Returns a short label describing the time left until the end date.
const getTimeline = (project) => {
  const end = toDate(project.end_date);
  if (!end) return { label: "No deadline", tone: "muted" };

  if (toSlug(project.status) === "completed") {
    return { label: "Completed", tone: "success" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((end - today) / 86400000);

  if (days < 0) return { label: `${Math.abs(days)} day(s) overdue`, tone: "danger" };
  if (days === 0) return { label: "Due today", tone: "warning" };
  if (days <= 7) return { label: `${days} day(s) left`, tone: "warning" };
  return { label: `${days} days left`, tone: "info" };
};

const EmployeeProject = ({ employee }) => {
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

const employeeId =
  employee?.emp_id ??
  employee?.employee_id ??
  employee?.id ??
  localStorage.getItem("employeeId");

  useEffect(() => {
    if (employeeId == null) {
      setError("Employee information is not available. Please log in again.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchMyProjects = async () => {
      setLoading(true);
      setError("");

      try {
        const [projectsResponse, membersResponse] =
          await Promise.all([
            API.get("/projects"),
            API.get("/project-members"),
          ]);

        if (
          projectsResponse.data?.success === false ||
          membersResponse.data?.success === false
        ) {
          throw new Error(
            projectsResponse.data?.message ||
            membersResponse.data?.message ||
            "Unable to load projects."
          );
        }

        const allProjects = getArrayData(projectsResponse.data);
        const allMembers = getArrayData(membersResponse.data);

        // Find assignments belonging to this employee.
        const assignedProjectIds = new Set(
          allMembers
            .filter((member) => {
              const assignedEmployeeId =
                member.employee_id ??
                member.emp_id ??
                member.employee?.emp_id;

              return (
                assignedEmployeeId != null &&
                Number(assignedEmployeeId) === Number(employeeId)
              );
            })
            .map((member) => Number(member.project_id))
            .filter((id) => Number.isInteger(id) && id > 0)
        );

        const myProjects = allProjects.filter((project) =>
          assignedProjectIds.has(Number(project.project_id))
        );

        if (!cancelled) {
          setProjects(myProjects);
          setMembers(
            allMembers.filter((member) =>
              assignedProjectIds.has(Number(member.project_id))
            )
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
            err.message ||
            "Unable to load your projects."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchMyProjects();

    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  // Close the details modal with the Escape key.
  useEffect(() => {
    if (!selectedProject) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setSelectedProject(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedProject]);

  const filteredProjects = projects.filter((project) => {
    const query = search.toLowerCase().trim();

    return (
      String(project.proj_name || "").toLowerCase().includes(query) ||
      String(project.client_name || "").toLowerCase().includes(query) ||
      String(project.status || "").toLowerCase().includes(query) ||
      String(project.priority || "").toLowerCase().includes(query) ||
      String(project.project_id || "").includes(query)
    );
  });

  const teamMembers = useMemo(() => {
    if (!selectedProject) return [];

    return members.filter(
      (member) =>
        Number(member.project_id) === Number(selectedProject.project_id)
    );
  }, [members, selectedProject]);

  const myAssignment = teamMembers.find(
    (member) =>
      Number(member.employee_id ?? member.emp_id) === Number(employeeId)
  );

  const timeline = selectedProject ? getTimeline(selectedProject) : null;

  return (
    <EmployeeLayout>
      <div className="employee-project-page">
        <div className="employee-project-header">
          <div className="employee-project-heading">
            <div className="employee-project-heading-icon">
              <FolderKanban size={27} />
            </div>

            <div>
              <h1>My Projects</h1>
              <p>View projects assigned to you by your administrator.</p>
            </div>
          </div>

          <div className="employee-project-count">
            {projects.length} Project{projects.length !== 1 ? "s" : ""}
          </div>
        </div>

        {error && (
          <div className="employee-project-alert">
            <AlertCircle size={19} />
            <span>{error}</span>
          </div>
        )}

        <div className="employee-project-card">
          <div className="employee-project-card-header">
            <div>
              <h2>Project List</h2>
              <p>
                Showing {filteredProjects.length} of {projects.length} project
                {projects.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="employee-project-search">
              <Search size={17} />

              <input
                type="search"
                placeholder="Search project, client, status or ID..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="employee-project-empty">
              <RefreshCw className="employee-project-spinner" size={30} />
              <h3>Loading your projects...</h3>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="employee-project-empty">
              <FolderKanban size={42} />
              <h3>
                {search ? "No matching projects" : "No projects assigned yet"}
              </h3>
              <p>
                {search
                  ? "Try searching with another keyword."
                  : "Projects assigned to you by the administrator will appear here."}
              </p>
            </div>
          ) : (
            <div className="employee-project-table-wrap">
              <table className="employee-project-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Project</th>
                    <th>Client</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th className="employee-project-th-action">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProjects.map((project, index) => (
                    <tr key={project.project_id}>
                      <td className="employee-project-index">{index + 1}</td>

                      <td>
                        <div className="employee-project-name-cell">
                          <div className="employee-project-avatar">
                            {getInitials(project.proj_name)}
                          </div>

                          <div>
                            <strong>{project.proj_name}</strong>
                            <span>
                              #{project.project_id}
                              {project.description
                                ? ` · ${project.description}`
                                : ""}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="employee-project-icon-cell">
                          <Building2 size={15} />
                          {project.client_name || "—"}
                        </div>
                      </td>

                      <td className="employee-project-nowrap">
                        {formatDate(project.start_date)}
                      </td>

                      <td className="employee-project-nowrap">
                        {formatDate(project.end_date)}
                      </td>

                      <td>
                        <span
                          className={`employee-project-priority priority-${toSlug(
                            project.priority,
                            "medium"
                          )}`}
                        >
                          <Flag size={12} />
                          {project.priority || "Medium"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`employee-project-status status-${toSlug(
                            project.status,
                            "not started"
                          )}`}
                        >
                          {project.status || "Not started"}
                        </span>
                      </td>

                      <td className="employee-project-th-action">
                        <button
                          type="button"
                          className="employee-project-view-btn"
                          onClick={() => setSelectedProject(project)}
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedProject && (
          <div
            className="employee-project-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedProject(null);
              }
            }}
          >
            <div
              className="employee-project-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="employee-project-modal-title"
            >
              <div className="employee-project-modal-header">
                <div className="employee-project-modal-title">
                  <div className="employee-project-avatar employee-project-avatar-lg">
                    {getInitials(selectedProject.proj_name)}
                  </div>

                  <div>
                    <h2 id="employee-project-modal-title">
                      {selectedProject.proj_name || "Project Details"}
                    </h2>

                    <div className="employee-project-modal-tags">
                      <span className="employee-project-id-tag">
                        Project #{selectedProject.project_id}
                      </span>

                      <span
                        className={`employee-project-status status-${toSlug(
                          selectedProject.status,
                          "not started"
                        )}`}
                      >
                        {selectedProject.status || "Not started"}
                      </span>

                      <span
                        className={`employee-project-priority priority-${toSlug(
                          selectedProject.priority,
                          "medium"
                        )}`}
                      >
                        <Flag size={12} />
                        {selectedProject.priority || "Medium"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  aria-label="Close project details"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="employee-project-modal-body">
                <div className="employee-project-stats">
                  <div className="employee-project-stat">
                    <CalendarDays size={18} />
                    <div>
                      <label>Start Date</label>
                      <p>{formatDate(selectedProject.start_date)}</p>
                    </div>
                  </div>

                  <div className="employee-project-stat">
                    <CalendarCheck size={18} />
                    <div>
                      <label>End Date</label>
                      <p>{formatDate(selectedProject.end_date)}</p>
                    </div>
                  </div>

                  <div className={`employee-project-stat tone-${timeline.tone}`}>
                    <Clock size={18} />
                    <div>
                      <label>Timeline</label>
                      <p>{timeline.label}</p>
                    </div>
                  </div>
                </div>

                <section className="employee-project-section">
                  <h3>
                    <FileText size={16} />
                    Description
                  </h3>
                  <p className="employee-project-description">
                    {selectedProject.description || "No description provided."}
                  </p>
                </section>

                <section className="employee-project-section">
                  <h3>
                    <Building2 size={16} />
                    Project Information
                  </h3>

                  <div className="employee-project-details">
                    <div>
                      <label>Client Name</label>
                      <p>{selectedProject.client_name || "—"}</p>
                    </div>

                    <div>
                      <label>Created By</label>
                      <p>
                        {selectedProject.created_by_name ||
                          selectedProject.created_by ||
                          "—"}
                      </p>
                    </div>

                    <div>
                      <label>Assigned To You On</label>
                      <p>{formatDate(myAssignment?.assigned_at)}</p>
                    </div>

                    <div>
                      <label>Team Size</label>
                      <p>
                        {teamMembers.length} member
                        {teamMembers.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="employee-project-section">
                  <h3>
                    <Users size={16} />
                    Team Members
                  </h3>

                  {teamMembers.length === 0 ? (
                    <p className="employee-project-muted">
                      No team members found.
                    </p>
                  ) : (
                    <ul className="employee-project-team">
                      {teamMembers.map((member) => {
                        const isMe =
                          Number(member.employee_id ?? member.emp_id) ===
                          Number(employeeId);

                        return (
                          <li key={member.id ?? member.employee_id}>
                            <div className="employee-project-member-avatar">
                              {member.emp_name ? (
                                getInitials(member.emp_name)
                              ) : (
                                <UserCircle2 size={18} />
                              )}
                            </div>

                            <div className="employee-project-member-info">
                              <strong>
                                {member.emp_name || "Unknown"}
                                {isMe && (
                                  <span className="employee-project-you">You</span>
                                )}
                              </strong>
                              <span>{member.email || "—"}</span>
                            </div>

                            <small>{member.employee_code}</small>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </div>

              <div className="employee-project-modal-footer">
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                >
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

export default EmployeeProject;
