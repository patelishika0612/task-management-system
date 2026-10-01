import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Plus, Search, Pencil, Trash2, X, Building2,
  RefreshCw, AlertCircle, CheckCircle, Eye,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import "./Department.css";

const API_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/departments`;
const PAGE_SIZE = 5;

const Department = () => {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewDepartment, setViewDepartment] = useState(null);
  const [departmentName, setDepartmentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(API_URL);
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Unable to fetch departments");
      setDepartments(result.data || []);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search]);

  const openViewModal = (dept) => setViewDepartment(dept);

  const openAddModal = () => {
    setEditId(null); setDepartmentName(""); setError(""); setSuccess(""); setIsModalOpen(true);
  };

  const openEditModal = async (dept) => {
    setError(""); setSuccess("");
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/${dept.department_id}`);
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Unable to fetch department");
      setEditId(result.data.department_id);
      setDepartmentName(result.data.department_name);
      setIsModalOpen(true);
    } catch (err) {
      setError(err.message || "Unable to open department");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false); setEditId(null); setDepartmentName(""); setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = departmentName.trim();
    if (!trimmedName) { setError("Department name is required."); return; }
    if (trimmedName.length < 2 || trimmedName.length > 100) { setError("Name must be 2–100 characters."); return; }
    if (!/^[a-zA-Z0-9 &()._-]+$/.test(trimmedName)) { setError("Name contains invalid characters."); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      const isEditing = editId !== null;
      const res = await fetch(isEditing ? `${API_URL}/${editId}` : API_URL, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department_name: trimmedName }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.errors?.map(e => e.message).join(", ") || result.message || "Unable to save");
      }
      setSuccess(result.message || (isEditing ? "Updated successfully" : "Created successfully"));
      setIsModalOpen(false); setEditId(null); setDepartmentName("");
      await fetchDepartments();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dept) => {
    if (!window.confirm(`Delete "${dept.department_name}"?`)) return;
    setError(""); setSuccess("");
    try {
      const res = await fetch(`${API_URL}/${dept.department_id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Unable to delete");
      setSuccess(result.message || "Deleted successfully");
      await fetchDepartments();
    } catch (err) {
      setError(err.message || "Unable to delete.");
    }
  };

  const filtered = departments.filter((d) => {
    const q = search.toLowerCase().trim();
    return d.department_name?.toLowerCase().includes(q) || String(d.department_id).includes(q);
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <AdminLayout>
      <div className="admin-page">

        {/* HEADER */}
        <div className="admin-page-header">
          <div className="admin-page-heading">
            <div className="admin-page-heading-icon"><Building2 size={25} /></div>
            <div>
              <h1>Departments</h1>
              <p>Manage your organization's departments</p>
            </div>
          </div>
          <button type="button" className="admin-add-btn" onClick={openAddModal}>
            <Plus size={19} /> Add Department
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

        {/* SUMMARY */}
          {/* <div className="admin-summary-card">
            <div className="admin-summary-icon"><Building2 size={24} /></div>
            <div>
              <p>Total Departments</p>
              <h2>{departments.length}</h2>
            </div>
          </div> */}

        {/* TABLE CARD */}
        <div className="admin-table-card">
          <div className="admin-table-card-header">
            <div>
              <h2>Department List</h2>
              <p>View, edit, and manage departments</p>
            </div>
          </div>

          {/* SEARCH */}
          <div className="admin-toolbar">
            <div className="admin-search">
              <Search size={19} />
              <input
                type="search"
                placeholder="Search by ID or name..."
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
              {filtered.length} department{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* TABLE */}
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Department ID</th>
                  <th>Department Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && departments.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="admin-table-empty">
                      <RefreshCw size={22} className="admin-spinning" />
                      <p>Loading departments...</p>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="admin-table-empty">
                      <Building2 size={32} />
                      <h3>{search ? "No departments found" : "No departments added yet"}</h3>
                      <p>{search ? "Try a different ID or name." : "Click Add Department to get started."}</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((dept) => (
                    <tr key={dept.department_id}>
                      <td><span className="admin-table-id">{dept.department_id}</span></td>
                      <td>
                        <div className="admin-table-name-cell">
                          <div className="admin-table-row-icon"><Building2 size={18} /></div>
                          <span>{dept.department_name}</span>
                        </div>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button type="button" className="admin-view-btn" onClick={() => openViewModal(dept)}>
                            <Eye size={16} /><span>View</span>
                          </button>
                          <button type="button" className="admin-edit-btn" onClick={() => openEditModal(dept)}>
                            <Pencil size={16} /><span>Edit</span>
                          </button>
                          <button type="button" className="admin-delete-btn" onClick={() => handleDelete(dept)}>
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
            Showing {paginated.length} of {filtered.length} departments
          </div>
        </div>

        {/* ADD / EDIT MODAL */}
        {isModalOpen && (
          <div className="admin-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
            <div className="admin-modal" role="dialog" aria-modal="true">
              <div className="admin-modal-header">
                <div className="admin-modal-title">
                  <div className="admin-modal-icon"><Building2 size={23} /></div>
                  <div>
                    <h2>{editId !== null ? "Edit Department" : "Add Department"}</h2>
                    <p>{editId !== null ? "Update the department information." : "Enter the department details."}</p>
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
                      <label>Department ID</label>
                      <input type="text" value={editId} readOnly className="admin-readonly" />
                    </div>
                  )}
                  <div className="admin-field">
                    <label htmlFor="dept-name">Department Name <span>*</span></label>
                    <input
                      id="dept-name"
                      type="text"
                      placeholder="e.g. Human Resources"
                      value={departmentName}
                      onChange={(e) => { setDepartmentName(e.target.value); setError(""); }}
                      maxLength={100}
                      autoFocus
                      required
                    />
                    <small>Enter a unique department name (2–100 characters).</small>
                  </div>
                </div>
                <div className="admin-modal-footer">
                  <button type="button" className="admin-cancel-btn" onClick={closeModal} disabled={saving}>Cancel</button>
                  <button type="submit" className="admin-save-btn" disabled={saving}>
                    {saving
                      ? <><RefreshCw size={17} className="admin-spinning" /> Saving...</>
                      : <><CheckCircle size={17} /> {editId !== null ? "Update Department" : "Save Department"}</>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW MODAL */}
        {viewDepartment && (
          <div className="admin-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setViewDepartment(null); }}>
            <div className="admin-modal" role="dialog" aria-modal="true">
              <div className="admin-modal-header">
                <div className="admin-modal-title">
                  <div className="admin-modal-icon"><Building2 size={23} /></div>
                  <div>
                    <h2>View Department</h2>
                    <p>Department details (read-only)</p>
                  </div>
                </div>
                <button type="button" className="admin-modal-close" onClick={() => setViewDepartment(null)}>
                  <X size={21} />
                </button>
              </div>
              <div className="admin-modal-body">
                <div className="admin-field">
                  <label>Department ID</label>
                  <input type="text" value={viewDepartment.department_id} readOnly className="admin-readonly" />
                </div>
                <div className="admin-field">
                  <label>Department Name</label>
                  <input type="text" value={viewDepartment.department_name} readOnly className="admin-readonly" />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-cancel-btn" onClick={() => setViewDepartment(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default Department;
