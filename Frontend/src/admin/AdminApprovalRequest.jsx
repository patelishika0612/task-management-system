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
    MapPin,
    FileText,
    ShieldCheck,
    Send,
    X,
    KeyRound,
    BadgeCheck,
    CheckCircle2,
} from "lucide-react";

import Swal from "sweetalert2";

import "./AdminApprovalRequest.css";

const API_BASE_URL = "http://localhost:5000/api";

// =====================================================
// FIELD COMPONENT
// =====================================================

const Field = ({
    id,
    label,
    required,
    error,
    children,
}) => {
    return (
        <div className="apr-field">
            <label htmlFor={id}>
                {label}
                {required && (
                    <span className="apr-required"> *</span>
                )}
            </label>

            {children}

            {error && (
                <small className="apr-error">
                    {error}
                </small>
            )}
        </div>
    );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

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
        designation: "",
        location: "",
        joiningDate: "",
        reason: "",
    });

    // =====================================================
    // STATES
    // =====================================================

    const [errors, setErrors] = useState({});
    const [departments, setDepartments] = useState([]);
    const [loadingDepartments, setLoadingDepartments] =
        useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submittedRequestId, setSubmittedRequestId] =
        useState(null);

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

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                        "Failed to fetch departments"
                );
            }

            setDepartments(data.data || []);
        } catch (error) {
            console.error(
                "Fetch departments error:",
                error
            );

            Swal.fire({
                icon: "error",
                title: "Unable to Load Departments",
                text:
                    error.message ||
                    "Something went wrong while loading departments.",
                confirmButtonColor: "#3155f5",
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
            [name]: value,
        }));

        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
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
            phoneNumber: value,
        }));

        if (errors.phoneNumber) {
            setErrors((prev) => ({
                ...prev,
                phoneNumber: "",
            }));
        }
    };

    // =====================================================
    // VALIDATE
    // =====================================================

    const validateForm = () => {
        const newErrors = {};

        const {
            fullName,
            phoneNumber,
            emailAddress,
            employeeCode,
            department,
            designation,
            location,
            reason,
            dateOfBirth,
            joiningDate,
        } = formData;

        // FULL NAME
        if (!fullName.trim()) {
            newErrors.fullName =
                "Full name is required.";
        } else if (fullName.trim().length < 3) {
            newErrors.fullName =
                "Full name must be at least 3 characters.";
        }

        // PHONE
        if (!phoneNumber.trim()) {
            newErrors.phoneNumber =
                "Phone number is required.";
        } else if (
            !/^[0-9]{10}$/.test(phoneNumber.trim())
        ) {
            newErrors.phoneNumber =
                "Enter a valid 10-digit phone number.";
        }

        // EMAIL
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

        // EMPLOYEE ID
        if (!employeeCode.trim()) {
            newErrors.employeeCode =
                "Employee ID is required.";
        } else if (
            employeeCode.trim().length > 50
        ) {
            newErrors.employeeCode =
                "Employee ID cannot exceed 50 characters.";
        }

        // DEPARTMENT
        if (!department) {
            newErrors.department =
                "Please select a department.";
        }

        // DESIGNATION
        if (!designation.trim()) {
            newErrors.designation =
                "Designation is required.";
        }

        // LOCATION
        if (!location.trim()) {
            newErrors.location =
                "Location is required.";
        }

        // REASON
        if (!reason.trim()) {
            newErrors.reason =
                "Please provide a reason for admin access.";
        } else if (reason.trim().length < 10) {
            newErrors.reason =
                "Reason must be at least 10 characters.";
        }

        // DOB
        if (dateOfBirth) {
            const dob = new Date(
                `${dateOfBirth}T00:00:00`
            );

            const today = new Date();

            today.setHours(0, 0, 0, 0);

            if (dob > today) {
                newErrors.dateOfBirth =
                    "Date of birth cannot be in the future.";
            }
        }

        // JOINING DATE
        if (!joiningDate) {
            newErrors.joiningDate =
                "Joining date is required.";
        } else {
            const jd = new Date(
                `${joiningDate}T00:00:00`
            );

            const today = new Date();

            today.setHours(0, 0, 0, 0);

            if (jd > today) {
                newErrors.joiningDate =
                    "Joining date cannot be in the future.";
            }
        }

        // DOB VS JOINING DATE
        if (dateOfBirth && joiningDate) {
            const dob = new Date(
                `${dateOfBirth}T00:00:00`
            );

            const jd = new Date(
                `${joiningDate}T00:00:00`
            );

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
                confirmButtonColor: "#3155f5",
            });

            return;
        }

        try {
            setSubmitting(true);

            // =================================================
            // IMPORTANT:
            // ALL FORM FIELDS ARE SENT HERE
            // =================================================

            const payload = {
                employee_code:
                    formData.employeeCode.trim(),

                Full_Name:
                    formData.fullName.trim(),

                Email:
                    formData.emailAddress
                        .trim()
                        .toLowerCase(),

                Phone:
                    formData.phoneNumber.trim(),

                DOB:
                    formData.dateOfBirth || null,

                Department_ID:
                    Number(formData.department),

                // NEW
                Designation:
                    formData.designation.trim(),

                // NEW
                Location:
                    formData.location.trim(),

                Joining_Date:
                    formData.joiningDate,

                Reason:
                    formData.reason.trim(),
            };

            console.log(
                "ADMIN ACCESS REQUEST PAYLOAD:",
                payload
            );

            // =================================================
            // CREATE ACCESS REQUEST
            // =================================================

            const response = await fetch(
                `${API_BASE_URL}/admin-access-requests`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();

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
                data.data?.RequestId ||
                data.data?.requestId ||
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
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        Request_ID: requestId,
                    }),
                }
            );

            const approvalData =
                await approvalResponse.json();

            if (
                !approvalResponse.ok ||
                !approvalData.success
            ) {
                throw new Error(
                    approvalData.message ||
                        "Request was created, but approval process could not be started."
                );
            }

            // =================================================
            // SAVE REQUEST DATA
            // =================================================

            sessionStorage.setItem(
                "accessRequest",
                JSON.stringify({
                    email:
                        formData.emailAddress.trim(),
                    fullName:
                        formData.fullName.trim(),
                    phone:
                        formData.phoneNumber.trim(),
                    employeeId:
                        formData.employeeCode.trim(),
                    department:
                        formData.department,
                    designation:
                        formData.designation.trim(),
                    location:
                        formData.location.trim(),
                    requestId:
                        requestId,
                })
            );

            // =================================================
            // SUCCESS
            // =================================================

            setSubmittedRequestId(requestId);
            setSubmitted(true);

            setFormData({
                fullName: "",
                phoneNumber: "",
                emailAddress: "",
                dateOfBirth: "",
                employeeCode: "",
                department: "",
                designation: "",
                location: "",
                joiningDate: "",
                reason: "",
            });

            setErrors({});

            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
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
                confirmButtonColor: "#dc2626",
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
            cancelButtonColor: "#3155f5",
        }).then((result) => {
            if (result.isConfirmed) {
                navigate(-1);
            }
        });
    };

    // =====================================================
    // INPUT CLASS
    // =====================================================

    const inputClass = (field) =>
        `apr-input ${
            errors[field] ? "apr-input-error" : ""
        }`;

    // =====================================================
    // JSX
    // =====================================================

    return (
        <div className="apr-page">

            <div className="apr-body">

                {/* TOP STEP */}

                <div className="apr-top-step">
                    <span className="apr-top-step-number">
                        1
                    </span>

                    <span>
                        Step 1 of 4
                    </span>
                </div>

                {/* HEADING */}

                <div className="apr-page-heading">

                    <h1>
                        Request Account Access
                    </h1>

                    <p>
                        Fill in your basic information below.
                        Your request will be sent to the
                        authorized person for approval.
                    </p>

                </div>

                {/* PROCESS */}

                <div className="arv-process">

                    <div className="arv-process-step arv-active">

                        <div className="arv-step-number">
                            <CheckCircle2 size={17} />
                        </div>

                        <div>
                            <span>01</span>
                            <strong>
                                Request Submitted
                            </strong>
                        </div>

                    </div>

                    <div className="arv-process-line active"></div>

                    <div className="arv-process-step">

                        <div className="arv-step-number">
                            <FileText size={17} />
                        </div>

                        <div>
                            <span>02</span>
                            <strong>
                                Review Request
                            </strong>
                        </div>

                    </div>

                    <div className="arv-process-line"></div>

                    <div className="arv-process-step">

                        <div className="arv-step-number">
                            <KeyRound size={17} />
                        </div>

                        <div>
                            <span>03</span>
                            <strong>
                                Create Password
                            </strong>
                        </div>

                    </div>

                    <div className="arv-process-line"></div>

                    <div className="arv-process-step">

                        <div className="arv-step-number">
                            <BadgeCheck size={17} />
                        </div>

                        <div>
                            <span>04</span>
                            <strong>
                                Complete Profile
                            </strong>
                        </div>

                    </div>

                </div>

                {/* MAIN CARD */}

                <div className="apr-box">

                    {/* HEADER */}

                    <div className="apr-box-header">

                        <div className="apr-box-header-icon">
                            <FileText size={19} />
                        </div>

                        <div>

                            <h2>
                                Your Information
                            </h2>

                            <p>
                                Please provide accurate information.
                            </p>

                        </div>

                    </div>

                    <div className="apr-content">

                        {/* FORM */}

                        <div className="apr-form-area">

                            <form
                                onSubmit={handleSubmit}
                                noValidate
                            >

                                {/* PERSONAL */}

                                <div className="apr-section">

                                    <h3>
                                        Personal Details
                                    </h3>

                                    <div className="apr-grid">

                                        {/* FULL NAME */}

                                        <Field
                                            id="fullName"
                                            label="Full Name"
                                            required
                                            error={
                                                errors.fullName
                                            }
                                        >

                                            <div
                                                className={inputClass(
                                                    "fullName"
                                                )}
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
                                                    placeholder="Enter your full name"
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
                                                className={inputClass(
                                                    "emailAddress"
                                                )}
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
                                                    placeholder="name@company.com"
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
                                                className={inputClass(
                                                    "phoneNumber"
                                                )}
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
                                                    placeholder="Enter phone number"
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
                                                className={inputClass(
                                                    "dateOfBirth"
                                                )}
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

                                {/* WORK INFORMATION */}

                                <div className="apr-section">

                                    <h3>
                                        Work Information
                                    </h3>

                                    <div className="apr-grid">

                                        {/* EMPLOYEE ID */}

                                        <Field
                                            id="employeeCode"
                                            label="Employee ID"
                                            required
                                            error={
                                                errors.employeeCode
                                            }
                                        >

                                            <div
                                                className={inputClass(
                                                    "employeeCode"
                                                )}
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
                                                    placeholder="e.g. EMP001"
                                                    maxLength={50}
                                                />
                                            </div>

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
                                                className={inputClass(
                                                    "department"
                                                )}
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
                                                            ? "Loading departments..."
                                                            : "Select department"}
                                                    </option>

                                                    {departments.map(
                                                        (
                                                            department
                                                        ) => (
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

                                        {/* DESIGNATION */}

                                        <Field
                                            id="designation"
                                            label="Designation"
                                            required
                                            error={
                                                errors.designation
                                            }
                                        >

                                            <div
                                                className={inputClass(
                                                    "designation"
                                                )}
                                            >
                                                <BriefcaseBusiness
                                                    size={15}
                                                />

                                                <input
                                                    id="designation"
                                                    type="text"
                                                    name="designation"
                                                    value={
                                                        formData.designation
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="e.g. HR Manager"
                                                    maxLength={100}
                                                />
                                            </div>

                                        </Field>

                                        {/* LOCATION */}

                                        <Field
                                            id="location"
                                            label="Location"
                                            required
                                            error={
                                                errors.location
                                            }
                                        >

                                            <div
                                                className={inputClass(
                                                    "location"
                                                )}
                                            >
                                                <MapPin size={15} />

                                                <input
                                                    id="location"
                                                    type="text"
                                                    name="location"
                                                    value={
                                                        formData.location
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="e.g. Ahmedabad"
                                                    maxLength={150}
                                                />
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
                                                className={inputClass(
                                                    "joiningDate"
                                                )}
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

                                <div className="apr-section apr-reason-section">

                                    <h3>
                                        Request Details
                                    </h3>

                                    <Field
                                        id="reason"
                                        label="Reason for Admin Access"
                                        required
                                        error={
                                            errors.reason
                                        }
                                    >

                                        <div
                                            className={`apr-textarea ${
                                                errors.reason
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
                                            {
                                                formData.reason
                                                    .length
                                            }
                                            /500
                                        </div>

                                    </Field>

                                </div>

                                {/* BUTTONS */}

                                <div className="apr-actions">

                                    <button
                                        type="button"
                                        className="apr-cancel-btn"
                                        onClick={
                                            handleCancel
                                        }
                                        disabled={
                                            submitting
                                        }
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

                            {/* SUCCESS */}

                            {submitted && (
                                <div className="apr-success-message">

                                    <div className="apr-success-icon">
                                        <CheckCircle2
                                            size={20}
                                        />
                                    </div>

                                    <div>

                                        <h3>
                                            Request Submitted Successfully!
                                        </h3>

                                        <p>
                                            Your admin access request
                                            has been submitted successfully.
                                        </p>

                                        <p>
                                            Please wait. You will receive
                                            an update on your registered
                                            email once your request is reviewed.
                                        </p>

                                        {submittedRequestId && (
                                            <p>
                                                <strong>
                                                    Request ID:
                                                </strong>{" "}
                                                {
                                                    submittedRequestId
                                                }
                                            </p>
                                        )}

                                    </div>

                                </div>
                            )}

                        </div>

                        {/* RIGHT PANEL */}

                        <aside className="apr-next-panel">

                            <h3>
                                What happens next?
                            </h3>

                            <p className="apr-next-description">
                                You don't need to do anything else
                                right now. Simply submit this form
                                and follow the next steps.
                            </p>

                            <div className="apr-next-step">

                                <div className="apr-next-number">
                                    1
                                </div>

                                <div>
                                    <h4>
                                        Submit your request
                                    </h4>

                                    <p>
                                        Click the button below to
                                        send your information.
                                    </p>
                                </div>

                            </div>

                            <div className="apr-next-step">

                                <div className="apr-next-number">
                                    2
                                </div>

                                <div>
                                    <h4>
                                        Wait for approval
                                    </h4>

                                    <p>
                                        The authorized person will
                                        review your request.
                                    </p>
                                </div>

                            </div>

                            <div className="apr-next-step">

                                <div className="apr-next-number">
                                    3
                                </div>

                                <div>
                                    <h4>
                                        Check your email
                                    </h4>

                                    <p>
                                        If approved, you will receive
                                        a secure setup link.
                                    </p>
                                </div>

                            </div>

                            <div className="apr-next-step">

                                <div className="apr-next-number">
                                    4
                                </div>

                                <div>
                                    <h4>
                                        Complete setup
                                    </h4>

                                    <p>
                                        Create your password and
                                        complete your profile.
                                    </p>
                                </div>

                            </div>

                        </aside>

                    </div>

                    {/* FOOTER */}

                    <div className="apr-footer-note">

                        <ShieldCheck size={14} />

                        <span>
                            Your information will be reviewed only
                            by an authorized company approver.
                        </span>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default AdminApprovalRequest;