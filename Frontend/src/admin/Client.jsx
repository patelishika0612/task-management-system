
import React, { useEffect, useRef, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import API from "../api";

import {
    Plus,
    Search,
    Pencil,
    Trash2,
    X,
    UserRound,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Eye,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
} from "lucide-react";

import "./Client.css";

// =====================================================
// VALIDATION HELPERS
// =====================================================

const onlyDigits = (value, max) => {
    const digits = String(value ?? "").replace(/\D/g, "");
    return max ? digits.slice(0, max) : digits;
};

const onlyLetters = (value) =>
    String(value ?? "").replace(/[^A-Za-z .'-]/g, "");

const isValidEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
        String(value).trim()
    );

const isValidPhone = (value) =>
    /^[6-9]\d{9}$/.test(String(value).trim());

const isValidPincode = (value) =>
    /^\d{6}$/.test(String(value).trim());

const isValidName = (value) =>
    /^[A-Za-z][A-Za-z .'-]*$/.test(
        String(value).trim()
    );

const isValidUrl = (value) =>
    /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i.test(
        String(value).trim()
    );

const phoneInputProps = {
    type: "tel",
    inputMode: "numeric",
    maxLength: 10,
    pattern: "[6-9][0-9]{9}",
    title: "Enter a valid 10-digit mobile number",
};

const DIGIT_FIELDS = {
    Phone: 10,
    Alternate_Phone: 10,
    Pincode: 6,
};

const LETTER_FIELDS = [
    "Client_Name",
    "City",
    "State",
    "Country",
];

const PAGE_SIZE = 5;

const STATUS_OPTIONS = [
    "Active",
    "Inactive",
    "Prospect",
    "Churned",
];

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

// =====================================================
// COMPONENT
// =====================================================

const Client = () => {
    const [clients, setClients] = useState([]);
    const [employees, setEmployees] = useState([]);

    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [viewClient, setViewClient] = useState(null);

    const [form, setForm] = useState({ ...EMPTY_FORM });

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Searchable employee dropdown
    const [empSearch, setEmpSearch] = useState("");
    const [empDropOpen, setEmpDropOpen] = useState(false);

    const empDropRef = useRef(null);

    // =================================================
    // ERROR MESSAGE HELPER
    // =================================================

    const getErrorMessage = (
        err,
        fallback = "Something went wrong."
    ) => {
        return (
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            fallback
        );
    };

    // =================================================
    // CLOSE EMPLOYEE DROPDOWN ON OUTSIDE CLICK
    // =================================================

    useEffect(() => {
        const handler = (e) => {
            if (
                empDropRef.current &&
                !empDropRef.current.contains(e.target)
            ) {
                setEmpDropOpen(false);
            }
        };

        document.addEventListener("mousedown", handler);

        return () => {
            document.removeEventListener("mousedown", handler);
        };
    }, []);

    // =================================================
    // FETCH CLIENTS
    // =================================================

    const fetchClients = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get("/clients");
            const result = response.data;

            if (result?.success === false) {
                throw new Error(
                    result.message || "Unable to fetch clients."
                );
            }

            const clientData = Array.isArray(result)
                ? result
                : result?.data;

            setClients(
                Array.isArray(clientData) ? clientData : []
            );
        } catch (err) {
            setError(
                getErrorMessage(
                    err,
                    "Unable to connect to the server."
                )
            );
        } finally {
            setLoading(false);
        }
    };

    // =================================================
    // FETCH EMPLOYEES
    // =================================================

    const fetchEmployees = async () => {
        try {
            const response = await API.get("/employees");
            const result = response.data;

            if (result?.success === false) {
                throw new Error(
                    result.message || "Unable to fetch employees."
                );
            }

            const employeeData = Array.isArray(result)
                ? result
                : result?.data;

            setEmployees(
                Array.isArray(employeeData)
                    ? employeeData
                    : []
            );
        } catch (err) {
            console.error(
                "Employee fetch error:",
                getErrorMessage(err, "Unable to fetch employees.")
            );
        }
    };

    // =================================================
    // INITIAL LOAD
    // =================================================

    useEffect(() => {
        fetchClients();
        fetchEmployees();
    }, []);

    // =================================================
    // RESET PAGINATION ON SEARCH
    // =================================================

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    // =================================================
    // FORM CHANGE
    // =================================================

    const handleChange = (e) => {
        const { name } = e.target;
        let { value } = e.target;

        if (DIGIT_FIELDS[name]) {
            value = onlyDigits(value, DIGIT_FIELDS[name]);
        } else if (LETTER_FIELDS.includes(name)) {
            value = onlyLetters(value);
        }

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        setError("");
    };

    // =================================================
    // VIEW CLIENT
    // =================================================

    const openViewModal = (client) => {
        setViewClient(client);
    };

    // =================================================
    // ADD CLIENT
    // =================================================

    const openAddModal = () => {
        setEditId(null);
        setForm({ ...EMPTY_FORM });

        setError("");
        setSuccess("");

        setEmpSearch("");
        setEmpDropOpen(false);

        setIsModalOpen(true);
    };

    // =================================================
    // EDIT CLIENT
    // =================================================

    const openEditModal = async (client) => {
        setError("");
        setSuccess("");

        setEmpSearch("");
        setEmpDropOpen(false);

        try {
            setLoading(true);

            const response = await API.get(
                `/clients/${client.Client_ID}`
            );

            const result = response.data;

            if (result?.success === false) {
                throw new Error(
                    result.message || "Unable to fetch client."
                );
            }

            const d = result?.data ?? result;

            if (!d || d.Client_ID == null) {
                throw new Error("Client details not found.");
            }

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
                Pincode:
                    d.Pincode == null ? "" : String(d.Pincode),
                Industry: d.Industry || "",
                Client_Type: d.Client_Type || "",
                Website: d.Website || "",
                Assigned_Employee_ID:
                    d.Assigned_Employee_ID == null
                        ? ""
                        : String(d.Assigned_Employee_ID),
                Status: d.Status || "Active",
                Notes: d.Notes || "",
            });

            setIsModalOpen(true);
        } catch (err) {
            setError(
                getErrorMessage(err, "Unable to open client.")
            );
        } finally {
            setLoading(false);
        }
    };

    // =================================================
    // CLOSE MODAL
    // =================================================

    const closeModal = () => {
        if (saving) return;

        setIsModalOpen(false);
        setEditId(null);

        setForm({ ...EMPTY_FORM });

        setError("");
        setEmpSearch("");
        setEmpDropOpen(false);
    };

    // =================================================
    // SUBMIT CLIENT
    // =================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        const f = form;

        if (!f.Client_Name.trim()) {
            setError("Client name is required.");
            return;
        }

        if (
            f.Client_Name.trim().length < 2 ||
            !isValidName(f.Client_Name)
        ) {
            setError(
                "Enter a valid client name (letters only, min 2 characters)."
            );
            return;
        }

        if (!f.Company_Name.trim()) {
            setError("Company name is required.");
            return;
        }

        if (f.Company_Name.trim().length < 2) {
            setError(
                "Company name must be at least 2 characters."
            );
            return;
        }

        if (f.Email && !isValidEmail(f.Email)) {
            setError("Enter a valid email address.");
            return;
        }

        if (f.Phone && !isValidPhone(f.Phone)) {
            setError(
                "Phone must be a valid 10-digit mobile number."
            );
            return;
        }

        if (
            f.Alternate_Phone &&
            !isValidPhone(f.Alternate_Phone)
        ) {
            setError(
                "Alternate phone must be a valid 10-digit mobile number."
            );
            return;
        }

        if (
            f.Phone &&
            f.Alternate_Phone &&
            f.Phone === f.Alternate_Phone
        ) {
            setError(
                "Alternate phone must be different from phone."
            );
            return;
        }

        if (f.Website && !isValidUrl(f.Website)) {
            setError("Enter a valid website URL.");
            return;
        }

        if (f.Pincode && !isValidPincode(f.Pincode)) {
            setError("Pincode must be 6 digits.");
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const isEditing = editId !== null;

            const payload = {
                ...form,
                Client_Name: form.Client_Name.trim(),
                Company_Name: form.Company_Name.trim(),
                Email: form.Email.trim(),
                Phone: form.Phone.trim(),
                Alternate_Phone: form.Alternate_Phone.trim(),
                Address: form.Address.trim(),
                City: form.City.trim(),
                State: form.State.trim(),
                Country: form.Country.trim(),
                Pincode: form.Pincode.trim(),
                Industry: form.Industry.trim(),
                Client_Type: form.Client_Type.trim(),
                Website: form.Website.trim(),
                Notes: form.Notes.trim(),
                Assigned_Employee_ID:
                    form.Assigned_Employee_ID || null,
            };

            // Axios replaces fetch().
            const response = isEditing
                ? await API.put(
                    `/clients/${editId}`,
                    payload
                )
                : await API.post("/clients", payload);

            const result = response.data;

            if (result?.success === false) {
                throw new Error(
                    result.message || "Unable to save client."
                );
            }

            setSuccess(
                result?.message ||
                (isEditing
                    ? "Client updated successfully."
                    : "Client created successfully.")
            );

            setIsModalOpen(false);
            setEditId(null);

            setForm({ ...EMPTY_FORM });
            setEmpSearch("");
            setEmpDropOpen(false);

            await fetchClients();
        } catch (err) {
            setError(
                getErrorMessage(err, "Unable to save client.")
            );
        } finally {
            setSaving(false);
        }
    };

    // =================================================
    // DELETE CLIENT
    // =================================================

    const handleDelete = async (client) => {
        const confirmed = window.confirm(
            `Delete "${client.Client_Name}"?`
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");

        try {
            const response = await API.delete(
                `/clients/${client.Client_ID}`
            );

            const result = response.data;

            if (result?.success === false) {
                throw new Error(
                    result.message || "Unable to delete client."
                );
            }

            setSuccess(
                result?.message ||
                "Client deleted successfully."
            );

            await fetchClients();
        } catch (err) {
            setError(
                getErrorMessage(err, "Unable to delete client.")
            );
        }
    };

    // =================================================
    // FILTER + PAGINATION
    // =================================================

    const filtered = clients.filter((client) => {
        const q = search.toLowerCase().trim();

        return (
            String(client.Client_Name || "")
                .toLowerCase()
                .includes(q) ||
            String(client.Company_Name || "")
                .toLowerCase()
                .includes(q) ||
            String(client.Email || "")
                .toLowerCase()
                .includes(q) ||
            String(client.City || "")
                .toLowerCase()
                .includes(q) ||
            String(client.Client_ID ?? "").includes(q)
        );
    });

    const totalPages = Math.ceil(
        filtered.length / PAGE_SIZE
    );

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

    // =================================================
    // DISPLAY HELPERS
    // =================================================

    const fmt = (value) =>
        value === null ||
        value === undefined ||
        value === ""
            ? "—"
            : String(value);

    const fmtDate = (value) =>
        value ? new Date(value).toLocaleString() : "—";

    const filteredEmps = employees.filter((employee) =>
        String(employee.emp_name || "")
            .toLowerCase()
            .includes(empSearch.toLowerCase())
    );

    const selectedEmpName = form.Assigned_Employee_ID
        ? employees.find(
            (employee) =>
                String(employee.emp_id) ===
                String(form.Assigned_Employee_ID)
        )?.emp_name || ""
        : "";

    // =================================================
    // JSX
    // =================================================

    return (
        <AdminLayout>
            <div className="admin-page">
                {/* HEADER */}
                <div className="admin-page-header">
                    <div className="admin-page-heading">
                        <div className="admin-page-heading-icon">
                            <UserRound size={25} />
                        </div>

                        <div>
                            <h1>Clients</h1>
                            <p>
                                Manage your organization's clients
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="admin-add-btn"
                        onClick={openAddModal}
                    >
                        <Plus size={19} />
                        Add Client
                    </button>
                </div>

                {/* ALERTS */}
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
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
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
                            {filtered.length} client
                            {filtered.length !== 1 ? "s" : ""}
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
                                        <td
                                            colSpan="9"
                                            className="admin-table-empty"
                                        >
                                            <RefreshCw
                                                size={22}
                                                className="admin-spinning"
                                            />
                                            <p>Loading clients...</p>
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="9"
                                            className="admin-table-empty"
                                        >
                                            <UserRound size={32} />

                                            <h3>
                                                {search
                                                    ? "No clients found"
                                                    : "No clients added yet"}
                                            </h3>

                                            <p>
                                                {search
                                                    ? "Try a different search."
                                                    : "Click Add Client to get started."}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((client) => (
                                        <tr key={client.Client_ID}>
                                            <td>
                                                <span className="admin-table-id">
                                                    {client.Client_ID}
                                                </span>
                                            </td>

                                            <td>{client.Client_Name}</td>
                                            <td>{client.Company_Name}</td>
                                            <td>{fmt(client.Email)}</td>
                                            <td>{fmt(client.Phone)}</td>
                                            <td>{fmt(client.City)}</td>
                                            <td>{fmt(client.Client_Type)}</td>

                                            <td>
                                                <span
                                                    className={`admin-status-badge admin-status-${String(
                                                        client.Status || ""
                                                    ).toLowerCase()}`}
                                                >
                                                    {client.Status || "—"}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="admin-actions">
                                                    <button
                                                        type="button"
                                                        className="admin-view-btn"
                                                        onClick={() =>
                                                            openViewModal(client)
                                                        }
                                                    >
                                                        <Eye size={16} />
                                                        <span>View</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="admin-edit-btn"
                                                        onClick={() =>
                                                            openEditModal(client)
                                                        }
                                                        disabled={loading}
                                                    >
                                                        <Pencil size={16} />
                                                        <span>Edit</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="admin-delete-btn"
                                                        onClick={() =>
                                                            handleDelete(client)
                                                        }
                                                    >
                                                        <Trash2 size={16} />
                                                        <span>Delete</span>
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
                                        setCurrentPage((page) =>
                                            Math.max(1, page - 1)
                                        )
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
                                            currentPage === page
                                                ? "admin-page-active"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            setCurrentPage(page)
                                        }
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    className="admin-page-btn"
                                    onClick={() =>
                                        setCurrentPage((page) =>
                                            Math.min(
                                                totalPages,
                                                page + 1
                                            )
                                        )
                                    }
                                    disabled={
                                        currentPage === totalPages
                                    }
                                    aria-label="Next page"
                                >
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
                    <div
                        className="admin-modal-overlay"
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) {
                                closeModal();
                            }
                        }}
                    >
                        <div
                            className="admin-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="client-modal-title"
                        >
                            <div className="admin-modal-header">
                                <div className="admin-modal-title">
                                    <div className="admin-modal-icon">
                                        <UserRound size={23} />
                                    </div>

                                    <div>
                                        <h2 id="client-modal-title">
                                            {editId !== null
                                                ? "Edit Client"
                                                : "Add Client"}
                                        </h2>

                                        <p>
                                            {editId !== null
                                                ? "Update client information."
                                                : "Enter client details."}
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
                                        {editId !== null && (
                                            <div className="admin-field admin-field-full">
                                                <label>Client ID</label>
                                                <input
                                                    type="text"
                                                    value={editId}
                                                    readOnly
                                                    className="admin-readonly"
                                                />
                                            </div>
                                        )}

                                        {/* CLIENT NAME */}
                                        <div className="admin-field">
                                            <label>
                                                Client Name <span>*</span>
                                            </label>

                                            <input
                                                type="text"
                                                name="Client_Name"
                                                placeholder="e.g. John Doe"
                                                value={form.Client_Name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        {/* COMPANY */}
                                        <div className="admin-field">
                                            <label>
                                                Company Name <span>*</span>
                                            </label>

                                            <input
                                                type="text"
                                                name="Company_Name"
                                                placeholder="e.g. Acme Corp"
                                                value={form.Company_Name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        {/* EMAIL */}
                                        <div className="admin-field">
                                            <label>Email</label>

                                            <input
                                                type="email"
                                                name="Email"
                                                placeholder="e.g. john@acme.com"
                                                value={form.Email}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        {/* PHONE */}
                                        <div className="admin-field">
                                            <label>Phone</label>

                                            <input
                                                {...phoneInputProps}
                                                name="Phone"
                                                placeholder="e.g. 9876543210"
                                                value={form.Phone}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        {/* ALTERNATE PHONE */}
                                        <div className="admin-field">
                                            <label>Alternate Phone</label>

                                            <input
                                                {...phoneInputProps}
                                                name="Alternate_Phone"
                                                placeholder="e.g. 9876543211"
                                                value={form.Alternate_Phone}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        {/* WEBSITE */}
                                        <div className="admin-field">
                                            <label>Website</label>

                                            <input
                                                type="text"
                                                name="Website"
                                                placeholder="e.g. https://acme.com"
                                                value={form.Website}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        {/* INDUSTRY */}
                                        <div className="admin-field">
                                            <label>Industry</label>

                                            <input
                                                type="text"
                                                name="Industry"
                                                placeholder="e.g. Technology"
                                                value={form.Industry}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        {/* CLIENT TYPE */}
                                        <div className="admin-field">
                                            <label>Client Type</label>

                                            <input
                                                type="text"
                                                name="Client_Type"
                                                placeholder="e.g. Corporate"
                                                value={form.Client_Type}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        {/* ASSIGNED EMPLOYEE */}
                                        <div className="admin-field">
                                            <label>Assigned Employee</label>

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
                                                    aria-expanded={empDropOpen}
                                                >
                                                    <span
                                                        style={{
                                                            color: selectedEmpName
                                                                ? "#1e293b"
                                                                : "#94a3b8",
                                                        }}
                                                    >
                                                        {selectedEmpName ||
                                                            "Select Employee"}
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
                                                                onChange={(e) =>
                                                                    setEmpSearch(
                                                                        e.target.value
                                                                    )
                                                                }
                                                                autoFocus
                                                            />

                                                            {empSearch && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setEmpSearch("")
                                                                    }
                                                                    aria-label="Clear employee search"
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
                                                                    setForm((prev) => ({
                                                                        ...prev,
                                                                        Assigned_Employee_ID: "",
                                                                    }));
                                                                    setEmpDropOpen(false);
                                                                    setEmpSearch("");
                                                                }}
                                                            >
                                                                <span>-- None --</span>
                                                            </button>

                                                            {filteredEmps.map((employee) => (
                                                                <button
                                                                    type="button"
                                                                    key={employee.emp_id}
                                                                    className="proj-emp-option"
                                                                    onClick={() => {
                                                                        setForm((prev) => ({
                                                                            ...prev,
                                                                            Assigned_Employee_ID:
                                                                                String(employee.emp_id),
                                                                        }));
                                                                        setEmpDropOpen(false);
                                                                        setEmpSearch("");
                                                                    }}
                                                                >
                                                                    <span>
                                                                        {employee.emp_name}
                                                                    </span>

                                                                    <small>
                                                                        {employee.employee_code}
                                                                    </small>
                                                                </button>
                                                            ))}

                                                            {filteredEmps.length === 0 && (
                                                                <p className="proj-emp-empty">
                                                                    No employees found
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* STATUS */}
                                        <div className="admin-field">
                                            <label>
                                                Status <span>*</span>
                                            </label>

                                            <select
                                                name="Status"
                                                value={form.Status}
                                                onChange={handleChange}
                                                required
                                            >
                                                {STATUS_OPTIONS.map((status) => (
                                                    <option
                                                        key={status}
                                                        value={status}
                                                    >
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* ADDRESS */}
                                        <div className="admin-field admin-field-full">
                                            <label>Address</label>

                                            <input
                                                type="text"
                                                name="Address"
                                                placeholder="e.g. 123 Main Street"
                                                value={form.Address}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        {/* CITY */}
                                        <div className="admin-field">
                                            <label>City</label>

                                            <input
                                                type="text"
                                                name="City"
                                                placeholder="e.g. Mumbai"
                                                value={form.City}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        {/* STATE */}
                                        <div className="admin-field">
                                            <label>State</label>

                                            <input
                                                type="text"
                                                name="State"
                                                placeholder="e.g. Maharashtra"
                                                value={form.State}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        {/* COUNTRY */}
                                        <div className="admin-field">
                                            <label>Country</label>

                                            <input
                                                type="text"
                                                name="Country"
                                                placeholder="e.g. India"
                                                value={form.Country}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        {/* PINCODE */}
                                        <div className="admin-field">
                                            <label>Pincode</label>

                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={6}
                                                name="Pincode"
                                                placeholder="e.g. 400001"
                                                value={form.Pincode}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        {/* NOTES */}
                                        <div className="admin-field admin-field-full">
                                            <label>Notes</label>

                                            <textarea
                                                name="Notes"
                                                placeholder="Any additional notes..."
                                                value={form.Notes}
                                                onChange={handleChange}
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* FOOTER */}
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
                                                    ? "Update Client"
                                                    : "Save Client"}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* VIEW MODAL */}
                {viewClient && (
                    <div
                        className="admin-modal-overlay"
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) {
                                setViewClient(null);
                            }
                        }}
                    >
                        <div
                            className="admin-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="client-view-title"
                        >
                            <div className="admin-modal-header">
                                <div className="admin-modal-title">
                                    <div className="admin-modal-icon">
                                        <UserRound size={23} />
                                    </div>

                                    <div>
                                        <h2 id="client-view-title">
                                            View Client
                                        </h2>
                                        <p>
                                            Client details (read-only)
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="admin-modal-close"
                                    onClick={() => setViewClient(null)}
                                    aria-label="Close client details"
                                >
                                    <X size={21} />
                                </button>
                            </div>

                            <div className="admin-modal-body admin-form-grid">
                                <div className="admin-field">
                                    <label>Client ID</label>
                                    <input
                                        type="text"
                                        value={fmt(viewClient.Client_ID)}
                                        readOnly
                                        className="admin-readonly"
                                    />
                                </div>

                                <div className="admin-field">
                                    <label>Client Name</label>
                                    <input
                                        type="text"
                                        value={fmt(viewClient.Client_Name)}
                                        readOnly
                                        className="admin-readonly"
                                    />
                                </div>

                                <div className="admin-field">
                                    <label>Company Name</label>
                                    <input
                                        type="text"
                                        value={fmt(viewClient.Company_Name)}
                                        readOnly
                                        className="admin-readonly"
                                    />
                                </div>

                                <div className="admin-field">
                                    <label>Email</label>
                                    <input
                                        type="text"
                                        value={fmt(viewClient.Email)}
                                        readOnly
                                        className="admin-readonly"
                                    />
                                </div>

                                <div className="admin-field">
                                    <label>Phone</label>
                                    <input
                                        type="text"
                                        value={fmt(viewClient.Phone)}
                                        readOnly
                                        className="admin-readonly"
                                    />
                                </div>

                                <div className="admin-field">
                                    <label>Alternate Phone</label>
                                    <input
                                        type="text"
                                        value={fmt(viewClient.Alternate_Phone)}
                                        readOnly
                                        className="admin-readonly"
                                    />
                                </div>

                                <div className="admin-field">
                                    <label>Website</label>
                                    <input
                                        type="text"
                                        value={fmt(viewClient.Website)}
                                        readOnly
                                        className="admin-readonly"
                                    />
                                </div>

                                <div className="admin-field">
                                    <label>Industry</label>
                                    <input
                                        type="text"
                                        value={fmt(viewClient.Industry)}
                                        readOnly
                                        className="admin-readonly"
                                    />
                                </div>

                                <div className="admin-field">
                                    <label>Client Type</label>
                                    <input
                                        type="text"
                                        value={fmt(viewClient.Client_Type)}
                                        readOnly
                                        className="admin-readonly"
                                    />
                                </div>

                                <div className="admin-field">
                                    <label>Assigned Employee</label>
                                    <input
                                        type="text"
                                        value={
                                            viewClient.Assigned_Employee_Name ||
                                            fmt(viewClient.Assigned_Employee_ID)
                                        }
                                        readOnly
                                        className="admin-readonly"
                                    />
                                </div>

                                <div className="admin-field">
                                    <label>Status</label>
                                    <input
                                        type="text"
                                        value={fmt(viewClient.Status)}
                                        readOnly
                                        className="admin-readonly"
                                    />
                                </div>

                                <div className="admin-field admin-field-full">
                                    <label>Address</label>
                                    <input
                                        type="text"
                                        value={fmt(viewClient.Address)}
                                        readOnly
                                        className="admin-readonly"
                                    />
                                </div>

                                <div className="admin-field">
                                    <label>City</label>
                                    <input
                                        type="text"
                                        value={fmt(viewClient.City)}
                                        readOnly
                                        className="admin-readonly"
                                    />
                                </div>

                                <div className="admin-field">
                                    <label>State</label>
                                    <input
                                        type="text"
                                        value={fmt(viewClient.State)}
                                        readOnly
                                        className="admin-readonly"
                                    />
                                </div>

                                <div className="admin-field">
                                    <label>Country</label>
                                    <input
                                        type="text"
                                        value={fmt(viewClient.Country)}
                                        readOnly
                                        className="admin-readonly"
                                    />
                                </div>

                                <div className="admin-field">
                                    <label>Pincode</label>
                                    <input
                                        type="text"
                                        value={fmt(viewClient.Pincode)}
                                        readOnly
                                        className="admin-readonly"
                                    />
                                </div>

                                <div className="admin-field">
                                    <label>Created Date</label>
                                    <input
                                        type="text"
                                        value={fmtDate(viewClient.Created_Date)}
                                        readOnly
                                        className="admin-readonly"
                                    />
                                </div>

                                <div className="admin-field">
                                    <label>Updated Date</label>
                                    <input
                                        type="text"
                                        value={fmtDate(viewClient.Updated_Date)}
                                        readOnly
                                        className="admin-readonly"
                                    />
                                </div>

                                <div className="admin-field admin-field-full">
                                    <label>Notes</label>
                                    <textarea
                                        value={fmt(viewClient.Notes)}
                                        readOnly
                                        className="admin-readonly"
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="admin-modal-footer">
                                <button
                                    type="button"
                                    className="admin-cancel-btn"
                                    onClick={() => setViewClient(null)}
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

export default Client;
