import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Plus, Search, Pencil, Trash2, X, FolderKanban,
  RefreshCw, AlertCircle, CheckCircle, Eye,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import "./Project.css";

const API_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/projects`;
const EMP_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/employees`;
const PAGE_SIZE = 5;

const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"];
const STATUS_OPTIONS = ["not started", "in progress", "on hold", "completed", "cancelled"];

const EMPTY_FORM = {
  proj_name: "",
  description: "",
  client_name: "",
  start_date: "",
  end_date: "",
  priority: "medium",
  status: "not started",
  created_by: "",
};

const Project = () => {
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewProject, setViewProject] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // FETCH
  // ==========================================
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(API_URL);
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Unable to fetch projects");
      setProjects(result.data || []);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(EMP_URL);
      const result = await res.json();
      if (res.ok && result.success) setEmployees(result.data || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [search]);

  // ==========================================
  // FORM CHANGE
  // ==========================================
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  // ==========================================
  // OPEN VIEW
  // ==========================================
  const openViewModal = (proj) => setViewProject(proj);

  // ==========================================
  // OPEN ADD
  // ==========================================
  const openAddModal = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  // ==========================================
  // OPEN EDIT
  // ==========================================
  const openEditModal = async (proj) => {
    setError("");
    setSuccess("");
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/${proj.project_id}`);
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Unable to fetch project");
      const d = result.data;
      setEditId(d.project_id);
      setForm({
        proj_name: d.proj_name || "",
        description: d.description || "",
        client_name: d.client_name || "",
        start_date: d.start_date ? d.start_date.split("T")[0] : "",
        end_date: d.end_date ? d.end_date.split("T")[0] : "",
        priority: d.priority || "medium",
        status: d.status || "not started",
        created_by: d.created_by || "",
      });
      setIsModalOpen(true);
    } catch (err) {
      setError(err.message || "Unable to open project");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CLOSE MODAL
  // ==========================================
  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  // ==========================================
  // SUBMIT
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { proj_name, client_name, start_date, created_by } = form;

    if (!proj_name.trim()) { setError("Project name is required."); return; }
    if (!client_name.trim()) { setError("Client name is required."); return; }
    if (!start_date) { setError("Start date is required."); return; }
    if (!created_by) { setError("Created by (employee) is required."); return; }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const isEditing = editId !== null;
      const body = { ...form };
      if (!isEditing) body.created_by = form.created_by;

      const res = await fetch(isEditing ? `${API_URL}/${editId}` : API_URL, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Unable to save project");

      setSuccess(result.message || (isEditing ? "Project updated successfully" : "Project created successfully"));
      setIsModalOpen(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      await fetchProjects();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DELETE
  // ==========================================
  const handleDelete = async (proj) => {
    if (!window.confirm(`Delete "${proj.proj_name}"?`)) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/${proj.project_id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Unable to delete");
      setSuccess(result.message || "Project deleted successfully");
      await fetchProjects();
    } catch (err) {
      setError(err.message || "Unable to delete.");
    }
  };

  // ==========================================
  // FILTER + PAGINATION
  // ==========================================
  const filtered = projects.filter((p) => {
    const q = search.toLowerCase().trim();
    return (
      p.proj_name?.toLowerCase().includes(q) ||
      p.client_name?.toLowerCase().includes(q) ||
      p.status?.toLowerCase().includes(q) ||
      String(p.project_id).includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    const lastPage = Math.max(1, totalPages);
    if (currentPage > lastPage) setCurrentPage(lastPage);
  }, [totalPages, currentPage]);

  return (
    <AdminLayout>
      <div className="admin-page">

        {/* HEADER */}
        <div className="admin-page-header">
          <div className="admin-page-heading">
            <div className="admin-page-heading-icon"><FolderKanban size={25} /></div>
            <div>
              <h1>Projects</h1>
              <p>Manage your organization's projects</p>
            </div>
          </div>
          <button type="button" className="admin-add-btn" onClick={openAddModal}>
            <Plus size={19} /> Add Project
          </button>
        </div>

        {/* ALERTS */}
        {success && (
          <div className="admin-alert admin-alert-success">
            <CheckCircle size={18} />
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess("")}><X size={17} /></button>
          </div>
        )}
        {error && !isModalOpen && (
          <div className="admin-alert admin-alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}><X size={17} /></button>
          </div>
        )}

        {/* TABLE CARD */}
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
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} aria-label="Clear">
                  <X size={16} />
                </button>
              )}
            </div>
            <span className="admin-result-count">
              {filtered.length} project{filtered.length !== 1 ? "s" : ""}
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
                      <RefreshCw size={22} className="admin-spinning" />
                      <p>Loading projects...</p>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="admin-table-empty">
                      <FolderKanban size={32} />
                      <h3>{search ? "No projects found" : "No projects added yet"}</h3>
                      <p>{search ? "Try a different search." : "Click Add Project to get started."}</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((proj) => (
                    <tr key={proj.project_id}>
                      <td><span className="admin-table-id">{proj.project_id}</span></td>
                      <td>{proj.proj_name}</td>
                      <td>{proj.client_name}</td>
                      <td>
                        <span className={`admin-status-badge admin-priority-${proj.priority}`}>
                          {proj.priority}
                        </span>
                      </td>
                      <td>{proj.start_date ? proj.start_date.split("T")[0] : "—"}</td>
                      <td>{proj.end_date ? proj.end_date.split("T")[0] : "—"}</td>
                      <td>
                        <span className={`admin-status-badge admin-status-${proj.status?.replace(/\s+/g, "-")}`}>
                          {proj.status}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button type="button" className="admin-view-btn" onClick={() => openViewModal(proj)}>
                            <Eye size={16} /><span>View</span>
                          </button>
                          <button type="button" className="admin-edit-btn" onClick={() => openEditModal(proj)}>
                            <Pencil size={16} /><span>Edit</span>
                          </button>
                          <button type="button" className="admin-delete-btn" onClick={() => handleDelete(proj)}>
                            <Trash2 size={16} /><span>Delete</span>
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
              <span className="admin-pagination-info">Page {currentPage} of {totalPages}</span>
              <div className="admin-pagination-btns">
                <button className="admin-page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`admin-page-btn ${currentPage === page ? "admin-page-active" : ""}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button className="admin-page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
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
          <div className="admin-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
            <div className="admin-modal" role="dialog" aria-modal="true">
              <div className="admin-modal-header">
                <div className="admin-modal-title">
                  <div className="admin-modal-icon"><FolderKanban size={23} /></div>
                  <div>
                    <h2>{editId !== null ? "Edit Project" : "Add Project"}</h2>
                    <p>{editId !== null ? "Update project information." : "Enter project details."}</p>
                  </div>
                </div>
                <button type="button" className="admin-modal-close" onClick={closeModal} disabled={saving}>
                  <X size={21} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="admin-modal-body">
                  {error && (
                    <div className="admin-alert admin-alert-error">
                      <AlertCircle size={18} /><span>{error}</span>
                    </div>
                  )}

                  {editId !== null && (
                    <div className="admin-field">
                      <label>Project ID</label>
                      <input type="text" value={editId} readOnly className="admin-readonly" />
                    </div>
                  )}

                  <div className="admin-field">
                    <label>Project Name <span>*</span></label>
                    <input
                      type="text"
                      name="proj_name"
                      placeholder="e.g. Website Redesign"
                      value={form.proj_name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="admin-field">
                    <label>Client Name <span>*</span></label>
                    <input
                      type="text"
                      name="client_name"
                      placeholder="e.g. Acme Corp"
                      value={form.client_name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="admin-field">
                    <label>Description</label>
                    <textarea
                      name="description"
                      placeholder="Brief project description..."
                      value={form.description}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>

                  <div className="admin-field-row">
                    <div className="admin-field">
                      <label>Start Date <span>*</span></label>
                      <input
                        type="date"
                        name="start_date"
                        value={form.start_date}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="admin-field">
                      <label>End Date</label>
                      <input
                        type="date"
                        name="end_date"
                        value={form.end_date}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="admin-field-row">
                    <div className="admin-field">
                      <label>Priority <span>*</span></label>
                      <select name="priority" value={form.priority} onChange={handleChange}>
                        {PRIORITY_OPTIONS.map(p => (
                          <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-field">
                      <label>Status <span>*</span></label>
                      <select name="status" value={form.status} onChange={handleChange}>
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="admin-field">
                    <label>Created By <span>*</span></label>
                    <select name="created_by" value={form.created_by} onChange={handleChange} required>
                      <option value="">-- Select Employee --</option>
                      {employees.map((emp) => (
                        <option key={emp.emp_id} value={emp.emp_id}>
                          {emp.emp_name} ({emp.employee_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-modal-footer">
                  <button type="button" className="admin-cancel-btn" onClick={closeModal} disabled={saving}>Cancel</button>
                  <button type="submit" className="admin-save-btn" disabled={saving}>
                    {saving
                      ? <><RefreshCw size={17} className="admin-spinning" /> Saving...</>
                      : <><CheckCircle size={17} /> {editId !== null ? "Update Project" : "Save Project"}</>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW MODAL */}
        {viewProject && (
          <div className="admin-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setViewProject(null); }}>
            <div className="admin-modal" role="dialog" aria-modal="true">
              <div className="admin-modal-header">
                <div className="admin-modal-title">
                  <div className="admin-modal-icon"><FolderKanban size={23} /></div>
                  <div>
                    <h2>View Project</h2>
                    <p>Project details (read-only)</p>
                  </div>
                </div>
                <button type="button" className="admin-modal-close" onClick={() => setViewProject(null)}>
                  <X size={21} />
                </button>
              </div>
              <div className="admin-modal-body">
                {[
                  { label: "Project ID",    value: viewProject.project_id },
                  { label: "Project Name",  value: viewProject.proj_name },
                  { label: "Client Name",   value: viewProject.client_name },
                  { label: "Description",   value: viewProject.description || "—" },
                  { label: "Start Date",    value: viewProject.start_date ? viewProject.start_date.split("T")[0] : "—" },
                  { label: "End Date",      value: viewProject.end_date ? viewProject.end_date.split("T")[0] : "—" },
                  { label: "Priority",      value: viewProject.priority },
                  { label: "Status",        value: viewProject.status },
                  { label: "Created By",    value: viewProject.created_by_name || viewProject.created_by || "—" },
                  { label: "Created At",    value: viewProject.created_at ? new Date(viewProject.created_at).toLocaleString() : "—" },
                  { label: "Updated At",    value: viewProject.updated_at ? new Date(viewProject.updated_at).toLocaleString() : "—" },
                ].map(({ label, value }) => (
                  <div className="admin-field" key={label}>
                    <label>{label}</label>
                    <input type="text" value={value} readOnly className="admin-readonly" />
                  </div>
                ))}
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-cancel-btn" onClick={() => setViewProject(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default Project;
