
import React, { useEffect, useRef, useState } from "react";

import AdminLayout from "../components/AdminLayout";
import API from "../api";

import {
    Plus,
    Search,
    Pencil,
    Trash2,
    X,
    Users,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Eye,
    ChevronLeft,
    ChevronRight,
    Upload,
} from "lucide-react";

import "./Employee.css";

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

const isValidName = (value) =>
    /^[A-Za-z][A-Za-z .'-]*$/.test(
        String(value).trim()
    );

const phoneInputProps = {
    type: "tel",
    inputMode: "numeric",
    maxLength: 10,
    pattern: "[6-9][0-9]{9}",
    title: "Enter a valid 10-digit mobile number",
};

const PAGE_SIZE = 5;

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;                             




// =====================================================
// IMAGE URL
// =====================================================

const getImageUrl = (image) => {
    if (!image) return "";

    if (/^https?:\/\//i.test(image)) {
        return image;
    }

    const apiBase = String(
        API.defaults.baseURL || ""
    ).replace(/\/api\/?$/, "");

    const uploadsBase = String(
        import.meta.env.VITE_UPLOADS_URL ||
        `${apiBase}/uploads`
    ).replace(/\/$/, "");

    if (image.startsWith("/uploads/")) {
        return `${uploadsBase.replace(/\/uploads$/, "")}${image}`;
    }

    if (image.startsWith("uploads/")) {
        return `${uploadsBase.replace(/\/uploads$/, "")}/${image.slice(8)}`;
    }

    return `${uploadsBase}/${image.replace(/^\/+/, "")}`;
};

// =====================================================
// EMPTY FORM
// =====================================================

const EMPTY_FORM = {
    emp_name: "",
    email: "",
    phone: "",
    department_id: "",
    date_of_join: "",
    employee_code: "",
    password: "",
    image: "",
    status: "active",
};

