// src/admin/Profile.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    User,
    Mail,
    Phone,
    BriefcaseBusiness,
    Building2,
    CalendarDays,
    MapPin,
    ShieldCheck,
    Pencil,
    LockKeyhole,
    CheckCircle2,
    IdCard,
    X,
    Clock,
    BadgeCheck,
    CircleCheck,
} from "lucide-react";
import UserImg from "../img/user.png";
import AdminLayout from "../components/AdminLayout";
import "./AdminProfile.css";
import Swal from "sweetalert2";
// Form validation helpers
// Keep only digits and cut to max length (blocks letters while typing)
const onlyDigits = (value, max) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return max ? digits.slice(0, max) : digits;
};
// Keep only letters, spaces and . ' - (for names, city, state, etc.)
const onlyLetters = (value) =>
  String(value ?? "").replace(/[^A-Za-z .'-]/g, "");
const isValidPhone = (v) => /^[6-9]\d{9}$/.test(String(v).trim());
const isValidName = (v) => /^[A-Za-z][A-Za-z .'-]*$/.test(String(v).trim());
// Props to spread on a phone <input> so only 10 digits can be typed
const phoneInputProps = {
  type: "tel",
  inputMode: "numeric",
  maxLength: 10,
  pattern: "[6-9][0-9]{9}",
  title: "Enter a valid 10-digit mobile number",
};

const Profile = () => {
    const adminEmail =
        localStorage.getItem("adminEmail") || "hr@nirvanza.com";

    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);

    // =====================================================
    // PROFILE DATA
    // =====================================================
    const [profile, setProfile] = useState({
        firstName: "HR",
        lastName: "Manager",
        email: adminEmail,
        phone: "9876543210",
        employeeId: "HR001",
        department: "Human Resources",
        designation: "HR Manager",
        joiningDate: "01 January 2025",
        location: "Ahmedabad, Gujarat",

        // Email Verification
        // true  = Verified
        // false = Not Verified
        emailVerified: false,

        // Account Status
        // "Active"     = Active
        // "Not Active" = Not Active
        accountStatus: "Active",
    });

    const [savedProfile, setSavedProfile] = useState({
        ...profile,
    });

    // =====================================================
    // HANDLE INPUT CHANGE
    // =====================================================
    const handleChange = (e) => {
        const { name } = e.target;
        let { value } = e.target;
        if (name === "phone") value = onlyDigits(value, 10);
        else if (name === "firstName" || name === "lastName") value = onlyLetters(value);

        setProfile((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // =====================================================
    // SAVE PROFILE
    // =====================================================
    const handleSave = () => {
        const warn = (text) =>
            Swal.fire({ icon: "warning", title: "Invalid Input", text, confirmButtonColor: "#1557f5" });

        if (!profile.firstName.trim() || !isValidName(profile.firstName)) {
            warn("Please enter a valid first name (letters only).");
            return;
        }

        if (!profile.lastName.trim() || !isValidName(profile.lastName)) {
            warn("Please enter a valid last name (letters only).");
            return;
        }

        if (!isValidPhone(profile.phone)) {
            warn("Phone must be a valid 10-digit mobile number.");
            return;
        }

        if (profile.location.trim().length < 2) {
            warn("Please enter your work location.");
            return;
        }

        setSavedProfile({
            ...profile,
        });

        setIsEditing(false);
    };

    // =====================================================
    // OPEN EDIT MODAL
    // =====================================================
    const handleEditOpen = () => {
        setIsEditing(true);
    };

    // =====================================================
    // CANCEL EDIT
    // =====================================================
    const handleCancel = () => {
        setProfile({
            ...savedProfile,
        });

        setIsEditing(false);
    };

    // =====================================================
    // WORK INFORMATION
    // =====================================================
    const profItems = [
        {
            icon: <IdCard size={16} />,
            label: "Employee ID",
            value: profile.employeeId,
        },
        {
            icon: <BriefcaseBusiness size={16} />,
            label: "Designation",
            value: profile.designation,
        },
        {
            icon: <Building2 size={16} />,
            label: "Department",
            value: profile.department,
        },
        {
            icon: <CalendarDays size={16} />,
            label: "Joining Date",
            value: profile.joiningDate,
        },
    ];

    // =====================================================
    // ACCOUNT INFORMATION
    // =====================================================
    const accountItems = [
        {
            icon: <CalendarDays size={18} />,
            label: "Account Created",
            value: "01 January 2025",
            color: "#6366f1",
            bg: "#eef2ff",
        },

        {
            icon: <Clock size={18} />,
            label: "Last Login",
            value: "Today, 09:42 AM",
            color: "#0ea5e9",
            bg: "#e0f2fe",
        },

        // =================================================
        // EMAIL VERIFICATION
        // =================================================
        {
            icon: <BadgeCheck size={18} />,
            label: "Email Verification",

            value: profile.emailVerified
                ? "Verified"
                : "Not Verified",

            badge: true,

            badgeColor: profile.emailVerified
                ? "#16a34a"
                : "#dc2626",

            badgeBg: profile.emailVerified
                ? "#dcfce7"
                : "#fee2e2",

            color: profile.emailVerified
                ? "#16a34a"
                : "#dc2626",

            bg: profile.emailVerified
                ? "#dcfce7"
                : "#fee2e2",
        },


    ];

    return (
        <AdminLayout>

            <div className="hr-profile-page">

                {/* =====================================================
                    TOP BAR
                ===================================================== */}
                <section className="hr-profile-top">

                    <div className="hr-profile-actions">

                        {/* CHANGE PASSWORD */}
                        <button
                            className="hr-profile-password-btn"
                            type="button"
                            onClick={() => navigate("/resetpassword")}
                        >
                            <LockKeyhole size={15} />
                            Change Password
                        </button>

                        {/* EDIT PROFILE */}
                        <button
                            className="hr-profile-edit-btn"
                            type="button"
                            onClick={handleEditOpen}
                        >
                            <Pencil size={15} />
                            Edit Profile
                        </button>

                    </div>

                </section>


                {/* =====================================================
                    MAIN GRID
                ===================================================== */}
                <section className="hr-profile-grid">

                    {/* =================================================
                        LEFT PROFILE CARD
                    ================================================= */}
                    <div className="hr-profile-card hr-profile-main-card">

                        {/* COVER */}
                        <div className="hr-profile-cover">
                            <div className="hr-cover-pattern"></div>
                        </div>


                        {/* AVATAR */}
                        <div className="hr-profile-avatar-wrapper">

                            <div className="hr-profile-avatar">
                                <img
                                    src={UserImg}
                                    alt="Admin Avatar"
                                    className="admin-avatar-image"
                                />
                            </div>

                        </div>


                        {/* BASIC INFORMATION */}
                        <div className="hr-profile-basic">

                            <h2>
                                {profile.firstName}{" "}
                                {profile.lastName}
                            </h2>

                            <p className="hr-profile-designation">
                                {profile.designation}
                            </p>

                            <div className="hr-profile-role">
                                <ShieldCheck size={15} />
                                HR / Human Resources
                            </div>

                        </div>


                        {/* ACTIVE ACCOUNT STATUS */}
                        <div className="hr-profile-status">

                            <span className="hr-status-dot"></span>

                            {profile.accountStatus === "Active"
                                ? "Active Account"
                                : "Not Active"}

                        </div>


                        {/* =================================================
                            QUICK INFORMATION
                        ================================================= */}
                        <div className="hr-profile-quick-info">

                            {/* EMAIL */}
                            <div className="hr-quick-item">

                                <div className="hr-quick-icon">
                                    <Mail size={17} />
                                </div>

                                <div>
                                    <span>Email</span>

                                    <strong>
                                        {profile.email}
                                    </strong>
                                </div>

                            </div>


                            {/* PHONE */}
                            <div className="hr-quick-item">

                                <div className="hr-quick-icon">
                                    <Phone size={17} />
                                </div>

                                <div>
                                    <span>Phone</span>

                                    <strong>
                                        {profile.phone}
                                    </strong>
                                </div>

                            </div>


                            {/* DEPARTMENT */}
                            <div className="hr-quick-item">

                                <div className="hr-quick-icon">
                                    <Building2 size={17} />
                                </div>

                                <div>
                                    <span>Department</span>

                                    <strong>
                                        {profile.department}
                                    </strong>
                                </div>

                            </div>


                            {/* LOCATION */}
                            <div className="hr-quick-item">

                                <div className="hr-quick-icon">
                                    <MapPin size={17} />
                                </div>

                                <div>
                                    <span>Location</span>

                                    <strong>
                                        {profile.location}
                                    </strong>
                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        RIGHT CONTENT
                    ================================================= */}
                    <div className="hr-profile-right">

                        {/* =================================================
                            WORK INFORMATION
                        ================================================= */}
                        <div className="hr-profile-card">

                            <div className="hr-section-header">

                                <div>

                                    <h3>
                                        Work Information
                                    </h3>

                                    <p>
                                        Your HR role and employment details
                                    </p>

                                </div>

                                <div className="hr-section-icon">
                                    <BriefcaseBusiness size={18} />
                                </div>

                            </div>


                            <div className="hr-prof-info-grid">

                                {profItems.map((item, i) => (

                                    <div
                                        className="hr-prof-info-item"
                                        key={i}
                                    >

                                        <div className="hr-prof-info-icon">
                                            {item.icon}
                                        </div>

                                        <div className="hr-prof-info-text">

                                            <span>
                                                {item.label}
                                            </span>

                                            <strong>
                                                {item.value}
                                            </strong>

                                        </div>

                                    </div>

                                ))}

                            </div>

                        </div>


                        {/* =================================================
                            ACCOUNT INFORMATION
                        ================================================= */}
                        <div className="hr-profile-card">

                            <div className="hr-section-header">

                                <div>

                                    <h3>
                                        Account Information
                                    </h3>

                                    <p>
                                        Your account activity and security status
                                    </p>

                                </div>

                                <div className="hr-section-icon">
                                    <ShieldCheck size={18} />
                                </div>

                            </div>


                            <div className="hr-account-info-grid">

                                {accountItems.map((item, i) => (

                                    <div
                                        className="hr-account-info-item"
                                        key={i}
                                    >

                                        {/* ICON */}
                                        <div
                                            className="hr-account-info-icon"
                                            style={{
                                                background: item.bg,
                                                color: item.color,
                                            }}
                                        >
                                            {item.icon}
                                        </div>


                                        {/* TEXT */}
                                        <div className="hr-account-info-text">

                                            <span>
                                                {item.label}
                                            </span>


                                            {/* BADGE */}
                                            {item.badge ? (

                                                <span
                                                    className="hr-account-badge"
                                                    style={{
                                                        background:
                                                            item.badgeBg,
                                                        color:
                                                            item.badgeColor,
                                                    }}
                                                >

                                                    <span
                                                        className="hr-account-badge-dot"
                                                        style={{
                                                            background:
                                                                item.badgeColor,
                                                        }}
                                                    ></span>

                                                    {item.value}

                                                </span>

                                            ) : (

                                                <strong>
                                                    {item.value}
                                                </strong>

                                            )}

                                        </div>

                                    </div>

                                ))}

                            </div>

                        </div>

                    </div>

                </section>

            </div>


            {/* =========================================================
                EDIT PROFILE MODAL
            ========================================================= */}
            {isEditing && (

                <div className="hr-modal-overlay">

                    <div
                        className="hr-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        {/* MODAL HEADER */}
                        <div className="hr-modal-header">

                            <div>

                                <h3>
                                    Edit Profile
                                </h3>

                                <p>
                                    Update your personal and professional details
                                </p>

                            </div>


                            <button
                                className="hr-modal-close"
                                type="button"
                                onClick={handleCancel}
                            >
                                <X size={18} />
                            </button>

                        </div>


                        {/* MODAL BODY */}
                        <div className="hr-modal-body">

                            <div className="hr-modal-grid">

                                {/* FIRST NAME */}
                                <div className="hr-modal-field">

                                    <label>
                                        First Name
                                    </label>

                                    <input
                                        type="text"
                                        name="firstName"
                                        value={profile.firstName}
                                        onChange={handleChange}
                                    />

                                </div>


                                {/* LAST NAME */}
                                <div className="hr-modal-field">

                                    <label>
                                        Last Name
                                    </label>

                                    <input
                                        type="text"
                                        name="lastName"
                                        value={profile.lastName}
                                        onChange={handleChange}
                                    />

                                </div>


                                {/* PHONE */}
                                <div className="hr-modal-field">

                                    <label>
                                        Phone Number
                                    </label>

                                    <input
                                        {...phoneInputProps}
                                        name="phone"
                                        value={profile.phone}
                                        onChange={handleChange}
                                    />

                                </div>


                                {/* WORK LOCATION */}
                                <div className="hr-modal-field">

                                    <label>
                                        Work Location
                                    </label>

                                    <input
                                        type="text"
                                        name="location"
                                        value={profile.location}
                                        onChange={handleChange}
                                    />

                                </div>

                            </div>

                        </div>


                        {/* MODAL FOOTER */}
                        <div className="hr-modal-footer">

                            <button
                                className="hr-profile-cancel-btn"
                                type="button"
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>


                            <button
                                className="hr-profile-save-btn"
                                type="button"
                                onClick={handleSave}
                            >
                                <CheckCircle2 size={16} />
                                Save Changes
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </AdminLayout>
    );
};

export default Profile;