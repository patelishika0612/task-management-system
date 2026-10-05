import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    User,
    Phone,
    Mail,
    CalendarDays,
    IdCard,
    Building2,
    BriefcaseBusiness,
    FileText,
    ShieldCheck,
    Send,
    X,
    Info
} from "lucide-react";

import Swal from "sweetalert2";
import "./AdminApprovalRequest.css";

const API_BASE_URL = "http://localhost:5000/api";

  const Field = ({
        id,
        label,
        required,
        error,
        children
    }) => (
        <div className="apr-field">
            <label htmlFor={id}>
                {label}
                {required && <span> *</span>}
            </label>

            {children}

            {error && (
                <small className="apr-error">
                    {error}
                </small>
            )}
        </div>
    );
    
const AdminApprovalRequest = () => {
    const navigate = useNavigate();

    // =====================================================
    // FORM DATA
    // =====================================================

    const [formData, setFormData] = useState({
        fullName: "",
        phoneNumber: "",
        emailAddress: "",
        dateOfBirth: "",
        employeeCode: "",
        department: "",
        joiningDate: "",
        reason: ""
    });

    // =====================================================
    // STATES
    // =====================================================

    const [errors, setErrors] = useState({});
    const [departments, setDepartments] = useState([]);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submittedRequestId, setSubmittedRequestId] = useState(null);

    // =====================================================
    // LOAD DEPARTMENTS
    // =====================================================

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            setLoadingDepartments(true);

            const response = await fetch(
                `${API_BASE_URL}/admin-access-requests/departments`
            );

            const data = await response.json();

            console.log("Departments API response:", data);

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Failed to fetch departments"
                );
            }

            setDepartments(data.data || []);
        } catch (error) {
            console.error("Fetch departments error:", error);

            Swal.fire({
                icon: "error",
                title: "Unable to Load Departments",
                text:
                    error.message ||
                    "Something went wrong while loading departments.",
                confirmButtonColor: "#2f3387"
            });
        } finally {
            setLoadingDepartments(false);
        }
    };

    // =====================================================
    // HANDLE INPUT
    // =====================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    // =====================================================
    // PHONE CHANGE
    // =====================================================

    const handlePhoneChange = (e) => {
        const value = e.target.value
            .replace(/\D/g, "")
            .slice(0, 10);

        setFormData((prev) => ({
            ...prev,
            phoneNumber: value
        }));

        if (errors.phoneNumber) {
            setErrors((prev) => ({
                ...prev,
                phoneNumber: ""
            }));
        }
    };

    // =====================================================
    // VALIDATE FORM
    // =====================================================

    const validateForm = () => {
        const newErrors = {};

        const {
            fullName,
            phoneNumber,
            emailAddress,
            employeeCode,
            reason,
            dateOfBirth,
            joiningDate,
            department
        } = formData;

        // Full Name
        if (!fullName.trim()) {
            newErrors.fullName = "Full name is required.";
        } else if (fullName.trim().length < 3) {
            newErrors.fullName =
                "Full name must be at least 3 characters.";
        }

        // Phone
        if (!phoneNumber.trim()) {
            newErrors.phoneNumber =
                "Phone number is required.";
        } else if (!/^[0-9]{10}$/.test(phoneNumber.trim())) {
            newErrors.phoneNumber =
                "Enter a valid 10-digit phone number.";
        }

        // Email
        if (!emailAddress.trim()) {
            newErrors.emailAddress =
                "Email address is required.";
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                emailAddress.trim()
            )
        ) {
            newErrors.emailAddress =
                "Enter a valid email address.";
        }

        // Employee Code
        if (!employeeCode.trim()) {
            newErrors.employeeCode =
                "Employee Code is required.";
        } else if (employeeCode.trim().length > 50) {
            newErrors.employeeCode =
                "Employee Code cannot exceed 50 characters.";
        }

        // Department
        if (!department) {
            newErrors.department =
                "Please select a department.";
        }

        // Reason
        if (!reason.trim()) {
            newErrors.reason =
                "Please provide a reason for admin access.";
        } else if (reason.trim().length < 10) {
            newErrors.reason =
                "Reason must be at least 10 characters.";
        }

        // DOB
        if (dateOfBirth) {
            const dob = new Date(`${dateOfBirth}T00:00:00`);
            const today = new Date();

            today.setHours(0, 0, 0, 0);

            if (dob > today) {
                newErrors.dateOfBirth =
                    "Date of birth cannot be in the future.";
            }
        }

        // Joining Date
        if (!joiningDate) {
            newErrors.joiningDate =
                "Joining date is required.";
        } else {
            const jd = new Date(`${joiningDate}T00:00:00`);
            const today = new Date();

            today.setHours(0, 0, 0, 0);

            if (jd > today) {
                newErrors.joiningDate =
                    "Joining date cannot be in the future.";
            }
        }

        // DOB vs Joining Date
        if (dateOfBirth && joiningDate) {
            const dob = new Date(`${dateOfBirth}T00:00:00`);
            const jd = new Date(`${joiningDate}T00:00:00`);

            if (jd < dob) {
                newErrors.joiningDate =
                    "Joining date cannot be before date of birth.";
            }
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    // =====================================================
    // SUBMIT
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            Swal.fire({
                icon: "warning",
                title: "Check Your Details",
                text: "Please correct the highlighted fields.",
                confirmButtonColor: "#2f3387"
            });

            return;
        }

        try {
            setSubmitting(true);

            // =================================================
            // CREATE ACCESS REQUEST
            // =================================================

            const payload = {
                employee_code: formData.employeeCode.trim(),

                Full_Name: formData.fullName.trim(),

                Email: formData.emailAddress
                    .trim()
                    .toLowerCase(),

                Phone: formData.phoneNumber.trim(),

                DOB: formData.dateOfBirth || null,

                Department_ID: Number(formData.department),

                Joining_Date: formData.joiningDate,

                Reason: formData.reason.trim()
            };

            console.log(
                "Admin access request payload:",
                payload
            );

            const response = await fetch(
                `${API_BASE_URL}/admin-access-requests`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(payload)
                }
            );

            const data = await response.json();

            console.log(
                "Admin access request response:",
                data
            );

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Failed to submit admin access request."
                );
            }

            // =================================================
            // GET REQUEST ID
            // =================================================

            const requestId =
                data.data?.Request_ID ||
                data.data?.request_id ||
                data.Request_ID ||
                data.request_id;

            if (!requestId) {
                throw new Error(
                    "Request ID was not returned by the server."
                );
            }

            // =================================================
            // CREATE APPROVAL REQUEST
            // =================================================

            const approvalResponse = await fetch(
                `${API_BASE_URL}/admin-approval-requests`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        Request_ID: requestId
                    })
                }
            );

            const approvalData =
                await approvalResponse.json();

            console.log(
                "Approval response:",
                approvalData
            );

            if (
                !approvalResponse.ok ||
                !approvalData.success
            ) {
                throw new Error(
                    approvalData.message ||
                    "Request was created, but approval email could not be sent."
                );
            }

            // =================================================
            // SUCCESS
            // =================================================

            // =================================================
            // SUCCESS
            // =================================================

            setSubmittedRequestId(requestId);
            setSubmitted(true);

            // Clear form
            setFormData({
                fullName: "",
                phoneNumber: "",
                emailAddress: "",
                dateOfBirth: "",
                employeeCode: "",
                department: "",
                joiningDate: "",
                reason: ""
            });

            setErrors({});
        } catch (error) {
            console.error(
                "Submit admin access request error:",
                error
            );

            Swal.fire({
                icon: "error",
                title: "Submission Failed",
                text:
                    error.message ||
                    "Something went wrong while submitting the request.",
                confirmButtonColor: "#dc2626"
            });
        } finally {
            setSubmitting(false);
        }
    };

    // =====================================================
    // CANCEL
    // =====================================================

    const handleCancel = () => {
        const hasData = Object.values(formData).some(
            (value) =>
                typeof value === "string" &&
                value.trim() !== ""
        );

        if (!hasData) {
            navigate(-1);
            return;
        }

        Swal.fire({
            icon: "warning",
            title: "Discard Request?",
            text: "All entered information will be lost.",
            showCancelButton: true,
            confirmButtonText: "Yes, Discard",
            cancelButtonText: "Continue Editing",
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#2f3387"
        }).then((result) => {
            if (result.isConfirmed) {
                navigate(-1);
            }
        });
    };

    // =====================================================
    // FIELD COMPONENT
    // =====================================================

  

    // =====================================================
    // JSX
    // =====================================================

    return (
        <div className="apr-page">
            <div className="apr-body">
                <div className="apr-box">

                    {/* HEADER */}
                    <div className="apr-box-header">
                        <div className="apr-box-header-icon">
                            <ShieldCheck size={26} />
                        </div>

                        <div>
                            <h1>Request Admin Access</h1>

                            <p>
                                Submit your details to request
                                administrator access to the
                                Task Management System.
                            </p>
                        </div>
                    </div>

                    {/* NOTICE */}
                    <div className="apr-notice">
                        <Info size={17} />

                        <p>
                            Your request will be reviewed by
                            an authorized approver. You will
                            be notified after approval.
                        </p>
                    </div>

                    {/* FORM */}
                    <form
                        onSubmit={handleSubmit}
                        noValidate
                    >

                        {/* PERSONAL INFORMATION */}
                        <div className="apr-section">

                            <div className="apr-section-label">
                                <User size={14} />
                                Personal Information
                            </div>

                            <div className="apr-grid">

                                {/* FULL NAME */}
                                <Field
                                    id="fullName"
                                    label="Full Name"
                                    required
                                    error={errors.fullName}
                                >
                                    <div
                                        className={`apr-input ${errors.fullName
                                                ? "apr-input-error"
                                                : ""
                                            }`}
                                    >
                                        <User size={15} />

                                        <input
                                            id="fullName"
                                            type="text"
                                            name="fullName"
                                            value={
                                                formData.fullName
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter full name"
                                        />
                                    </div>
                                </Field>

                                {/* PHONE */}
                                <Field
                                    id="phoneNumber"
                                    label="Phone Number"
                                    required
                                    error={
                                        errors.phoneNumber
                                    }
                                >
                                    <div
                                        className={`apr-input ${errors.phoneNumber
                                                ? "apr-input-error"
                                                : ""
                                            }`}
                                    >
                                        <Phone size={15} />

                                        <input
                                            id="phoneNumber"
                                            type="tel"
                                            name="phoneNumber"
                                            value={
                                                formData.phoneNumber
                                            }
                                            inputMode="numeric"
                                            onChange={
                                                handlePhoneChange
                                            }
                                            placeholder="10-digit phone number"
                                        />
                                    </div>
                                </Field>

                                {/* EMAIL */}
                                <Field
                                    id="emailAddress"
                                    label="Email Address"
                                    required
                                    error={
                                        errors.emailAddress
                                    }
                                >
                                    <div
                                        className={`apr-input ${errors.emailAddress
                                                ? "apr-input-error"
                                                : ""
                                            }`}
                                    >
                                        <Mail size={15} />

                                        <input
                                            id="emailAddress"
                                            type="email"
                                            name="emailAddress"
                                            value={
                                                formData.emailAddress
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter email address"
                                        />
                                    </div>
                                </Field>

                                {/* DOB */}
                                <Field
                                    id="dateOfBirth"
                                    label="Date of Birth"
                                    error={
                                        errors.dateOfBirth
                                    }
                                >
                                    <div
                                        className={`apr-input ${errors.dateOfBirth
                                                ? "apr-input-error"
                                                : ""
                                            }`}
                                    >
                                        <CalendarDays
                                            size={15}
                                        />

                                        <input
                                            id="dateOfBirth"
                                            type="date"
                                            name="dateOfBirth"
                                            value={
                                                formData.dateOfBirth
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />
                                    </div>
                                </Field>

                            </div>
                        </div>

                        {/* EMPLOYMENT DETAILS */}
                        <div className="apr-section">

                            <div className="apr-section-label">
                                <BriefcaseBusiness size={14} />
                                Employment Details
                            </div>

                            <div className="apr-grid">

                                {/* EMPLOYEE CODE */}
                                <Field
                                    id="employeeCode"
                                    label="Employee Code"
                                    required
                                    error={
                                        errors.employeeCode
                                    }
                                >
                                    <div
                                        className={`apr-input ${errors.employeeCode
                                                ? "apr-input-error"
                                                : ""
                                            }`}
                                    >
                                        <IdCard size={15} />

                                        <input
                                            id="employeeCode"
                                            type="text"
                                            name="employeeCode"
                                            value={
                                                formData.employeeCode
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter Employee Code"
                                            maxLength={50}
                                        />
                                    </div>

                                    <small className="apr-help-text">
                                        Enter your Employee Code.
                                        New employees can use a
                                        new code.
                                    </small>
                                </Field>

                                {/* DEPARTMENT */}
                                <Field
                                    id="department"
                                    label="Department"
                                    required
                                    error={
                                        errors.department
                                    }
                                >
                                    <div
                                        className={`apr-input ${errors.department
                                                ? "apr-input-error"
                                                : ""
                                            }`}
                                    >
                                        <Building2 size={15} />

                                        <select
                                            id="department"
                                            name="department"
                                            value={
                                                formData.department
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={
                                                loadingDepartments
                                            }
                                        >
                                            <option value="">
                                                {loadingDepartments
                                                    ? "Loading Departments..."
                                                    : "Select Department"}
                                            </option>

                                            {departments.map(
                                                (department) => (
                                                    <option
                                                        key={
                                                            department.department_id
                                                        }
                                                        value={
                                                            department.department_id
                                                        }
                                                    >
                                                        {
                                                            department.department_name
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>
                                </Field>

                                {/* JOINING DATE */}
                                <Field
                                    id="joiningDate"
                                    label="Joining Date"
                                    required
                                    error={
                                        errors.joiningDate
                                    }
                                >
                                    <div
                                        className={`apr-input ${errors.joiningDate
                                                ? "apr-input-error"
                                                : ""
                                            }`}
                                    >
                                        <CalendarDays
                                            size={15}
                                        />

                                        <input
                                            id="joiningDate"
                                            type="date"
                                            name="joiningDate"
                                            value={
                                                formData.joiningDate
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />
                                    </div>
                                </Field>

                            </div>
                        </div>

                        {/* REASON */}
                        <div className="apr-section apr-section-last">

                            <div className="apr-section-label">
                                <FileText size={14} />
                                Reason for Access
                            </div>

                            <Field
                                id="reason"
                                label="Why do you need admin access?"
                                required
                                error={errors.reason}
                            >
                                <div
                                    className={`apr-textarea ${errors.reason
                                            ? "apr-input-error"
                                            : ""
                                        }`}
                                >
                                    <FileText size={15} />

                                    <textarea
                                        id="reason"
                                        name="reason"
                                        value={
                                            formData.reason
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Explain why you need administrator access..."
                                        rows={4}
                                        maxLength={500}
                                    />
                                </div>

                                <div className="apr-char-count">
                                    {formData.reason.length}/500
                                </div>
                            </Field>

                        </div>

                        {/* ACTIONS */}
                        <div className="apr-actions">

                            <button
                                type="button"
                                className="apr-cancel-btn"
                                onClick={handleCancel}
                                disabled={submitting}
                            >
                                <X size={15} />
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="apr-submit-btn"
                                disabled={
                                    submitting ||
                                    loadingDepartments
                                }
                            >
                                <Send size={15} />

                                {submitting
                                    ? "Submitting..."
                                    : "Send Approval Request"}
                            </button>

                        </div>

                    </form>
{submitted && (
    <div className="apr-success-message">
        <ShieldCheck size={20} />

        <div>
            <h3>Request Submitted Successfully!</h3>

            <p>
                Your admin access request has been submitted successfully.
            </p>

            <p>
                Please wait. You will receive an update on your
                registered email once your request is reviewed.
            </p>

            {submittedRequestId && (
                <p>
                    <strong>Request ID:</strong> {submittedRequestId}
                </p>
            )}
        </div>
    </div>
)}
                    {/* FOOTER */}
                    <div className="apr-footer-note">
                        <ShieldCheck size={14} />

                        <span>
                            Your information will be reviewed
                            only by an authorized company approver.
                        </span>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminApprovalRequest;