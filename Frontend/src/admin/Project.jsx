
import React, { useEffect, useState, useRef } from "react";
import AdminLayout from "../components/AdminLayout";
import API from "../api";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  FolderKanban,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import "./Project.css";

const PAGE_SIZE = 5;

const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"];

const STATUS_OPTIONS = [
  "not started",
  "in progress",
  "on hold",
  "completed",
  "cancelled",
];

const EMPTY_FORM = {
  proj_name: "",
  description: "",
  client_name: "",
  start_date: "",
  end_date: "",
  priority: "medium",
  status: "not started",
  created_by: [],
};

// Handles errors returned by Axios
const getErrorMessage = (error, fallback) => {
  const data = error.response?.data;

  if (Array.isArray(data?.errors)) {
    return (
      data.errors
        .map((item) => item.message)
        .filter(Boolean)
        .join(", ") || fallback
    );
  }

  return data?.message || error.message || fallback;
};

// Normalizes common API response formats
const getArrayData = (responseData) => {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.data?.data)) {
    return responseData.data.data;
  }
  return [];
};

const checkApiResponse = (data, fallback) => {
  if (data?.success === false) {
    throw new Error(data.message || fallback);
  }
  return data;
};

const Project = () => {
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewProject, setViewProject] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [empSearch, setEmpSearch] = useState("");
  const [empDropOpen, setEmpDropOpen] = useState(false);
  const empDropRef = useRef(null);

  const [clientSearch, setClientSearch] = useState("");
  const [clientDropOpen, setClientDropOpen] = useState(false);
  const clientDropRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================
  // FETCH PROJECTS
  // =========================================
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/projects");
      const result = checkApiResponse(
        response.data,
        "Unable to fetch projects."
      );

      setProjects(getArrayData(result));
    } catch (err) {
      setError(getErrorMessage(err, "Unable to fetch projects."));
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // FETCH EMPLOYEES
  // =========================================
  const fetchEmployees = async () => {
    try {
      const response = await API.get("/employees");
      const result = checkApiResponse(
        response.data,
        "Unable to fetch employees."
      );

      setEmployees(getArrayData(result));
    } catch (err) {
      console.error(
        "Employee fetch error:",
        getErrorMessage(err, "Unable to fetch employees.")
      );
    }
  };

  // =========================================
  // FETCH CLIENTS
  // =========================================
  const fetchClients = async () => {
    try {
      const response = await API.get("/clients");
      const result = checkApiResponse(
        response.data,
        "Unable to fetch clients."
      );

      setClients(getArrayData(result));
    } catch (err) {
      console.error(
        "Client fetch error:",
        getErrorMessage(err, "Unable to fetch clients.")
      );
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
    fetchClients();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // =========================================
  // CLOSE DROPDOWNS ON OUTSIDE CLICK
  // =========================================
  useEffect(() => {
    const handler = (event) => {
      if (
        empDropRef.current &&
        !empDropRef.current.contains(event.target)
      ) {
        setEmpDropOpen(false);
      }

      if (
        clientDropRef.current &&
        !clientDropRef.current.contains(event.target)
      ) {
        setClientDropOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  // =========================================
  // FORM CHANGE
  // =========================================
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  // =========================================
  // VIEW PROJECT
  // =========================================
  const openViewModal = (project) => {
    setViewProject(project);
  };

  // =========================================
  // ADD PROJECT
  // =========================================
  const openAddModal = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });

    setEmpSearch("");
    setClientSearch("");
    setEmpDropOpen(false);
    setClientDropOpen(false);

    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  // =========================================
  // EDIT PROJECT
  // =========================================
  const openEditModal = async (project) => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      let employeeList = employees;

      // Ensure employees are loaded
      if (employeeList.length === 0) {
        const employeeResponse = await API.get("/employees");
        const employeeResult = checkApiResponse(
          employeeResponse.data,
          "Unable to fetch employees."
        );

        employeeList = getArrayData(employeeResult);
        setEmployees(employeeList);
      }

      // Get project details
      const projectResponse = await API.get(
        `/projects/${project.project_id}`
      );

      const projectResult = checkApiResponse(
        projectResponse.data,
        "Unable to fetch project details."
      );

      const data =
        projectResult.data?.project ||
        projectResult.data ||
        projectResult.project ||
        projectResult;

      // Get project-member assignments
      const membersResponse = await API.get("/project-members");
      const membersResult = checkApiResponse(
        membersResponse.data,
        "Unable to fetch project assignments."
      );

      const allMembers = getArrayData(membersResult);

      const projectMembers = allMembers.filter(
        (member) =>
          Number(member.project_id) === Number(data.project_id)
      );

      const selectedEmployeeCodes = [
        ...new Set(
          projectMembers
            .map((member) => {
              const memberEmployeeId =
                member.emp_id ?? member.employee_id;

              const employee = employeeList.find(
                (item) =>
                  (member.employee_code &&
                    String(item.employee_code) ===
                      String(member.employee_code)) ||
                  (memberEmployeeId != null &&
                    Number(item.emp_id) === Number(memberEmployeeId))
              );

              return employee?.employee_code || null;
            })
            .filter(Boolean)
        ),
      ];

      // Fallback for older projects without member assignments
      if (
        selectedEmployeeCodes.length === 0 &&
        data.created_by != null
      ) {
        const creator = employeeList.find(
          (item) =>
            Number(item.emp_id) === Number(data.created_by)
        );

        if (creator?.employee_code) {
          selectedEmployeeCodes.push(creator.employee_code);
        }
      }

      setEditId(data.project_id);

      setForm({
        proj_name: data.proj_name || "",
        description: data.description || "",
        client_name: data.client_name || "",
        start_date: data.start_date
          ? String(data.start_date).split("T")[0]
          : "",
        end_date: data.end_date
          ? String(data.end_date).split("T")[0]
          : "",
        priority: data.priority || "medium",
        status: data.status || "not started",
        created_by: selectedEmployeeCodes,
      });

      setEmpSearch("");
      setClientSearch("");
      setEmpDropOpen(false);
      setClientDropOpen(false);

      setIsModalOpen(true);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to open project."));
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // CLOSE FORM MODAL
  // =========================================
  const closeModal = () => {
    if (saving) return;

    setIsModalOpen(false);
    setEditId(null);
    setForm({ ...EMPTY_FORM });

    setEmpSearch("");
    setClientSearch("");
    setEmpDropOpen(false);
    setClientDropOpen(false);

    setError("");
  };

  // =========================================
  // SAVE PROJECT AND ASSIGN EMPLOYEES
  // =========================================
  const handleSubmit = async (event) => {
    event.preventDefault();

    const {
      proj_name,
      client_name,
      start_date,
      end_date,
      created_by,
    } = form;

    if (!proj_name.trim()) {
      setError("Project name is required.");
      return;
    }

    if (
      proj_name.trim().length < 3 ||
      proj_name.trim().length > 150
    ) {
      setError("Project name must be 3–150 characters.");
      return;
    }

    if (form.description.length > 1000) {
      setError("Description cannot exceed 1000 characters.");
      return;
    }

    if (!client_name.trim()) {
      setError("Client name is required.");
      return;
    }

    if (!start_date) {
      setError("Start date is required.");
      return;
    }

    if (end_date && end_date < start_date) {
      setError("End date cannot be before start date.");
      return;
    }

    if (!created_by || created_by.length === 0) {
      setError("Please select at least one employee.");
      return;
    }

    // Convert employee codes to numeric IDs
    const selectedEmployeeIds = [
      ...new Set(
        created_by
          .map((code) => {
            const employee = employees.find(
              (item) => item.employee_code === code
            );

            return employee ? Number(employee.emp_id) : null;
          })
          .filter((id) => Number.isInteger(id) && id > 0)
      ),
    ];

    if (selectedEmployeeIds.length === 0) {
      setError("No valid employees were selected.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const isEditing = editId !== null;

      // created_by stores one employee ID in the projects table
      const projectPayload = {
        proj_name: form.proj_name.trim(),
        description: form.description,
        client_name: form.client_name,
        start_date: form.start_date,
        end_date: form.end_date || null,
        priority: form.priority,
        status: form.status,
        created_by: selectedEmployeeIds[0],
      };

      // STEP 1: Create or update project
      const projectResponse = isEditing
        ? await API.put(`/projects/${editId}`, projectPayload)
        : await API.post("/projects", projectPayload);

      const projectResult = checkApiResponse(
        projectResponse.data,
        "Unable to save project."
      );

      const projectId = isEditing
        ? Number(editId)
        : Number(
            projectResult.project_id ??
              projectResult.insertId ??
              projectResult.data?.project_id ??
              projectResult.data?.insertId ??
              projectResult.data?.project?.project_id ??
              projectResult.project?.project_id
          );

      if (!Number.isInteger(projectId) || projectId <= 0) {
        throw new Error(
          "Project ID was not returned by the API. Check the POST /projects response."
        );
      }

      // STEP 2: Get existing project assignments
      const membersResponse = await API.get("/project-members");
      const membersResult = checkApiResponse(
        membersResponse.data,
        "Unable to fetch project assignments."
      );

      const allMembers = getArrayData(membersResult);

      const existingMembers = allMembers.filter(
        (member) => Number(member.project_id) === projectId
      );

      // STEP 3: Remove existing assignments while editing
      if (isEditing) {
        for (const member of existingMembers) {
          const memberId = member.id ?? member.member_id;

          if (memberId == null) {
            throw new Error(
              "Project member ID is missing. Check GET /project-members."
            );
          }

          const deleteResponse = await API.delete(
            `/project-members/${memberId}`
          );

          checkApiResponse(
            deleteResponse.data,
            "Unable to remove an existing employee assignment."
          );
        }
      }

      // STEP 4: Assign selected employees
      for (const employeeId of selectedEmployeeIds) {
        const alreadyAssigned = existingMembers.some(
          (member) =>
            Number(member.emp_id ?? member.employee_id) === employeeId
        );

        if (!isEditing && alreadyAssigned) {
          continue;
        }

        const memberResponse = await API.post("/project-members", {
          project_id: projectId,
          employee_id: employeeId,
        });

        checkApiResponse(
          memberResponse.data,
          `Unable to assign employee ID ${employeeId}.`
        );
      }

      // STEP 5: Success
      setSuccess(
        isEditing
          ? "Project and employee assignments updated successfully."
          : "Project created and employees assigned successfully."
      );

      setIsModalOpen(false);
      setEditId(null);
      setForm({ ...EMPTY_FORM });

      setEmpSearch("");
      setClientSearch("");
      setEmpDropOpen(false);
      setClientDropOpen(false);

      await fetchProjects();
    } catch (err) {
      console.error("Project save error:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to save project or assign employees."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // DELETE PROJECT
  // =========================================
  const handleDelete = async (project) => {
    if (!window.confirm(`Delete "${project.proj_name}"?`)) {
      return;
    }

    setError("");
    setSuccess("");
    setDeletingId(project.project_id);

    try {
      const response = await API.delete(
        `/projects/${project.project_id}`
      );

      checkApiResponse(
        response.data,
        "Unable to delete project."
      );

      setSuccess(
        response.data.message || "Project deleted successfully."
      );

      await fetchProjects();
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to delete project.")
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================
  // FILTER AND PAGINATION
  // =========================================
  const filtered = projects.filter((project) => {
    const query = search.toLowerCase().trim();

    return (
      String(project.proj_name || "")
        .toLowerCase()
        .includes(query) ||
      String(project.client_name || "")
        .toLowerCase()
        .includes(query) ||
      String(project.status || "")
        .toLowerCase()
        .includes(query) ||
      String(project.project_id || "").includes(query)
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

  // =========================================
  // CLIENT FILTER
  // =========================================
  const filteredClients = clients.filter((client) =>
    String(client.Client_Name || "")
      .toLowerCase()
      .includes(clientSearch.toLowerCase())
  );

  // =========================================
  // EMPLOYEE FILTER
  // =========================================
  const filteredEmployees = employees.filter((employee) => {
    const name = String(employee.emp_name || "").toLowerCase();
    const code = String(employee.employee_code || "").toLowerCase();
    const query = empSearch.toLowerCase();

    return name.includes(query) || code.includes(query);
  });

  // =========================================
  // RENDER
  // =========================================
  return (
    <AdminLayout>
      <div className="admin-page">
        {/* HEADER */}
        <div className="admin-page-header">
          <div className="admin-page-heading">
            <div className="admin-page-heading-icon">
              <FolderKanban size={25} />
            </div>

            <div>
              <h1>Projects</h1>
              <p>Manage your organization's projects</p>
            </div>
          </div>

          <button
            type="button"
            className="admin-add-btn"
            onClick={openAddModal}
          >
            <Plus size={19} />
            Add Project
          </button>
        </div>

        {/* SUCCESS ALERT */}
        {success && (
          <div className="admin-alert admin-alert-success">
            <CheckCircle size={18} />
            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Dismiss success message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* ERROR ALERT */}
        {error && !isModalOpen && (
          <div className="admin-alert admin-alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* PROJECT TABLE CARD */}
        <div className="admin-table-card">
          <div className="admin-table-card-header">
            <div>
              <h2>Project List</h2>
              <p>View, edit, and manage projects</p>
            </div>
          </div>

          {/* SEARCH */}
          <div className="admin-toolbar">
            <div className="admin-search">
              <Search size={19} />

              <input
                type="search"
                placeholder="Search by ID, name, client or status..."
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

            <span className="admin-result-count">
              {filtered.length} project
              {filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* TABLE */}
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Project Name</th>
                  <th>Client</th>
                  <th>Priority</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading && projects.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="admin-table-empty">
                      <RefreshCw
                        size={22}
                        className="admin-spinning"
                      />
                      <p>Loading projects...</p>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="admin-table-empty">
                      <FolderKanban size={32} />

                      <h3>
                        {search
                          ? "No projects found"
                          : "No projects added yet"}
                      </h3>

                      <p>
                        {search
                          ? "Try a different search."
                          : "Click Add Project to get started."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((project) => (
                    <tr key={project.project_id}>
                      <td>
                        <span className="admin-table-id">
                          {project.project_id}
                        </span>
                      </td>

                      <td>{project.proj_name}</td>
                      <td>{project.client_name}</td>

                      <td>
                        <span
                          className={`admin-status-badge admin-priority-${project.priority}`}
                        >
                          {project.priority}
                        </span>
                      </td>

                      <td>
                        {project.start_date
                          ? String(project.start_date).split("T")[0]
                          : "—"}
                      </td>

                      <td>
                        {project.end_date
                          ? String(project.end_date).split("T")[0]
                          : "—"}
                      </td>

                      <td>
                        <span
                          className={`admin-status-badge admin-status-${String(
                            project.status || ""
                          ).replace(/\s+/g, "-")}`}
                        >
                          {project.status}
                        </span>
                      </td>

                      <td>
                        <div className="admin-actions">
                          <button
                            type="button"
                            className="admin-view-btn"
                            onClick={() => openViewModal(project)}
                          >
                            <Eye size={16} />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            className="admin-edit-btn"
                            onClick={() => openEditModal(project)}
                            disabled={loading || deletingId !== null}
                          >
                            <Pencil size={16} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            className="admin-delete-btn"
                            onClick={() => handleDelete(project)}
                            disabled={deletingId !== null}
                          >
                            {deletingId === project.project_id ? (
                              <RefreshCw
                                size={16}
                                className="admin-spinning"
                              />
                            ) : (
                              <Trash2 size={16} />
                            )}

                            <span>
                              {deletingId === project.project_id
                                ? "Deleting..."
                                : "Delete"}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
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
                  aria-label="Previous page"
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
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1)
                    )
                  }
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          <div className="admin-table-footer">
            Showing {paginated.length} of {filtered.length} projects
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
            <div
              className="admin-modal"
              role="dialog"
              aria-modal="true"
            >
              {/* MODAL HEADER */}
              <div className="admin-modal-header">
                <div className="admin-modal-title">
                  <div className="admin-modal-icon">
                    <FolderKanban size={23} />
                  </div>

                  <div>
                    <h2>
                      {editId !== null ? "Edit Project" : "Add Project"}
                    </h2>

                    <p>
                      {editId !== null
                        ? "Update project information."
                        : "Enter project details."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={closeModal}
                  disabled={saving}
                  aria-label="Close modal"
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
                    {/* PROJECT ID */}
                    {editId !== null && (
                      <div className="admin-field admin-field-full">
                        <label>Project ID</label>

                        <input
                          type="text"
                          value={editId}
                          readOnly
                          className="admin-readonly"
                        />
                      </div>
                    )}

                    {/* PROJECT NAME */}
                    <div className="admin-field">
                      <label>
                        Project Name <span>*</span>
                      </label>

                      <input
                        type="text"
                        name="proj_name"
                        placeholder="e.g. Website Redesign"
                        value={form.proj_name}
                        onChange={handleChange}
                        maxLength={150}
                        required
                      />
                    </div>

                    {/* CLIENT DROPDOWN */}
                    <div className="admin-field">
                      <label>
                        Client Name <span>*</span>
                      </label>

                      <div
                        className="proj-emp-drop"
                        ref={clientDropRef}
                      >
                        <button
                          type="button"
                          className="proj-emp-trigger"
                          onClick={() =>
                            setClientDropOpen((open) => !open)
                          }
                        >
                          <span
                            style={{
                              color: form.client_name
                                ? "#1e293b"
                                : "#94a3b8",
                            }}
                          >
                            {form.client_name || "-- Select Client --"}
                          </span>

                          <ChevronDown
                            size={16}
                            className={`proj-emp-chevron${
                              clientDropOpen
                                ? " proj-emp-chevron-open"
                                : ""
                            }`}
                          />
                        </button>

                        {clientDropOpen && (
                          <div className="proj-emp-panel">
                            <div className="proj-emp-search">
                              <Search size={14} />

                              <input
                                type="text"
                                placeholder="Search client..."
                                value={clientSearch}
                                onChange={(event) =>
                                  setClientSearch(event.target.value)
                                }
                                autoFocus
                              />

                              {clientSearch && (
                                <button
                                  type="button"
                                  onClick={() => setClientSearch("")}
                                  aria-label="Clear client search"
                                >
                                  <X size={13} />
                                </button>
                              )}
                            </div>

                            <div className="proj-emp-list">
                              <button
                                type="button"
                                className="proj-emp-option"
                                onClick={() => {
                                  setForm((previous) => ({
                                    ...previous,
                                    client_name: "",
                                  }));

                                  setClientDropOpen(false);
                                  setClientSearch("");
                                }}
                              >
                                <span>-- None --</span>
                              </button>

                              {filteredClients.map((client) => (
                                <button
                                  type="button"
                                  key={client.Client_ID}
                                  className="proj-emp-option"
                                  onClick={() => {
                                    setForm((previous) => ({
                                      ...previous,
                                      client_name: client.Client_Name,
                                    }));

                                    setClientDropOpen(false);
                                    setClientSearch("");
                                  }}
                                >
                                  <span>{client.Client_Name}</span>
                                  <small>{client.Company_Name}</small>
                                </button>
                              ))}

                              {filteredClients.length === 0 && (
                                <p className="proj-emp-empty">
                                  No clients found
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DESCRIPTION */}
                    <div className="admin-field">
                      <label>Description</label>

                      <textarea
                        name="description"
                        placeholder="Brief project description..."
                        value={form.description}
                        onChange={handleChange}
                        maxLength={1000}
                        rows={3}
                      />
                    </div>

                    {/* START DATE */}
                    <div className="admin-field">
                      <label>
                        Start Date <span>*</span>
                      </label>

                      <input
                        type="date"
                        name="start_date"
                        value={form.start_date}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* END DATE */}
                    <div className="admin-field">
                      <label>End Date</label>

                      <input
                        type="date"
                        name="end_date"
                        min={form.start_date || undefined}
                        value={form.end_date}
                        onChange={handleChange}
                      />
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
                            {priority.charAt(0).toUpperCase() +
                              priority.slice(1)}
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
                            {status.charAt(0).toUpperCase() +
                              status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* EMPLOYEE MULTI-SELECT */}
                    <div className="admin-field">
                      <label>
                        Assigned Employees <span>*</span>

                        {form.created_by.length > 0 && (
                          <em className="proj-emp-count">
                            {form.created_by.length} selected
                          </em>
                        )}
                      </label>

                      <div
                        className="proj-emp-drop"
                        ref={empDropRef}
                      >
                        <button
                          type="button"
                          className="proj-emp-trigger"
                          onClick={() =>
                            setEmpDropOpen((open) => !open)
                          }
                        >
                          <span>
                            {form.created_by.length === 0
                              ? "-- Select Employees --"
                              : employees.length > 0 &&
                                  form.created_by.length ===
                                    employees.filter(
                                      (employee) => employee.employee_code
                                    ).length
                                ? "All Employees Selected"
                                : form.created_by.length === 1
                                  ? (() => {
                                      const employee = employees.find(
                                        (item) =>
                                          item.employee_code ===
                                          form.created_by[0]
                                      );

                                      return employee
                                        ? `${employee.emp_name} (${employee.employee_code})`
                                        : "1 selected";
                                    })()
                                  : `${form.created_by.length} employees selected`}
                          </span>

                          <ChevronDown
                            size={16}
                            className={`proj-emp-chevron${
                              empDropOpen
                                ? " proj-emp-chevron-open"
                                : ""
                            }`}
                          />
                        </button>

                        {empDropOpen && (
                          <div className="proj-emp-panel">
                            <div className="proj-emp-search">
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
                                  aria-label="Clear employee search"
                                >
                                  <X size={13} />
                                </button>
                              )}
                            </div>

                            {/* SELECT ALL */}
                            <label className="proj-emp-option proj-emp-select-all">
                              <input
                                type="checkbox"
                                checked={
                                  employees.filter(
                                    (employee) => employee.employee_code
                                  ).length > 0 &&
                                  employees
                                    .filter(
                                      (employee) => employee.employee_code
                                    )
                                    .every((employee) =>
                                      form.created_by.includes(
                                        employee.employee_code
                                      )
                                    )
                                }
                                onChange={() => {
                                  const validEmployees = employees.filter(
                                    (employee) => employee.employee_code
                                  );

                                  const allSelected =
                                    validEmployees.length > 0 &&
                                    validEmployees.every((employee) =>
                                      form.created_by.includes(
                                        employee.employee_code
                                      )
                                    );

                                  setForm((previous) => ({
                                    ...previous,
                                    created_by: allSelected
                                      ? []
                                      : validEmployees.map(
                                          (employee) =>
                                            employee.employee_code
                                        ),
                                  }));
                                }}
                              />

                              <span>Select All</span>
                            </label>

                            <div className="proj-emp-list">
                              {filteredEmployees.map((employee) => (
                                <label
                                  key={employee.emp_id}
                                  className="proj-emp-option"
                                >
                                  <input
                                    type="checkbox"
                                    checked={form.created_by.includes(
                                      employee.employee_code
                                    )}
                                    onChange={() => {
                                      const code =
                                        employee.employee_code;

                                      if (!code) return;

                                      setForm((previous) => ({
                                        ...previous,
                                        created_by:
                                          previous.created_by.includes(code)
                                            ? previous.created_by.filter(
                                                (item) => item !== code
                                              )
                                            : [
                                                ...previous.created_by,
                                                code,
                                              ],
                                      }));
                                    }}
                                  />

                                  <span>{employee.emp_name}</span>
                                  <small>{employee.employee_code}</small>
                                </label>
                              ))}

                              {filteredEmployees.length === 0 && (
                                <p className="proj-emp-empty">
                                  No employees found
                                </p>
                              )}
                            </div>

                            <div className="proj-emp-done">
                              <span>
                                {form.created_by.length} selected
                              </span>

                              <button
                                type="button"
                                onClick={() => setEmpDropOpen(false)}
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* SELECTED EMPLOYEE CHIPS */}
                      {form.created_by.length > 0 && (
                        <div className="proj-emp-chips">
                          {form.created_by.map((code) => {
                            const employee = employees.find(
                              (item) => item.employee_code === code
                            );

                            return (
                              <span
                                key={code}
                                className="proj-emp-chip"
                              >
                                {employee?.emp_name || code}

                                <button
                                  type="button"
                                  aria-label={`Remove ${
                                    employee?.emp_name || code
                                  }`}
                                  onClick={() =>
                                    setForm((previous) => ({
                                      ...previous,
                                      created_by:
                                        previous.created_by.filter(
                                          (item) => item !== code
                                        ),
                                    }))
                                  }
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
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
                        <RefreshCw
                          size={17}
                          className="admin-spinning"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={17} />
                        {editId !== null
                          ? "Update Project"
                          : "Save Project"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW PROJECT MODAL */}
        {viewProject && (
          <div
            className="admin-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setViewProject(null);
              }
            }}
          >
            <div
              className="admin-modal"
              role="dialog"
              aria-modal="true"
            >
              <div className="admin-modal-header">
                <div className="admin-modal-title">
                  <div className="admin-modal-icon">
                    <FolderKanban size={23} />
                  </div>

                  <div>
                    <h2>View Project</h2>
                    <p>Project details (read-only)</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => setViewProject(null)}
                  aria-label="Close project details"
                >
                  <X size={21} />
                </button>
              </div>

              <div className="admin-modal-body admin-form-grid">
                {[
                  {
                    label: "Project ID",
                    value: viewProject.project_id,
                  },
                  {
                    label: "Project Name",
                    value: viewProject.proj_name,
                  },
                  {
                    label: "Client Name",
                    value: viewProject.client_name,
                  },
                  {
                    label: "Description",
                    value: viewProject.description || "—",
                  },
                  {
                    label: "Start Date",
                    value: viewProject.start_date
                      ? String(viewProject.start_date).split("T")[0]
                      : "—",
                  },
                  {
                    label: "End Date",
                    value: viewProject.end_date
                      ? String(viewProject.end_date).split("T")[0]
                      : "—",
                  },
                  {
                    label: "Priority",
                    value: viewProject.priority,
                  },
                  {
                    label: "Status",
                    value: viewProject.status,
                  },
                  {
                    label: "Created By",
                    value:
                      viewProject.created_by_name ||
                      viewProject.created_by ||
                      "—",
                  },
                  {
                    label: "Created At",
                    value: viewProject.created_at
                      ? new Date(
                          viewProject.created_at
                        ).toLocaleString()
                      : "—",
                  },
                  {
                    label: "Updated At",
                    value: viewProject.updated_at
                      ? new Date(
                          viewProject.updated_at
                        ).toLocaleString()
                      : "—",
                  },
                ].map(({ label, value }) => (
                  <div className="admin-field" key={label}>
                    <label>{label}</label>

                    <input
                      type="text"
                      value={value ?? "—"}
                      readOnly
                      className="admin-readonly"
                    />
                  </div>
                ))}
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-cancel-btn"
                  onClick={() => setViewProject(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Project;
