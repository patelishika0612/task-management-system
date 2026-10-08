
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Check,
    User,
    LockKeyhole,
    Upload,
    ArrowRight,
} from "lucide-react";
import API from "../api";
import Logo from "../img/nirvanza-logo.png";
import "./CompleteProfile.css";

const CreateProfile = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const emailFromLogin = searchParams.get("email") || "";

    const [employee, setEmployee] = useState(null);

    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    /*
    =====================================================
    GET EMPLOYEE DATA
    =====================================================
    */

    useEffect(() => {
        const fetchEmployee = async () => {
            if (!emailFromLogin) {
                setError("Employee email not found.");
                setLoading(false);
                return;
            }

            try {
                const response = await API.get(
                    `/employees/profile?email=${encodeURIComponent(
                        emailFromLogin
                    )}`
                );

                if (response.data.success) {
                    setEmployee(response.data.data);
                } else {
                    setError(
                        response.data.message ||
                            "Employee profile not found."
                    );
                }
            } catch (err) {
                console.error(
                    "Fetch employee profile error:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                        "Failed to load employee profile."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchEmployee();
    }, [emailFromLogin]);

    /*
    =====================================================
    IMAGE CHANGE
    =====================================================
    */

    const handleImageChange = (e) => {
        const selectedFile = e.target.files?.[0];

        if (!selectedFile) {
            return;
        }

        if (!selectedFile.type.startsWith("image/")) {
            setError("Please select a valid image file.");
            e.target.value = "";
            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) {
            setError("Image size must be less than 5 MB.");
            e.target.value = "";
            return;
        }

        setError("");
        setImage(selectedFile);

        const previewUrl = URL.createObjectURL(selectedFile);
        setImagePreview(previewUrl);
    };

    /*
    =====================================================
    SUBMIT PROFILE
    =====================================================
    */

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (!employee) {
            setError("Employee information not found.");
            return;
        }

        if (!image) {
            setError("Please select a profile image.");
            return;
        }

        try {
            setSubmitting(true);

            const formData = new FormData();

            formData.append("image", image);

            const response = await API.put(
                `/employees/create-profile/${employee.emp_id}`,
                formData
            );

            if (response.data.success) {
                setSuccess(true);

                setTimeout(() => {
                    navigate(
                        `/admin-login?email=${encodeURIComponent(
                            employee.email
                        )}`
                    );
                }, 1200);
            } else {
                setError(
                    response.data.message ||
                        "Failed to create profile."
                );
            }
        } catch (err) {
            console.error(
                "Create profile error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Failed to create profile."
            );
        } finally {
            setSubmitting(false);
        }
    };

    /*
    =====================================================
    DASHBOARD / LOGIN
    =====================================================
    */

    const handleLogin = () => {
        navigate(
            `/admin-login?email=${encodeURIComponent(
                employee?.email || emailFromLogin
            )}`
        );
    };

    /*
    =====================================================
    LOADING
    =====================================================
    */

    if (loading) {
        return (
            <div className="cp-profile-page-wrapper">
                <div className="cp-profile-loading">
                    <div className="cp-profile-loading-spinner"></div>
                    <span>Loading employee profile...</span>
                </div>
            </div>
        );
    }

    /*
    =====================================================
    EMPLOYEE NOT FOUND
    =====================================================
    */

    if (error && !employee) {
        return (
            <div className="cp-profile-page-wrapper">
                <div className="cp-profile-error-page">
                    <div className="cp-profile-error-icon">
                        !
                    </div>

                    <h2>Unable to load profile</h2>

                    <p>{error}</p>

                    <button
                        type="button"
                        onClick={() => navigate("/admin-login")}
                        className="cp-profile-error-button"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="cp-profile-page-wrapper">

            {/* =========================================
                HEADER
            ========================================= */}

            <header className="cp-profile-top-header">

                <img
                    src={Logo}
                    alt="Nirvanza Infotech"
                    className="cp-profile-logo"
                />

                <div className="cp-profile-header-status">
                    <span className="cp-profile-status-dot"></span>
                    Final account setup
                </div>

            </header>


            <main className="cp-profile-page">

                {/* =========================================
                    INTRO
                ========================================= */}

                <section className="cp-profile-intro">

                    <div>

                        <div className="cp-profile-step-label">

                            <span className="cp-profile-step-circle">
                                4
                            </span>

                            Step 4 of 4

                        </div>

                        <h1>
                            Complete your profile
                        </h1>

                        <p>
                            Your account is almost ready. Review
                            your employee information and upload
                            your profile photo to complete your
                            account.
                        </p>

                    </div>


                    <div className="cp-profile-completion-badge">

                        <Check size={14} />

                        Account information loaded

                    </div>

                </section>


                {/* =========================================
                    PROGRESS
                ========================================= */}

                <div className="cp-profile-progress-card">

                    <div className="cp-profile-progress-item completed">

                        <div className="cp-profile-progress-circle">
                            <Check size={12} />
                        </div>

                        Access Approved

                    </div>


                    <div className="cp-profile-progress-arrow">
                        <ArrowRight size={15} />
                    </div>


                    <div className="cp-profile-progress-item completed">

                        <div className="cp-profile-progress-circle">
                            <Check size={12} />
                        </div>

                        Password Created

                    </div>


                    <div className="cp-profile-progress-arrow">
                        <ArrowRight size={15} />
                    </div>


                    <div className="cp-profile-progress-item active">

                        <div className="cp-profile-progress-circle">
                            3
                        </div>

                        Complete Profile

                    </div>

                </div>


                {/* =========================================
                    PROFILE CARD
                ========================================= */}

                <section className="cp-profile-card">

                    {/* =====================================
                        LEFT SIDE
                    ====================================== */}

                    <aside className="cp-profile-side">

                        <div className="cp-profile-side-step">

                            <strong>
                                Almost there!
                            </strong>

                            <br />

                            Just complete your profile.

                        </div>


                        {/* PHOTO */}

                        <div className="cp-profile-photo-wrapper">

                            <div className="cp-profile-photo">

                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Profile"
                                    />
                                ) : (
                                    <User size={30} />
                                )}

                            </div>

                            <div className="cp-profile-photo-text">
                                Your profile photo
                            </div>

                        </div>


                        <h2>
                            Make your profile complete
                        </h2>


                        <p>
                            Your employee information has already
                            been provided by HR. Just add your
                            profile photo to finish the setup.
                        </p>


                        <div className="cp-profile-side-checklist">

                            <div className="cp-profile-check-item">

                                <div className="cp-profile-check">
                                    <Check size={11} />
                                </div>

                                Personal information

                            </div>


                            <div className="cp-profile-check-item">

                                <div className="cp-profile-check">
                                    <Check size={11} />
                                </div>

                                Employee details

                            </div>


                            <div className="cp-profile-check-item">

                                <div className="cp-profile-check">
                                    <Check size={11} />
                                </div>

                                Contact information

                            </div>


                            <div className="cp-profile-check-item">

                                <div className="cp-profile-check">
                                    <Check size={11} />
                                </div>

                                Profile photo

                            </div>

                        </div>

                    </aside>


                    {/* =====================================
                        FORM
                    ====================================== */}

                    <section className="cp-profile-form-area">

                        <div className="cp-profile-form-header">

                            <h2>
                                Your information
                            </h2>

                            <p>
                                The following information has been
                                provided by HR and cannot be edited.
                            </p>

                        </div>


                        <form onSubmit={handleSubmit}>

                            {/* =================================
                                PHOTO
                            ================================== */}

                            <div className="cp-profile-form-section">

                                <div className="cp-profile-section-title">

                                    <div className="cp-profile-section-number">
                                        1
                                    </div>

                                    Profile Photo

                                </div>


                                <div className="cp-profile-photo-upload">

                                    <div className="cp-profile-upload-preview">

                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                            />
                                        ) : (
                                            <User size={20} />
                                        )}

                                    </div>


                                    <div>

                                        <label
                                            htmlFor="cp-profile-photoInput"
                                            className="cp-profile-upload-button"
                                        >
                                            <Upload size={13} />

                                            Upload Photo
                                        </label>

                                        <input
                                            type="file"
                                            id="cp-profile-photoInput"
                                            accept="image/png,image/jpeg,image/jpg,image/webp"
                                            onChange={handleImageChange}
                                        />

                                        <div className="cp-profile-upload-info">
                                            JPG, PNG or WebP · Maximum 5 MB
                                        </div>

                                    </div>

                                </div>

                            </div>


                            {/* =================================
                                PERSONAL INFORMATION
                            ================================== */}

                            <div className="cp-profile-form-section">

                                <div className="cp-profile-section-title">

                                    <div className="cp-profile-section-number">
                                        2
                                    </div>

                                    Personal Information

                                </div>


                                <div className="cp-profile-form-grid">

                                    {/* FULL NAME */}

                                    <div className="cp-profile-form-group">

                                        <label className="cp-profile-form-label">
                                            Full Name
                                        </label>

                                        <input
                                            type="text"
                                            className="cp-profile-input"
                                            value={
                                                employee?.emp_name || ""
                                            }
                                            disabled
                                            readOnly
                                        />

                                    </div>


                                    {/* EMAIL */}

                                    <div className="cp-profile-form-group">

                                        <label className="cp-profile-form-label">
                                            Email Address
                                        </label>

                                        <input
                                            type="email"
                                            className="cp-profile-input"
                                            value={
                                                employee?.email || ""
                                            }
                                            disabled
                                            readOnly
                                        />

                                        <div className="cp-profile-field-note">
                                            Your registered employee email
                                        </div>

                                    </div>


                                    {/* PHONE */}

                                    <div className="cp-profile-form-group">

                                        <label className="cp-profile-form-label">
                                            Phone Number
                                        </label>

                                        <input
                                            type="tel"
                                            className="cp-profile-input"
                                            value={
                                                employee?.phone || ""
                                            }
                                            disabled
                                            readOnly
                                        />

                                    </div>


                                    {/* JOINING DATE */}

                                    <div className="cp-profile-form-group">

                                        <label className="cp-profile-form-label">
                                            Joining Date
                                        </label>

                                        <input
                                            type="date"
                                            className="cp-profile-input"
                                            value={
                                                employee?.date_of_join
                                                    ? employee.date_of_join.substring(
                                                          0,
                                                          10
                                                      )
                                                    : ""
                                            }
                                            disabled
                                            readOnly
                                        />

                                    </div>

                                </div>

                            </div>


                            {/* =================================
                                EMPLOYEE INFORMATION
                            ================================== */}

                            <div className="cp-profile-form-section border-none1">

                                <div className="cp-profile-section-title">

                                    <div className="cp-profile-section-number">
                                        3
                                    </div>

                                    Employee Information

                                </div>


                                <div className="cp-profile-form-grid">

                                    {/* EMPLOYEE CODE */}

                                    <div className="cp-profile-form-group">

                                        <label className="cp-profile-form-label">
                                            Employee Code
                                        </label>

                                        <input
                                            type="text"
                                            className="cp-profile-input"
                                            value={
                                                employee?.employee_code || ""
                                            }
                                            disabled
                                            readOnly
                                        />

                                    </div>


                                    {/* DEPARTMENT */}

                                    <div className="cp-profile-form-group">

                                        <label className="cp-profile-form-label">
                                            Department
                                        </label>

                                        <input
                                            type="text"
                                            className="cp-profile-input"
                                            value={
                                                employee?.department_name || ""
                                            }
                                            disabled
                                            readOnly
                                        />

                                    </div>


                                    {/* DESIGNATION */}

                                    <div className="cp-profile-form-group">

                                        <label className="cp-profile-form-label">
                                            Designation
                                        </label>

                                        <input
                                            type="text"
                                            className="cp-profile-input"
                                            value={
                                                employee?.designation || ""
                                            }
                                            disabled
                                            readOnly
                                        />

                                    </div>


                                    {/* EMPLOYEE STATUS */}

                                    <div className="cp-profile-form-group">

                                        <label className="cp-profile-form-label">
                                            Employee Status
                                        </label>

                                        <input
                                            type="text"
                                            className="cp-profile-input"
                                            value={
                                                employee?.status || "Active"
                                            }
                                            disabled
                                            readOnly
                                        />

                                    </div>

                                </div>

                            </div>


                            {/* =================================
                                ERROR
                            ================================== */}

                            {error && (
                                <div className="cp-profile-error">
                                    {error}
                                </div>
                            )}


                            {/* =================================
                                FOOTER
                            ================================== */}

                            <div className="cp-profile-form-footer">

                                <div className="cp-profile-footer-note">

                                    <LockKeyhole
                                        size={16}
                                        className="cp-profile-footer-icon"
                                    />

                                    <span>
                                        Your employee information is
                                        securely managed by HR.
                                    </span>

                                </div>


                                <button
                                    type="submit"
                                    className="cp-profile-complete-button"
                                    disabled={submitting}
                                >
                                    {submitting
                                        ? "Creating Profile..."
                                        : "Complete My Profile"}

                                    {!submitting && (
                                        <ArrowRight size={15} />
                                    )}

                                </button>

                            </div>

                        </form>

                    </section>

                </section>

            </main>


            {/* =========================================
                SUCCESS OVERLAY
            ========================================= */}

            {success && (
                <div className="cp-profile-success-overlay">

                    <div className="cp-profile-success-box">

                        <div className="cp-profile-success-icon">
                            <Check size={32} />
                        </div>


                        <h2>
                            Your profile is complete!
                        </h2>


                        <p>
                            Your employee profile has been successfully
                            created. You can now continue to the login
                            page and access your account.
                        </p>


                        <button
                            type="button"
                            className="cp-profile-dashboard-button"
                            onClick={handleLogin}
                        >
                            Continue to Login

                            <ArrowRight size={16} />

                        </button>

                    </div>

                </div>
            )}

        </div>
    );
};

export default CreateProfile;