// =====================================================
// COMPONENT
// =====================================================

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

    // =================================================
    // API ERROR HELPER
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
    // FORM CHANGE
    // =================================================

    const handleChange = (e) => {
        const { name } = e.target;
        let { value } = e.target;

        if (name === "phone") {
            value = onlyDigits(value, 10);
        } else if (name === "emp_name") {
            value = onlyLetters(value);
        } else if (name === "employee_code") {
            value = value
                .replace(/[^A-Za-z0-9_-]/g, "")
                .toUpperCase();
        }

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        setError("");
    };

    // =================================================
    // FETCH EMPLOYEES
    // =================================================

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get("/employees");
            const result = response.data;

            if (result?.success === false) {
                throw new Error(
                    result.message || "Unable to fetch employees."
                );
            }

            // Supports either { data: [...] } or a direct array.
            const employeeData = Array.isArray(result)
                ? result
                : result?.data;

            setEmployees(
                Array.isArray(employeeData) ? employeeData : []
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
    // FETCH DEPARTMENTS
    // =================================================

    const fetchDepartments = async () => {
        try {
            const response = await API.get("/departments");
            const result = response.data;

            if (result?.success === false) {
                throw new Error(
                    result.message || "Unable to fetch departments."
                );
            }

            const departmentData = Array.isArray(result)
                ? result
                : result?.data;

            setDepartments(
                Array.isArray(departmentData) ? departmentData : []
            );
        } catch (err) {
            console.error(
                "Department fetch error:",
                getErrorMessage(err, "Unable to fetch departments.")
            );
        }
    };

    // =================================================
    // INITIAL LOAD
    // =================================================

    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
    }, []);

    // =================================================
    // RESET PAGE WHEN SEARCH CHANGES
    // =================================================

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    // =================================================
    // IMAGE CHANGE
    // =================================================

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];

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

    // =================================================
    // REMOVE IMAGE
    // =================================================

    const removeImage = () => {
        setForm((prev) => ({
            ...prev,
            image: "",
        }));

        setImagePreview("");
        setImageFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // =================================================
    // VIEW EMPLOYEE
    // =================================================

    const openViewModal = (employee) => {
        setViewEmployee(employee);
    };

    // =================================================
    // ADD MODAL
    // =================================================

    const openAddModal = () => {
        setEditId(null);
        setForm({ ...EMPTY_FORM });
        setError("");
        setSuccess("");
        setImagePreview("");
        setImageFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        setIsModalOpen(true);
    };

    // =================================================
    // EDIT MODAL
    // =================================================

    const openEditModal = async (employee) => {
        setError("");
        setSuccess("");

        try {
            setLoading(true);

            const response = await API.get(
                `/employees/${employee.emp_id}`
            );

            const result = response.data;

            if (result?.success === false) {
                throw new Error(
                    result.message || "Unable to fetch employee."
                );
            }

            const d = result?.data ?? result;

            if (!d || d.emp_id == null) {
                throw new Error("Employee details not found.");
            }

            setEditId(d.emp_id);

            setForm({
                emp_name: d.emp_name || "",
                email: d.email || "",
                phone: d.phone || "",
                department_id:
                    d.department_id == null
                        ? ""
                        : String(d.department_id),
                password: "",
                date_of_join: d.date_of_join
                    ? String(d.date_of_join).split("T")[0]
                    : "",
                employee_code: d.employee_code || "",

                image: d.image || "",
                status: d.status || "active",
            });

            setImageFile(null);
            setImagePreview(getImageUrl(d.image));

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            setIsModalOpen(true);
        } catch (err) {
            setError(
                getErrorMessage(err, "Unable to open employee.")
            );
        } finally {
            setLoading(false);
        }
    };

    // =================================================
    // CLOSE ADD / EDIT MODAL
    // =================================================

    const closeModal = () => {
        if (saving) return;

        setIsModalOpen(false);
        setEditId(null);
        setForm({ ...EMPTY_FORM });
        setImagePreview("");
        setImageFile(null);
        setError("");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // =================================================
    // SUBMIT FORM
    // =================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        const {
            emp_name,
            email,
            phone,
            department_id,
            date_of_join,
            employee_code,
            password,
            status,
        } = form;

        // Validation
        if (!emp_name.trim()) {
            setError("Employee name is required.");
            return;
        }

        if (
            emp_name.trim().length < 2 ||
            !isValidName(emp_name)
        ) {
            setError(
                "Enter a valid employee name (letters only, min 2 characters)."
            );
            return;
        }

        if (!employee_code.trim()) {
            setError("Employee code is required.");
            return;
        }


        if (!email.trim()) {
            setError("Email is required.");
            return;
        }

        if (!isValidEmail(email)) {
            setError("Enter a valid email address.");
            return;
        }

        if (!phone.trim()) {
            setError("Phone is required.");
            return;
        }

        if (!isValidPhone(phone)) {
            setError(
                "Phone must be a valid 10-digit mobile number."
            );
            return;
        }

        if (!date_of_join) {
            setError("Date of joining is required.");
            return;
        }

        const today = new Date();
        const localToday = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, "0"),
            String(today.getDate()).padStart(2, "0"),
        ].join("-");

        if (date_of_join > localToday) {
            setError("Date of joining cannot be in the future.");
            return;
        }

        if (!department_id) {
            setError("Department is required.");
            return;
        }

        if (editId === null && !password.trim()) {
            setError("Password is required.");
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const isEditing = editId !== null;
            const formData = new FormData();

            formData.append("emp_name", emp_name.trim());
            formData.append("email", email.trim());
            formData.append("phone", phone.trim());
            formData.append("department_id", department_id);
            formData.append("date_of_join", date_of_join);
            formData.append("employee_code", employee_code.trim());
            formData.append("status", status);


            if (password.trim()) {
                formData.append("password", password);
            }


            if (imageFile) {
                formData.append("image", imageFile);
            } else if (isEditing) {
                formData.append("existing_image", form.image || "");
            }

            // Axios request: no hardcoded API URL.
            const response = isEditing
                ? await API.put(
                    `/employees/${editId}`,
                    formData
                )
                : await API.post("/employees", formData);

            const result = response.data;

            if (result?.success === false) {
                throw new Error(
                    result.message || "Unable to save employee."
                );
            }

            if (isEditing) {
                setSuccess("Employee updated successfully.");
            } else {
                const newEmployeeId =
                    result?.data?.emp_id ??
                    result?.data?.Employee_ID ??
                    result?.emp_id ??
                    result?.Employee_ID;

                setSuccess(
                    newEmployeeId != null
                        ? `Employee created successfully. Employee ID: ${newEmployeeId}`
                        : "Employee created successfully."
                );
            }

            setIsModalOpen(false);
            setEditId(null);
            setForm({ ...EMPTY_FORM });
            setImagePreview("");
            setImageFile(null);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            await fetchEmployees();
        } catch (err) {
            setError(
                getErrorMessage(err, "Unable to save employee.")
            );
        } finally {
            setSaving(false);
        }
    };

    // =================================================
    // DELETE EMPLOYEE
    // =================================================

    const handleDelete = async (employee) => {
        const confirmed = window.confirm(
            `Delete "${employee.emp_name}"?`
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");

        try {
            const response = await API.delete(
                `/employees/${employee.emp_id}`
            );

            const result = response.data;

            if (result?.success === false) {
                throw new Error(
                    result.message || "Unable to delete employee."
                );
            }

            setSuccess("Employee deleted successfully.");

            await fetchEmployees();
        } catch (err) {
            setError(
                getErrorMessage(err, "Unable to delete employee.")
            );
        }
    };

    // =================================================
    // SEARCH FILTER
    // =================================================

    const filtered = employees.filter((employee) => {
        const q = search.toLowerCase().trim();

        return (
            String(employee.emp_name || "")
                .toLowerCase()
                .includes(q) ||
            String(employee.email || "")
                .toLowerCase()
                .includes(q) ||
            String(employee.employee_code || "")
                .toLowerCase()
                .includes(q) ||
            String(employee.emp_id ?? "").includes(q)
        );
    });

    // =================================================
    // PAGINATION
    // =================================================

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
    // JSX
    // =================================================

    return (
        <AdminLayout>
            <div className="admin-page">
                {/* HEADER */}
                <div className="admin-page-header">
                    <div className="admin-page-heading">
                        <div className="admin-page-heading-icon">
                            <Users size={25} />
                        </div>

                        <div>
                            <h1>Employees</h1>
                            <p>
                                Manage your organization's employees
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="admin-add-btn"
                        onClick={openAddModal}
                    >
                        <Plus size={19} />
                        Add Employee
                    </button>
                </div>

                {/* SUCCESS */}
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

                {/* ERROR */}
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
                            <h2>Employee List</h2>
                            <p>
                                View, edit, and manage employees
                            </p>
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
                            {filtered.length} employee
                            {filtered.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    {/* TABLE */}
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Emp ID</th>
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
                                        <td
                                            colSpan="8"
                                            className="admin-table-empty"
                                        >
                                            <RefreshCw
                                                size={22}
                                                className="admin-spinning"
                                            />
                                            <p>Loading employees...</p>
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="8"
                                            className="admin-table-empty"
                                        >
                                            <Users size={32} />

                                            <h3>
                                                {search
                                                    ? "No employees found"
                                                    : "No employees added yet"}
                                            </h3>

                                            <p>
                                                {search
                                                    ? "Try a different search."
                                                    : "Click Add Employee to get started."}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((employee) => (
                                        <tr key={employee.emp_id}>
                                            <td>
                                                <span className="admin-table-id">
                                                    {employee.emp_id}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="admin-table-id">
                                                    {employee.employee_code || "—"}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="admin-table-name-cell">
                                                    {employee.image ? (
                                                        <img
                                                            src={getImageUrl(employee.image)}
                                                            alt={employee.emp_name || "Employee"}
                                                            className="emp-avatar"
                                                        />
                                                    ) : (
                                                        <div className="admin-table-row-icon emp-avatar-fallback">
                                                            <Users size={16} />
                                                        </div>
                                                    )}

                                                    <div>
                                                        {employee.emp_name}
                                                    </div>
                                                </div>
                                            </td>

                                            <td>{employee.email || "—"}</td>
                                            <td>{employee.phone || "—"}</td>

                                            <td>
                                                {employee.department_name || "—"}
                                            </td>

                                            <td>
                                                <span
                                                    className={`admin-status-badge admin-status-${String(
                                                        employee.status || "inactive"
                                                    ).toLowerCase()}`}
                                                >
                                                    {employee.status || "inactive"}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="admin-actions">
                                                    <button
                                                        type="button"
                                                        className="admin-view-btn"
                                                        onClick={() =>
                                                            openViewModal(employee)
                                                        }
                                                    >
                                                        <Eye size={16} />
                                                        <span>View</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="admin-edit-btn"
                                                        onClick={() =>
                                                            openEditModal(employee)
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
                                                            handleDelete(employee)
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
                                        setCurrentPage((p) =>
                                            Math.max(1, p - 1)
                                        )
                                    }
                                    disabled={currentPage === 1}
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                {Array.from(
                                    { length: totalPages },
                                    (_, i) => i + 1
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
                                        setCurrentPage((p) =>
                                            Math.min(totalPages, p + 1)
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
                        Showing {paginated.length} of {filtered.length} employees
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
                            aria-labelledby="employee-modal-title"
                        >
                            <div className="admin-modal-header">
                                <div className="admin-modal-title">
                                    <div className="admin-modal-icon">
                                        <Users size={23} />
                                    </div>

                                    <div>
                                        <h2 id="employee-modal-title">
                                            {editId !== null
                                                ? "Edit Employee"
                                                : "Add Employee"}
                                        </h2>

                                        <p>
                                            {editId !== null
                                                ? "Update employee information."
                                                : "Enter employee details."}
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
                                        {/* NAME */}
                                        <div className="admin-field">
                                            <label>
                                                Employee Name <span>*</span>
                                            </label>

                                            <input
                                                type="text"
                                                name="emp_name"
                                                placeholder="e.g. John Doe"
                                                value={form.emp_name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        {/* EMPLOYEE CODE */}
                                        <div className="admin-field">
                                            <label>
                                                Employee Code <span>*</span>
                                            </label>

                                            <input
                                                type="text"
                                                name="employee_code"
                                                placeholder="e.g. EMP001"
                                                value={form.employee_code}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        {/* EMAIL */}
                                        <div className="admin-field">
                                            <label>
                                                Email <span>*</span>
                                            </label>

                                            <input
                                                type="email"
                                                name="email"
                                                placeholder="e.g. john@example.com"
                                                value={form.email}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        {/* PHONE */}
                                        <div className="admin-field">
                                            <label>
                                                Phone <span>*</span>
                                            </label>

                                            <input
                                                {...phoneInputProps}
                                                name="phone"
                                                placeholder="e.g. 9876543210"
                                                value={form.phone}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        {/* PASSWORD */}
                                        <div className="admin-field">
                                            <label>
                                                Password{" "}
                                                {editId === null && <span>*</span>}
                                            </label>

                                            <input
                                                type="password"
                                                name="password"
                                                autoComplete="new-password"
                                                placeholder={
                                                    editId !== null
                                                        ? "Leave blank to keep current password"
                                                        : "Enter password"
                                                }
                                                value={form.password}
                                                onChange={handleChange}
                                                required={editId === null}
                                            />
                                        </div>

                                        {/* DATE */}
                                        <div className="admin-field">
                                            <label>
                                                Date of Joining <span>*</span>
                                            </label>

                                            <input
                                                type="date"
                                                name="date_of_join"
                                                max={(() => {
                                                    const today = new Date();
                                                    return [
                                                        today.getFullYear(),
                                                        String(today.getMonth() + 1).padStart(2, "0"),
                                                        String(today.getDate()).padStart(2, "0"),
                                                    ].join("-");
                                                })()}
                                                value={form.date_of_join}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        {/* DEPARTMENT */}
                                        <div className="admin-field">
                                            <label>
                                                Department <span>*</span>
                                            </label>

                                            <select
                                                name="department_id"
                                                value={form.department_id}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">
                                                    -- Select Department --
                                                </option>

                                                {departments.map((department) => (
                                                    <option
                                                        key={department.department_id}
                                                        value={department.department_id}
                                                    >
                                                        {department.department_name}
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
                                                required
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>

                                        {/* IMAGE */}
                                        <div className="admin-field admin-field-full">
                                            <label>Profile Image</label>

                                            <div className="emp-upload-box">
                                                {imagePreview ? (
                                                    <div className="emp-upload-preview">
                                                        <img
                                                            src={imagePreview}
                                                            alt="Employee preview"
                                                            className="emp-preview-img"
                                                        />

                                                        <button
                                                            type="button"
                                                            className="emp-remove-img"
                                                            onClick={removeImage}
                                                            aria-label="Remove image"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label
                                                        className="emp-upload-label"
                                                        htmlFor="emp-image-input"
                                                    >
                                                        <Upload size={22} />

                                                        <span>
                                                            Click to upload image
                                                        </span>

                                                        <small>
                                                            JPG, PNG, WEBP (max 2MB)
                                                        </small>
                                                    </label>
                                                )}

                                                <input
                                                    id="emp-image-input"
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                                    ref={fileInputRef}
                                                    onChange={handleImageChange}
                                                    style={{ display: "none" }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* MODAL FOOTER */}
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
                                                    ? "Update Employee"
                                                    : "Save Employee"}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* VIEW MODAL */}
                {viewEmployee && (
                    <div
                        className="admin-modal-overlay"
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) {
                                setViewEmployee(null);
                            }
                        }}
                    >
                        <div
                            className="admin-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="employee-view-title"
                        >
                            <div className="admin-modal-header">
                                <div className="admin-modal-title">
                                    <div className="admin-modal-icon">
                                        <Users size={23} />
                                    </div>

                                    <div>
                                        <h2 id="employee-view-title">
                                            View Employee
                                        </h2>

                                        <p>
                                            Employee details (read-only)
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="admin-modal-close"
                                    onClick={() => setViewEmployee(null)}
                                    aria-label="Close employee details"
                                >
                                    <X size={21} />
                                </button>
                            </div>

                            <div className="admin-modal-body">
                                {viewEmployee.image && (
                                    <div className="emp-view-avatar-wrap">
                                        <img
                                            src={getImageUrl(viewEmployee.image)}
                                            alt={viewEmployee.emp_name || "Employee"}
                                            className="emp-view-avatar"
                                        />
                                    </div>
                                )}

                                <div className="admin-form-grid">
                                    {[
                                        {
                                            label: "Employee ID",
                                            value: viewEmployee.emp_id,
                                        },
                                        {
                                            label: "Employee Code",
                                            value: viewEmployee.employee_code,
                                        },
                                        {
                                            label: "Name",
                                            value: viewEmployee.emp_name,
                                        },
                                        {
                                            label: "Email",
                                            value: viewEmployee.email,
                                        },
                                        {
                                            label: "Phone",
                                            value: viewEmployee.phone,
                                        },
                                        {
                                            label: "Department",
                                            value: viewEmployee.department_name || "—",
                                        },
                                        {
                                            label: "Date of Join",
                                            value: viewEmployee.date_of_join
                                                ? String(viewEmployee.date_of_join).split("T")[0]
                                                : "—",
                                        },
                                        {
                                            label: "Status",
                                            value: viewEmployee.status,
                                        },
                                        {
                                            label: "Created At",
                                            value: viewEmployee.created_at
                                                ? new Date(viewEmployee.created_at).toLocaleString()
                                                : "—",
                                        },
                                        {
                                            label: "Updated At",
                                            value: viewEmployee.updated_at
                                                ? new Date(viewEmployee.updated_at).toLocaleString()
                                                : "—",
                                        },
                                    ].map(({ label, value }) => (
                                        <div className="admin-field" key={label}>
                                            <label>{label}</label>

                                            <input
                                                type="text"
                                                value={value ?? ""}
                                                readOnly
                                                className="admin-readonly"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="admin-modal-footer">
                                <button
                                    type="button"
                                    className="admin-cancel-btn"
                                    onClick={() => setViewEmployee(null)}
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

export default Employee;
