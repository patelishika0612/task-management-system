import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Check,
    User,
    LockKeyhole,
    Upload,
    ShieldCheck,
    ArrowRight,
} from "lucide-react";
import Logo from "../img/nirvanza-logo.png";
import "./CompleteProfile.css";

const CompleteProfile = () => {
    const navigate = useNavigate();

    const [profile, setProfile] = useState({
        fullName: "",
        email: "",
        phone: "",
        alternatePhone: "",
        dob: "",
        gender: "",
        employeeId: "",
        department: "",
        designation: "",
        joiningDate: "",
        reportingManager: "",
        address: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
        about: "",
    });

    const [photoPreview, setPhotoPreview] = useState("");
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    /* =========================================
       LOAD APPROVED REQUEST DATA
    ========================================= */

    useEffect(() => {
        const storedRequest =
            sessionStorage.getItem("accessRequest");

        if (!storedRequest) {
            return;
        }

        try {
            const request = JSON.parse(storedRequest);

            setProfile((prev) => ({
                ...prev,

                fullName:
                    request.fullName || prev.fullName,

                email:
                    request.email || prev.email,

                phone:
                    request.phone || prev.phone,

                employeeId:
                    request.employeeId || prev.employeeId,

                department:
                    request.department || prev.department,

                designation:
                    request.designation || prev.designation,

                joiningDate:
                    request.joiningDate || prev.joiningDate,

                reportingManager:
                    request.reportingManager ||
                    prev.reportingManager,
            }));
        } catch (error) {
            console.error(
                "Unable to load account information:",
                error
            );
        }
    }, []);

    /* =========================================
       HANDLE INPUT
    ========================================= */

    const handleChange = (e) => {
        const { name, value } = e.target;

        setProfile((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (error) {
            setError("");
        }
    };

    /* =========================================
       PHOTO UPLOAD
    ========================================= */

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setError(
                "Please choose an image smaller than 2 MB."
            );

            e.target.value = "";
            return;
        }

        if (!file.type.startsWith("image/")) {
            setError("Please select a valid image file.");
            e.target.value = "";
            return;
        }

        setError("");

        const reader = new FileReader();

        reader.onload = (event) => {
            setPhotoPreview(event.target.result);
        };

        reader.readAsDataURL(file);
    };

    /* =========================================
       COMPLETE PROFILE
    ========================================= */

    const handleCompleteProfile = () => {
        const fullName = profile.fullName.trim();
        const phone = profile.phone.trim();

        if (!fullName) {
            setError("Please enter your full name.");

            document
                .getElementById("cp-profile-fullName")
                ?.focus();

            return;
        }

        if (!phone) {
            setError("Please enter your phone number.");

            document
                .getElementById("cp-profile-phone")
                ?.focus();

            return;
        }

        const employeeProfile = {
            ...profile,
            fullName,
            phone,
            profilePhoto: photoPreview,
        };

        sessionStorage.setItem(
            "employeeProfile",
            JSON.stringify(employeeProfile)
        );

        sessionStorage.setItem(
            "profileCompleted",
            "true"
        );

        setSuccess(true);
    };

    /* =========================================
       DASHBOARD
    ========================================= */

    const handleDashboard = () => {
        navigate("/dashboard");
    };

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
                            Your password is ready. Now add your
                            basic information so your employee
                            account can be completed.
                        </p>

                    </div>


                    <div className="cp-profile-completion-badge">

                        <Check size={14} />

                        Password created successfully

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

                            Just complete your information.

                        </div>


                        {/* PHOTO */}

                        <div className="cp-profile-photo-wrapper">

                            <div className="cp-profile-photo">

                                {photoPreview ? (
                                    <img
                                        src={photoPreview}
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
                            This information helps your team
                            identify you and assign work correctly.
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
                                Please check the information provided
                                by HR and complete the remaining fields.
                            </p>

                        </div>


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

                                    {photoPreview ? (
                                        <img
                                            src={photoPreview}
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
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={handlePhotoChange}
                                    />

                                    {/* <div className="cp-profile-upload-info">
                                        JPG, PNG or WebP · Maximum 2 MB
                                    </div> */}

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

                                <div className="cp-profile-form-group">

                                    <label className="cp-profile-form-label">
                                        Full Name
                                        <span className="cp-profile-required">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        id="cp-profile-fullName"
                                        type="text"
                                        name="fullName"
                                        className="cp-profile-input"
                                        placeholder="Enter your full name"
                                        value={profile.fullName}
                                        onChange={handleChange}
                                    />

                                </div>


                                <div className="cp-profile-form-group">

                                    <label className="cp-profile-form-label">
                                        Email Address
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        className="cp-profile-input"
                                        value={profile.email}
                                        disabled
                                        readOnly
                                    />

                                    <div className="cp-profile-field-note">
                                        Your approved account email
                                    </div>

                                </div>


                                <div className="cp-profile-form-group">

                                    <label className="cp-profile-form-label">
                                        Phone Number
                                        <span className="cp-profile-required">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        id="cp-profile-phone"
                                        type="tel"
                                        name="phone"
                                        className="cp-profile-input"
                                        placeholder="Enter phone number"
                                        value={profile.phone}
                                        onChange={handleChange}
                                    />

                                </div>





                                <div className="cp-profile-form-group">

                                    <label className="cp-profile-form-label">
                                        Date of Birth
                                    </label>

                                    <input
                                        type="date"
                                        name="dob"
                                        className="cp-profile-input"
                                        value={profile.dob}
                                        onChange={handleChange}
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

                                <div className="cp-profile-form-group">

                                    <label className="cp-profile-form-label">
                                        Employee ID
                                    </label>

                                    <input
                                        type="text"
                                        className="cp-profile-input"
                                        value={profile.employeeId}
                                        disabled
                                        readOnly
                                    />

                                </div>


                                <div className="cp-profile-form-group">

                                    <label className="cp-profile-form-label">
                                        Department
                                    </label>

                                    <input
                                        type="text"
                                        className="cp-profile-input"
                                        value={profile.department}
                                        disabled
                                        readOnly
                                    />

                                </div>


                                <div className="cp-profile-form-group">

                                    <label className="cp-profile-form-label">
                                        Designation
                                    </label>

                                    <input
                                        type="text"
                                        className="cp-profile-input"
                                        value={profile.designation}
                                        disabled
                                        readOnly
                                    />

                                </div>


                                <div className="cp-profile-form-group">

                                    <label className="cp-profile-form-label">
                                        Joining Date
                                    </label>

                                    <input
                                        type="text"
                                        className="cp-profile-input"
                                        value={profile.joiningDate}
                                        disabled
                                        readOnly
                                    />

                                </div>




                            </div>

                        </div>


                        {/* =================================
                            ADDRESS
                        ================================== */}

                        {/* <div className="cp-profile-form-section">

                            <div className="cp-profile-section-title">

                                <div className="cp-profile-section-number">
                                    4
                                </div>

                                Contact & Address

                            </div>


                            <div className="cp-profile-form-grid">

                                <div className="cp-profile-form-group cp-profile-full">

                                    <label className="cp-profile-form-label">
                                        Address
                                    </label>

                                    <textarea
                                        name="address"
                                        className="cp-profile-textarea"
                                        placeholder="Enter your address"
                                        value={profile.address}
                                        onChange={handleChange}
                                    />

                                </div>


                                <div className="cp-profile-form-group">

                                    <label className="cp-profile-form-label">
                                        City
                                    </label>

                                    <input
                                        type="text"
                                        name="city"
                                        className="cp-profile-input"
                                        placeholder="City"
                                        value={profile.city}
                                        onChange={handleChange}
                                    />

                                </div>


                                <div className="cp-profile-form-group">

                                    <label className="cp-profile-form-label">
                                        State
                                    </label>

                                    <input
                                        type="text"
                                        name="state"
                                        className="cp-profile-input"
                                        placeholder="State"
                                        value={profile.state}
                                        onChange={handleChange}
                                    />

                                </div>


                                <div className="cp-profile-form-group">

                                    <label className="cp-profile-form-label">
                                        Country
                                    </label>

                                    <input
                                        type="text"
                                        name="country"
                                        className="cp-profile-input"
                                        value={profile.country}
                                        onChange={handleChange}
                                    />

                                </div>


                                <div className="cp-profile-form-group">

                                    <label className="cp-profile-form-label">
                                        Pincode
                                    </label>

                                    <input
                                        type="text"
                                        name="pincode"
                                        className="cp-profile-input"
                                        placeholder="Pincode"
                                        maxLength="10"
                                        value={profile.pincode}
                                        onChange={handleChange}
                                    />

                                </div>

                            </div>

                        </div> */}


                        {/* =================================
                            ADDITIONAL
                        ================================== */}

                        {/* <div className="cp-profile-form-section">

                            <div className="cp-profile-section-title">

                                <div className="cp-profile-section-number">
                                    5
                                </div>

                                Additional Information

                            </div>


                            <div className="cp-profile-form-grid">

                                <div className="cp-profile-form-group cp-profile-full">

                                    <label className="cp-profile-form-label">
                                        About You
                                    </label>

                                    <textarea
                                        name="about"
                                        className="cp-profile-textarea"
                                        placeholder="Tell us a little about yourself (optional)"
                                        value={profile.about}
                                        onChange={handleChange}
                                    />

                                </div>

                            </div>

                        </div> */}


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
                                    Your information is stored securely.
                                    Employee ID, department and designation
                                    are managed by HR.
                                </span>

                            </div>


                            <button
                                type="button"
                                className="cp-profile-complete-button"
                                onClick={handleCompleteProfile}
                            >
                                Complete My Profile

                                <ArrowRight size={15} />

                            </button>

                        </div>

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
                            Everything is ready. Your employee account
                            has been successfully created and you can now
                            access your task management dashboard.
                        </p>


                        <button
                            type="button"
                            className="cp-profile-dashboard-button"
                            onClick={handleDashboard}
                        >
                            Go to My Dashboard

                            <ArrowRight size={16} />

                        </button>

                    </div>

                </div>
            )}

        </div>
    );
};

export default CompleteProfile;