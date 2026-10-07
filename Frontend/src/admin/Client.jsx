import React, { useEffect, useRef, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Plus, Search, Pencil, Trash2, X, UserRound,
  RefreshCw, AlertCircle, CheckCircle, Eye,
  ChevronLeft, ChevronRight, ChevronDown,
} from "lucide-react";
import "./Client.css";
import {
  onlyDigits, onlyLetters, isValidEmail, isValidPhone,
  isValidPincode, isValidName, isValidUrl, phoneInputProps,
} from "../validation";

const DIGIT_FIELDS = { Phone: 10, Alternate_Phone: 10, Pincode: 6 };
const LETTER_FIELDS = ["Client_Name", "City", "State", "Country"];

const API_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/clients`;
const EMP_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/employees`;
const PAGE_SIZE = 5;     

const STATUS_OPTIONS = ["Active", "Inactive", "Prospect", "Churned"];

const EMPTY_FORM = {
  Client_Name: "",
  Company_Name: "",
  Email: "",
  Phone: "",
  Alternate_Phone: "",
  Address: "",
  City: "",
  State: "",
  Country: "India",
  Pincode: "",
  Industry: "",
  Client_Type: "",
  Website: "",
  Assigned_Employee_ID: "",
  Status: "Active",
  Notes: "",
};

