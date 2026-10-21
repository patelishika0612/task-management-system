
import React, { useEffect, useState } from "react";
import API from "../api";
import {
  FolderKanban,
  Search,
  Eye,
  X,
  CalendarDays,
  Building2,
  Flag,
  CircleCheck,
  RefreshCw,
  AlertCircle,
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

const EmployeeProject = ({ employee }) => {
  const [projects, setProjects] = useState([]);
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

  const filteredProjects = projects.filter((project) => {
    const query = search.toLowerCase().trim();

    return (
      String(project.proj_name || "").toLowerCase().includes(query) ||
      String(project.client_name || "").toLowerCase().includes(query) ||
      String(project.status || "").toLowerCase().includes(query) ||
      String(project.project_id || "").includes(query)
    );
  });

  const formatDate = (date) => {
    if (!date) return "Not specified";

    const value = String(date).split("T")[0];
    const parsed = new Date(`${value}T00:00:00`);

    return Number.isNaN(parsed.getTime())
      ? value
      : parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
  };

  const statusClass = (status) =>
    String(status || "not started")
      .toLowerCase()
      .replace(/\s+/g, "-");

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

        <div className="employee-project-toolbar">
          <div className="employee-project-search">
            <Search size={19} />

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
                <X size={16} />
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
          <div className="employee-project-grid">
            {filteredProjects.map((project) => (
              <article
                className="employee-project-card"
                key={project.project_id}
              >
                <div className="employee-project-card-top">
                  <span className="employee-project-id">
                    Project #{project.project_id}
                  </span>

                  <span
                    className={`employee-project-status status-${statusClass(
                      project.status
                    )}`}
                  >
                    {project.status || "Not started"}
                  </span>
                </div>

                <h2>{project.proj_name}</h2>

                <p className="employee-project-description">
                  {project.description || "No description provided."}
                </p>

                <div className="employee-project-meta">
                  <div>
                    <Building2 size={17} />
                    <span>{project.client_name || "No client specified"}</span>
                  </div>

                  <div>
                    <CalendarDays size={17} />
                    <span>
                      {formatDate(project.start_date)}
                    </span>
                  </div>

                  <div>
                    <Flag size={17} />
                    <span>
                      Priority: {project.priority || "Medium"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="employee-project-view-btn"
                  onClick={() => setSelectedProject(project)}
                >
                  <Eye size={17} />
                  View Details
                </button>
              </article>
            ))}
          </div>
        )}

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
                <div>
                  <h2 id="employee-project-modal-title">
                    Project Details
                  </h2>
                  <p>Project #{selectedProject.project_id}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  aria-label="Close project details"
                >
                  <X size={21} />
                </button>
              </div>

              <div className="employee-project-details">
                <div>
                  <label>Project Name</label>
                  <p>{selectedProject.proj_name || "—"}</p>
                </div>

                <div>
                  <label>Client Name</label>
                  <p>{selectedProject.client_name || "—"}</p>
                </div>

                <div className="employee-project-detail-full">
                  <label>Description</label>
                  <p>{selectedProject.description || "No description provided."}</p>
                </div>

                <div>
                  <label>Start Date</label>
                  <p>{formatDate(selectedProject.start_date)}</p>
                </div>

                <div>
                  <label>End Date</label>
                  <p>{formatDate(selectedProject.end_date)}</p>
                </div>

                <div>
                  <label>Priority</label>
                  <p>{selectedProject.priority || "Medium"}</p>
                </div>

                <div>
                  <label>Status</label>
                  <p>{selectedProject.status || "Not started"}</p>
                </div>

                <div>
                  <label>Created By</label>
                  <p>
                    {selectedProject.created_by_name ||
                      selectedProject.created_by ||
                      "—"}
                  </p>
                </div>
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
