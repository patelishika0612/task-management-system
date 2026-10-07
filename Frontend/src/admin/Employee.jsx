import React, { useEffect, useState, useRef } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Plus, Search, Pencil, Trash2, X, Users,
  RefreshCw, AlertCircle, CheckCircle, Eye,
  ChevronLeft, ChevronRight, Upload,
} from "lucide-react";
import "./Employee.css";
import { onlyDigits, onlyLetters, isValidEmail, isValidPhone, isValidName, phoneInputProps } from "../validation";

const API_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/employees`;
const DEPT_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/departments`;
const PAGE_SIZE = 5;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

// DB stores the full image URL; older rows may only have the filename
const getImageUrl = (image) =>
  !image ? "" : /^https?:\/\//.test(image) ? image : `${BASE_URL}/uploads/${image}`;

const EMPTY_FORM = {
  emp_name: "",
  email: "",
  phone: "",
  department_id: "",
  Date_of_join: "",
  employee_code: "",
  image: "",
  status: "active",
};

const Employee = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewEmployee, setViewEmployee] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // FETCH
  // ==========================================
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(API_URL);
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Unable to fetch employees");
      setEmployees(result.data || []);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(DEPT_URL);
      const result = await res.json();
      if (res.ok && result.success) setDepartments(result.data || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [search]);

  // ==========================================
  // IMAGE UPLOAD
  // ==========================================
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image must be 2MB or smaller.");
      e.target.value = "";
      return;
    }
    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, image: "" }));
    setImagePreview("");
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ==========================================
  // FORM CHANGE
  // ==========================================
  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;
    if (name === "phone") value = onlyDigits(value, 10);
    else if (name === "emp_name") value = onlyLetters(value);
    else if (name === "employee_code") value = value.replace(/[^A-Za-z0-9_-]/g, "").toUpperCase();
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  // ==========================================
  // OPEN VIEW
  // ==========================================
  const openViewModal = (emp) => setViewEmployee(emp);

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
  const openEditModal = async (emp) => {
    setError("");
    setSuccess("");
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/${emp.emp_id}`);
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Unable to fetch employee");
      const d = result.data;
      setEditId(d.emp_id);
      setForm({
        emp_name: d.emp_name || "",
        email: d.email || "",
        phone: d.phone || "",
        department_id: d.department_id || "",
        Date_of_join: d.Date_of_join ? d.Date_of_join.split("T")[0] : "",
        employee_code: d.employee_code || "",
        image: d.image || "",
        status: d.status || "active",
      });
      setImageFile(null);
      setImagePreview(getImageUrl(d.image));
      setIsModalOpen(true);
    } catch (err) {
      setError(err.message || "Unable to open employee");
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
    setImagePreview("");
    setImageFile(null);
    setError("");
  };

  // ==========================================
  // SUBMIT
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { emp_name, email, phone, department_id, Date_of_join, employee_code, status } = form;

    if (!emp_name.trim()) { setError("Employee name is required."); return; }
    if (emp_name.trim().length < 2 || !isValidName(emp_name)) { setError("Enter a valid employee name (letters only, min 2 characters)."); return; }
    if (!employee_code.trim()) { setError("Employee code is required."); return; }
    if (!email.trim()) { setError("Email is required."); return; }
    if (!isValidEmail(email)) { setError("Enter a valid email address."); return; }
    if (!phone.trim()) { setError("Phone is required."); return; }
    if (!isValidPhone(phone)) { setError("Phone must be a valid 10-digit mobile number."); return; }
    if (!Date_of_join) { setError("Date of joining is required."); return; }
    if (Date_of_join > new Date().toISOString().split("T")[0]) { setError("Date of joining cannot be in the future."); return; }
    if (!department_id) { setError("Department is required."); return; }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const isEditing = editId !== null;
      const formData = new FormData();
      formData.append("emp_name", emp_name);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("department_id", department_id);
      formData.append("Date_of_join", Date_of_join);
      formData.append("employee_code", employee_code);
      formData.append("status", status);
      if (imageFile) formData.append("image", imageFile);
      else if (isEditing) formData.append("existing_image", form.image || "");

      const res = await fetch(isEditing ? `${API_URL}/${editId}` : API_URL, {
        method: isEditing ? "PUT" : "POST",
        body: formData,
      });
      if (res.status === 413) throw new Error("Image is too large to upload.");
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Unable to save employee");

      setSuccess(result.message || (isEditing ? "Employee updated successfully" : "Employee created successfully"));
      setIsModalOpen(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      setImagePreview("");
      setImageFile(null);
      await fetchEmployees();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DELETE
  // ==========================================
  const handleDelete = async (emp) => {
    if (!window.confirm(`Delete "${emp.emp_name}"?`)) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/${emp.emp_id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Unable to delete");
      setSuccess(result.message || "Employee deleted successfully");
      await fetchEmployees();
    } catch (err) {
      setError(err.message || "Unable to delete.");
    }
  };

  // ==========================================
  // FILTER + PAGINATION
  // ==========================================
  const filtered = employees.filter((e) => {
    const q = search.toLowerCase().trim();
    return (
      e.emp_name?.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.employee_code?.toLowerCase().includes(q) ||
      String(e.emp_id).includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // keep the page in range when rows are deleted
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
            <div className="admin-page-heading-icon"><Users size={25} /></div>
            <div>
              <h1>Employees</h1>
              <p>Manage your organization's employees</p>
            </div>
          </div>
          <button type="button" className="admin-add-btn" onClick={openAddModal}>
            <Plus size={19} /> Add Employee
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
          <div className="admin-summary-icon"><Users size={24} /></div>
          <div>
            <p>Total Employees</p>
            <h2>{employees.length}</h2>
          </div>
        </div> */}

        {/* TABLE CARD */}
        <div className="admin-table-card">
          <div className="admin-table-card-header">
            <div>
              <h2>Employee List</h2>
              <p>View, edit, and manage employees</p>
            </div>
          </div>

          {/* SEARCH */}
          <div className="admin-toolbar">
            <div className="admin-search">
              <Search size={19} />
              <input
                type="search"
                placeholder="Search by ID, name, email or code..."
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
              {filtered.length} employee{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* TABLE */}
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Emp Code</th>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && employees.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="admin-table-empty">
                      <RefreshCw size={22} className="admin-spinning" />
                      <p>Loading employees...</p>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="admin-table-empty">
                      <Users size={32} />
                      <h3>{search ? "No employees found" : "No employees added yet"}</h3>
                      <p>{search ? "Try a different search." : "Click Add Employee to get started."}</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((emp) => (
                    <tr key={emp.emp_id}>
                      <td><span className="admin-table-id">{emp.employee_code}</span></td>
                      <td>
                        <div className="admin-table-name-cell">
                          {emp.image
                            ? <img src={getImageUrl(emp.image)} alt={emp.emp_name} className="emp-avatar" />
                            : <div className="admin-table-row-icon emp-avatar-fallback"><Users size={16} /></div>
                          }
                          <div>
                            <div>{emp.emp_name}</div>
                            <small style={{ color: "#94a3b8", fontSize: "11px" }}>{emp.employee_code}</small>
                          </div>
                        </div>
                      </td>
                      <td>{emp.email}</td>
                      <td>{emp.phone}</td>
                      <td>{emp.department_name || "—"}</td>
                      <td>
                        <span className={`admin-status-badge admin-status-${emp.status}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button type="button" className="admin-view-btn" onClick={() => openViewModal(emp)}>
                            <Eye size={16} /><span>View</span>
                          </button>
                          <button type="button" className="admin-edit-btn" onClick={() => openEditModal(emp)}>
                            <Pencil size={16} /><span>Edit</span>
                          </button>
                          <button type="button" className="admin-delete-btn" onClick={() => handleDelete(emp)}>
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
            Showing {paginated.length} of {filtered.length} employees
          </div>
        </div>

        {/* ADD / EDIT MODAL */}
        {isModalOpen && (
          <div className="admin-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
            <div className="admin-modal" role="dialog" aria-modal="true">
              <div className="admin-modal-header">
                <div className="admin-modal-title">
                  <div className="admin-modal-icon"><Users size={23} /></div>
                  <div>
                    <h2>{editId !== null ? "Edit Employee" : "Add Employee"}</h2>
                    <p>{editId !== null ? "Update employee information." : "Enter employee details."}</p>
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

                  <div className="admin-form-grid">
                  <div className="admin-field">
                    <label>Employee Name <span>*</span></label>
                    <input
                      type="text"
                      name="emp_name"
                      placeholder="e.g. John Doe"
                      value={form.emp_name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="admin-field">
                    <label>Employee Code <span>*</span></label>
                    <input
                      type="text"
                      name="employee_code"
                      placeholder="e.g. EMP001"
                      value={form.employee_code}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="admin-field">
                    <label>Email <span>*</span></label>
                    <input
                      type="email"
                      name="email"
                      placeholder="e.g. john@example.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="admin-field">
                    <label>Phone <span>*</span></label>
                    <input
                      {...phoneInputProps}
                      name="phone"
                      placeholder="e.g. 9876543210"
                      value={form.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="admin-field">
                    <label>Date of Joining <span>*</span></label>
                    <input
                      type="date"
                      name="Date_of_join"
                      max={new Date().toISOString().split("T")[0]}
                      value={form.Date_of_join}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="admin-field">
                    <label>Department <span>*</span></label>
                    <select name="department_id" value={form.department_id} onChange={handleChange} required>
                      <option value="">-- Select Department --</option>
                      {departments.map((d) => (
                        <option key={d.department_id} value={d.department_id}>
                          {d.department_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-field">
                    <label>Status <span>*</span></label>
                    <select name="status" value={form.status} onChange={handleChange}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="admin-field admin-field-full">
                    <label>Profile Image</label>
                    <div className="emp-upload-box">
                      {imagePreview
                        ? (
                          <div className="emp-upload-preview">
                            <img src={imagePreview} alt="Preview" className="emp-preview-img" />
                            <button type="button" className="emp-remove-img" onClick={removeImage}>
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <label className="emp-upload-label" htmlFor="emp-image-input">
                            <Upload size={22} />
                            <span>Click to upload image</span>
                            <small>JPG, PNG, WEBP (max 2MB)</small>
                          </label>
                        )
                      }
                      <input
                        id="emp-image-input"
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        style={{ display: "none" }}
                      />
                    </div>
                  </div>
                  </div>

                </div>

                <div className="admin-modal-footer">
                  <button type="button" className="admin-cancel-btn" onClick={closeModal} disabled={saving}>Cancel</button>
                  <button type="submit" className="admin-save-btn" disabled={saving}>
                    {saving
                      ? <><RefreshCw size={17} className="admin-spinning" /> Saving...</>
                      : <><CheckCircle size={17} /> {editId !== null ? "Update Employee" : "Save Employee"}</>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW MODAL */}
        {viewEmployee && (
          <div className="admin-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setViewEmployee(null); }}>
            <div className="admin-modal" role="dialog" aria-modal="true">
              <div className="admin-modal-header">
                <div className="admin-modal-title">
                  <div className="admin-modal-icon"><Users size={23} /></div>
                  <div>
                    <h2>View Employee</h2>
                    <p>Employee details (read-only)</p>
                  </div>
                </div>
                <button type="button" className="admin-modal-close" onClick={() => setViewEmployee(null)}>
                  <X size={21} />
                </button>
              </div>
              <div className="admin-modal-body">
                {viewEmployee.image && (
                  <div className="emp-view-avatar-wrap">
                    <img src={getImageUrl(viewEmployee.image)} alt={viewEmployee.emp_name} className="emp-view-avatar" />
                  </div>
                )}
                <div className="admin-form-grid">
                {[
                  { label: "Employee ID",   value: viewEmployee.emp_id },
                  { label: "Employee Code", value: viewEmployee.employee_code },
                  { label: "Name",          value: viewEmployee.emp_name },
                  { label: "Email",         value: viewEmployee.email },
                  { label: "Phone",         value: viewEmployee.phone },
                  { label: "Department",    value: viewEmployee.department_name || "—" },
                  { label: "Date of Join",  value: viewEmployee.Date_of_join ? viewEmployee.Date_of_join.split("T")[0] : "—" },
                  { label: "Status",        value: viewEmployee.status },
                  { label: "Created At",    value: viewEmployee.created_at ? new Date(viewEmployee.created_at).toLocaleString() : "—" },
                  { label: "Updated At",    value: viewEmployee.updated_at ? new Date(viewEmployee.updated_at).toLocaleString() : "—" },
                ].map(({ label, value }) => (
                  <div className="admin-field" key={label}>
                    <label>{label}</label>
                    <input type="text" value={value} readOnly className="admin-readonly" />
                  </div>
                ))}
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-cancel-btn" onClick={() => setViewEmployee(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default Employee;