const Client = () => {
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewClient, setViewClient] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Assigned Employee searchable dropdown
  const [empSearch, setEmpSearch] = useState("");
  const [empDropOpen, setEmpDropOpen] = useState(false);
  const empDropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (empDropRef.current && !empDropRef.current.contains(e.target))
        setEmpDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ==========================================
  // FETCH
  // ==========================================
  const fetchClients = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(API_URL);
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Unable to fetch clients");
      setClients(result.data || []);
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
    fetchClients();
    fetchEmployees();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [search]);

  // ==========================================
  // FORM CHANGE
  // ==========================================
  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;
    if (DIGIT_FIELDS[name]) value = onlyDigits(value, DIGIT_FIELDS[name]);
    else if (LETTER_FIELDS.includes(name)) value = onlyLetters(value);
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  // ==========================================
  // OPEN VIEW
  // ==========================================
  const openViewModal = (client) => setViewClient(client);

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
  const openEditModal = async (client) => {
    setError("");
    setSuccess("");
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/${client.Client_ID}`);
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Unable to fetch client");
      const d = result.data;
      setEditId(d.Client_ID);
      setForm({
        Client_Name: d.Client_Name || "",
        Company_Name: d.Company_Name || "",
        Email: d.Email || "",
        Phone: d.Phone || "",
        Alternate_Phone: d.Alternate_Phone || "",
        Address: d.Address || "",
        City: d.City || "",
        State: d.State || "",
        Country: d.Country || "India",
        Pincode: d.Pincode || "",
        Industry: d.Industry || "",
        Client_Type: d.Client_Type || "",
        Website: d.Website || "",
        Assigned_Employee_ID: d.Assigned_Employee_ID || "",
        Status: d.Status || "Active",
        Notes: d.Notes || "",
      });
      setIsModalOpen(true);
    } catch (err) {
      setError(err.message || "Unable to open client");
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
    setEmpSearch("");
    setEmpDropOpen(false);
  };

  // ==========================================
  // SUBMIT
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    const f = form;
    if (!f.Client_Name.trim()) { setError("Client name is required."); return; }
    if (f.Client_Name.trim().length < 2 || !isValidName(f.Client_Name)) { setError("Enter a valid client name (letters only, min 2 characters)."); return; }
    if (!f.Company_Name.trim()) { setError("Company name is required."); return; }
    if (f.Company_Name.trim().length < 2) { setError("Company name must be at least 2 characters."); return; }
    if (f.Email && !isValidEmail(f.Email)) { setError("Enter a valid email address."); return; }
    if (f.Phone && !isValidPhone(f.Phone)) { setError("Phone must be a valid 10-digit mobile number."); return; }
    if (f.Alternate_Phone && !isValidPhone(f.Alternate_Phone)) { setError("Alternate phone must be a valid 10-digit mobile number."); return; }
    if (f.Phone && f.Alternate_Phone && f.Phone === f.Alternate_Phone) { setError("Alternate phone must be different from phone."); return; }
    if (f.Website && !isValidUrl(f.Website)) { setError("Enter a valid website URL."); return; }
    if (f.Pincode && !isValidPincode(f.Pincode)) { setError("Pincode must be 6 digits."); return; }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const isEditing = editId !== null;
      const res = await fetch(isEditing ? `${API_URL}/${editId}` : API_URL, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Unable to save client");

      setSuccess(result.message || (isEditing ? "Client updated successfully" : "Client created successfully"));
      setIsModalOpen(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      await fetchClients();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DELETE
  // ==========================================
  const handleDelete = async (client) => {
    if (!window.confirm(`Delete "${client.Client_Name}"?`)) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/${client.Client_ID}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Unable to delete");
      setSuccess(result.message || "Client deleted successfully");
      await fetchClients();
    } catch (err) {
      setError(err.message || "Unable to delete.");
    }
  };

  // ==========================================
  // FILTER + PAGINATION
  // ==========================================
  const filtered = clients.filter((c) => {
    const q = search.toLowerCase().trim();
    return (
      c.Client_Name?.toLowerCase().includes(q) ||
      c.Company_Name?.toLowerCase().includes(q) ||
      c.Email?.toLowerCase().includes(q) ||
      c.City?.toLowerCase().includes(q) ||
      String(c.Client_ID).includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    const lastPage = Math.max(1, totalPages);
    if (currentPage > lastPage) setCurrentPage(lastPage);
  }, [totalPages, currentPage]);

  const fmt = (val) => val || "—";
  const fmtDate = (val) => val ? new Date(val).toLocaleString() : "—";

  const filteredEmps = employees.filter(e =>
    e.emp_name.toLowerCase().includes(empSearch.toLowerCase())
  );
  const selectedEmpName = form.Assigned_Employee_ID
    ? employees.find(e => String(e.emp_id) === String(form.Assigned_Employee_ID))?.emp_name || ""
    : "";

  return (
    <AdminLayout>
      <div className="admin-page">

        {/* HEADER */}
        <div className="admin-page-header">
          <div className="admin-page-heading">
            <div className="admin-page-heading-icon"><UserRound size={25} /></div>
            <div>
              <h1>Clients</h1>
              <p>Manage your organization's clients</p>
            </div>
          </div>
          <button type="button" className="admin-add-btn" onClick={openAddModal}>
            <Plus size={19} /> Add Client
          </button>
        </div>

        {/* ALERTS */}
        {success && (
          <div className="admin-alert admin-alert-success">
            <CheckCircle size={18} /><span>{success}</span>
            <button type="button" onClick={() => setSuccess("")}><X size={17} /></button>
          </div>
        )}
        {error && !isModalOpen && (
          <div className="admin-alert admin-alert-error">
            <AlertCircle size={18} /><span>{error}</span>
            <button type="button" onClick={() => setError("")}><X size={17} /></button>
          </div>
        )}

        {/* TABLE CARD */}
        <div className="admin-table-card">
          <div className="admin-table-card-header">
            <div>
              <h2>Client List</h2>
              <p>View, edit, and manage clients</p>
            </div>
          </div>

          {/* SEARCH */}
          <div className="admin-toolbar">
            <div className="admin-search">
              <Search size={19} />
              <input
                type="search"
                placeholder="Search by ID, name, company, email or city..."
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
              {filtered.length} client{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* TABLE */}
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client Name</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && clients.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="admin-table-empty">
                      <RefreshCw size={22} className="admin-spinning" />
                      <p>Loading clients...</p>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="admin-table-empty">
                      <UserRound size={32} />
                      <h3>{search ? "No clients found" : "No clients added yet"}</h3>
                      <p>{search ? "Try a different search." : "Click Add Client to get started."}</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((c) => (
                    <tr key={c.Client_ID}>
                      <td><span className="admin-table-id">{c.Client_ID}</span></td>
                      <td>{c.Client_Name}</td>
                      <td>{c.Company_Name}</td>
                      <td>{fmt(c.Email)}</td>
                      <td>{fmt(c.Phone)}</td>
                      <td>{fmt(c.City)}</td>
                      <td>{fmt(c.Client_Type)}</td>
                      <td>
                        <span className={`admin-status-badge admin-status-${c.Status?.toLowerCase()}`}>
                          {c.Status}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button type="button" className="admin-view-btn" onClick={() => openViewModal(c)}>
                            <Eye size={16} /><span>View</span>
                          </button>
                          <button type="button" className="admin-edit-btn" onClick={() => openEditModal(c)}>
                            <Pencil size={16} /><span>Edit</span>
                          </button>
                          <button type="button" className="admin-delete-btn" onClick={() => handleDelete(c)}>
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
            Showing {paginated.length} of {filtered.length} clients
          </div>
        </div>

        {/* ADD / EDIT MODAL */}
        {isModalOpen && (
          <div className="admin-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
            <div className="admin-modal" role="dialog" aria-modal="true">
              <div className="admin-modal-header">
                <div className="admin-modal-title">
                  <div className="admin-modal-icon"><UserRound size={23} /></div>
                  <div>
                    <h2>{editId !== null ? "Edit Client" : "Add Client"}</h2>
                    <p>{editId !== null ? "Update client information." : "Enter client details."}</p>
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
                    {editId !== null && (
                      <div className="admin-field admin-field-full">
                        <label>Client ID</label>
                        <input type="text" value={editId} readOnly className="admin-readonly" />
                      </div>
                    )}

                    {/* Client Name + Company Name */}
                    <div className="admin-field">
                      <label>Client Name <span>*</span></label>
                      <input type="text" name="Client_Name" placeholder="e.g. John Doe" value={form.Client_Name} onChange={handleChange} required />
                    </div>
                    <div className="admin-field">
                      <label>Company Name <span>*</span></label>
                      <input type="text" name="Company_Name" placeholder="e.g. Acme Corp" value={form.Company_Name} onChange={handleChange} required />
                    </div>

                    {/* Email + Phone */}
                    <div className="admin-field">
                      <label>Email</label>
                      <input type="email" name="Email" placeholder="e.g. john@acme.com" value={form.Email} onChange={handleChange} />
                    </div>
                    <div className="admin-field">
                      <label>Phone</label>
                      <input {...phoneInputProps} name="Phone" placeholder="e.g. 9876543210" value={form.Phone} onChange={handleChange} />
                    </div>

                    {/* Alternate Phone + Website */}
                    <div className="admin-field">
                      <label>Alternate Phone</label>
                      <input {...phoneInputProps} name="Alternate_Phone" placeholder="e.g. 9876543211" value={form.Alternate_Phone} onChange={handleChange} />
                    </div>
                    <div className="admin-field">
                      <label>Website</label>
                      <input type="text" name="Website" placeholder="e.g. https://acme.com" value={form.Website} onChange={handleChange} />
                    </div>

                    {/* Industry + Client Type (text input) */}
                    <div className="admin-field">
                      <label>Industry</label>
                      <input type="text" name="Industry" placeholder="e.g. Technology" value={form.Industry} onChange={handleChange} />
                    </div>
                    <div className="admin-field">
                      <label>Client Type</label>
                      <input type="text" name="Client_Type" placeholder="e.g. Corporate" value={form.Client_Type} onChange={handleChange} />
                    </div>

                    {/* Assigned Employee (searchable dropdown) + Status */}
                    <div className="admin-field">
                      <label>Assigned Employee</label>
                      <div className="proj-emp-drop" ref={empDropRef}>
                        <button
                          type="button"
                          className="proj-emp-trigger"
                          onClick={() => setEmpDropOpen(o => !o)}
                        >
                          <span style={{ color: selectedEmpName ? "#1e293b" : "#94a3b8" }}>
                            {selectedEmpName || "Select Employee"}
                          </span>
                          <ChevronDown size={16} className={`proj-emp-chevron${empDropOpen ? " proj-emp-chevron-open" : ""}`} />
                        </button>
                        {empDropOpen && (
                          <div className="proj-emp-panel">
                            <div className="proj-emp-search">
                              <Search size={14} />
                              <input
                                type="text"
                                placeholder="Search employee..."
                                value={empSearch}
                                onChange={e => setEmpSearch(e.target.value)}
                                autoFocus
                              />
                              {empSearch && <button type="button" onClick={() => setEmpSearch("")}><X size={13} /></button>}
                            </div>
                            <div className="proj-emp-list">
                              <div
                                className="proj-emp-option"
                                onClick={() => { setForm(p => ({ ...p, Assigned_Employee_ID: "" })); setEmpDropOpen(false); setEmpSearch(""); }}
                              >
                                <span>-- None --</span>
                              </div>
                              {filteredEmps.map(emp => (
                                <div
                                  key={emp.emp_id}
                                  className="proj-emp-option"
                                  onClick={() => { setForm(p => ({ ...p, Assigned_Employee_ID: emp.emp_id })); setEmpDropOpen(false); setEmpSearch(""); }}
                                >
                                  <span>{emp.emp_name}</span>
                                  <small>{emp.employee_code}</small>
                                </div>
                              ))}
                              {filteredEmps.length === 0 && (
                                <p className="proj-emp-empty">No employees found</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="admin-field">
                      <label>Status <span>*</span></label>
                      <select name="Status" value={form.Status} onChange={handleChange}>
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Address full width */}
                    <div className="admin-field admin-field-full">
                      <label>Address</label>
                      <input type="text" name="Address" placeholder="e.g. 123 Main Street" value={form.Address} onChange={handleChange} />
                    </div>

                    {/* City + State */}
                    <div className="admin-field">
                      <label>City</label>
                      <input type="text" name="City" placeholder="e.g. Mumbai" value={form.City} onChange={handleChange} />
                    </div>
                    <div className="admin-field">
                      <label>State</label>
                      <input type="text" name="State" placeholder="e.g. Maharashtra" value={form.State} onChange={handleChange} />
                    </div>

                    {/* Country + Pincode */}
                    <div className="admin-field">
                      <label>Country</label>
                      <input type="text" name="Country" placeholder="e.g. India" value={form.Country} onChange={handleChange} />
                    </div>
                    <div className="admin-field">
                      <label>Pincode</label>
                      <input type="text" inputMode="numeric" maxLength={6} name="Pincode" placeholder="e.g. 400001" value={form.Pincode} onChange={handleChange} />
                    </div>

                    {/* Notes full width */}
                    <div className="admin-field admin-field-full">
                      <label>Notes</label>
                      <textarea name="Notes" placeholder="Any additional notes..." value={form.Notes} onChange={handleChange} rows={3} />
                    </div>
                  </div>
                </div>

                <div className="admin-modal-footer">
                  <button type="button" className="admin-cancel-btn" onClick={closeModal} disabled={saving}>Cancel</button>
                  <button type="submit" className="admin-save-btn" disabled={saving}>
                    {saving
                      ? <><RefreshCw size={17} className="admin-spinning" /> Saving...</>
                      : <><CheckCircle size={17} /> {editId !== null ? "Update Client" : "Save Client"}</>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW MODAL */}
        {viewClient && (
          <div className="admin-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setViewClient(null); }}>
            <div className="admin-modal" role="dialog" aria-modal="true">
              <div className="admin-modal-header">
                <div className="admin-modal-title">
                  <div className="admin-modal-icon"><UserRound size={23} /></div>
                  <div>
                    <h2>View Client</h2>
                    <p>Client details (read-only)</p>
                  </div>
                </div>
                <button type="button" className="admin-modal-close" onClick={() => setViewClient(null)}>
                  <X size={21} />
                </button>
              </div>
              <div className="admin-modal-body admin-form-grid">
                <div className="admin-field"><label>Client ID</label><input type="text" value={viewClient.Client_ID} readOnly className="admin-readonly" /></div>
                <div className="admin-field"><label>Client Name</label><input type="text" value={viewClient.Client_Name} readOnly className="admin-readonly" /></div>
                <div className="admin-field"><label>Company Name</label><input type="text" value={viewClient.Company_Name} readOnly className="admin-readonly" /></div>
                <div className="admin-field"><label>Email</label><input type="text" value={fmt(viewClient.Email)} readOnly className="admin-readonly" /></div>
                <div className="admin-field"><label>Phone</label><input type="text" value={fmt(viewClient.Phone)} readOnly className="admin-readonly" /></div>
                <div className="admin-field"><label>Alternate Phone</label><input type="text" value={fmt(viewClient.Alternate_Phone)} readOnly className="admin-readonly" /></div>
                <div className="admin-field"><label>Website</label><input type="text" value={fmt(viewClient.Website)} readOnly className="admin-readonly" /></div>
                <div className="admin-field"><label>Industry</label><input type="text" value={fmt(viewClient.Industry)} readOnly className="admin-readonly" /></div>
                <div className="admin-field"><label>Client Type</label><input type="text" value={fmt(viewClient.Client_Type)} readOnly className="admin-readonly" /></div>
                <div className="admin-field"><label>Assigned Employee</label><input type="text" value={viewClient.Assigned_Employee_Name || fmt(viewClient.Assigned_Employee_ID)} readOnly className="admin-readonly" /></div>
                <div className="admin-field"><label>Status</label><input type="text" value={viewClient.Status} readOnly className="admin-readonly" /></div>
                <div className="admin-field admin-field-full"><label>Address</label><input type="text" value={fmt(viewClient.Address)} readOnly className="admin-readonly" /></div>
                <div className="admin-field"><label>City</label><input type="text" value={fmt(viewClient.City)} readOnly className="admin-readonly" /></div>
                <div className="admin-field"><label>State</label><input type="text" value={fmt(viewClient.State)} readOnly className="admin-readonly" /></div>
                <div className="admin-field"><label>Country</label><input type="text" value={fmt(viewClient.Country)} readOnly className="admin-readonly" /></div>
                <div className="admin-field"><label>Pincode</label><input type="text" value={fmt(viewClient.Pincode)} readOnly className="admin-readonly" /></div>
                <div className="admin-field"><label>Created Date</label><input type="text" value={fmtDate(viewClient.Created_Date)} readOnly className="admin-readonly" /></div>
                <div className="admin-field"><label>Updated Date</label><input type="text" value={fmtDate(viewClient.Updated_Date)} readOnly className="admin-readonly" /></div>
                <div className="admin-field admin-field-full"><label>Notes</label><input type="text" value={fmt(viewClient.Notes)} readOnly className="admin-readonly" /></div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-cancel-btn" onClick={() => setViewClient(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default Client;
