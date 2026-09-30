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
    Camera,
    CheckCircle2,
    IdCard,
} from "lucide-react";

import "./AdminProfile.css";

const Profile = () => {
    const adminEmail =
        localStorage.getItem("adminEmail") || "hr@nirvanza.com";

    const [isEditing, setIsEditing] = useState(false);
    const navigate = useNavigate();
    const [profile, setProfile] = useState({
        firstName: "HR",
        lastName: "Manager",
        email: adminEmail,
        phone: "+91 98765 43210",
        employeeId: "HR001",
        department: "Human Resources",
        designation: "HR Manager",
        joiningDate: "01 January 2025",
        location: "Ahmedabad, Gujarat",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        setProfile((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSave = () => {
        setIsEditing(false);

        // You can connect API here later
        console.log("Updated HR Profile:", profile);
    };

    return (
        <div className="hr-profile-page">

            {/* =====================================================
          PROFILE HEADER
      ===================================================== */}

            <section className="hr-profile-top">

                <div className="hr-profile-heading">

                    <div className="hr-profile-breadcrumb">
                        <button
                            type="button"
                            className="hr-profile-breadcrumb-dashboard"
                            onClick={() => navigate("/")}
                        >
                            Dashboard
                        </button>

                        <span>/</span>

                        <span>Profile</span>
                    </div>

                    <h1>My Profile</h1>

                    <p>
                        Manage your HR account information and professional details.
                    </p>

                </div>

                <div className="hr-profile-actions">

                    {!isEditing ? (
                        <>
                            <button
                                className="hr-profile-password-btn"
                                type="button"
                            >
                                <LockKeyhole size={17} />
                                Change Password
                            </button>

                            <button
                                className="hr-profile-edit-btn"
                                type="button"
                                onClick={() => setIsEditing(true)}
                            >
                                <Pencil size={17} />
                                Edit Profile
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="hr-profile-cancel-btn"
                                type="button"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </button>

                            <button
                                className="hr-profile-save-btn"
                                type="button"
                                onClick={handleSave}
                            >
                                <CheckCircle2 size={17} />
                                Save Changes
                            </button>
                        </>
                    )}

                </div>

            </section>


            {/* =====================================================
          MAIN PROFILE CONTENT
      ===================================================== */}

            <section className="hr-profile-grid">

                {/* =================================================
            LEFT PROFILE CARD
        ================================================= */}

                <div className="hr-profile-card hr-profile-main-card">

                    {/* Blue Cover */}

                    <div className="hr-profile-cover">
                        <div className="hr-cover-pattern"></div>
                    </div>


                    {/* Avatar */}

                    <div className="hr-profile-avatar-wrapper">

                        <div className="hr-profile-avatar">
                            <User size={42} />
                        </div>

                        {isEditing && (
                            <button
                                type="button"
                                className="hr-avatar-camera"
                                title="Change profile photo"
                            >
                                <Camera size={15} />
                            </button>
                        )}

                    </div>


                    {/* Basic Info */}

                    <div className="hr-profile-basic">

                        <h2>
                            {profile.firstName} {profile.lastName}
                        </h2>

                        <p className="hr-profile-designation">
                            {profile.designation}
                        </p>

                        <div className="hr-profile-role">
                            <ShieldCheck size={15} />
                            HR / Human Resources
                        </div>

                    </div>


                    {/* Profile Status */}

                    <div className="hr-profile-status">
                        <span className="hr-status-dot"></span>
                        Active Account
                    </div>


                    {/* Quick Details */}

                    <div className="hr-profile-quick-info">

                        <div className="hr-quick-item">

                            <div className="hr-quick-icon">
                                <Mail size={17} />
                            </div>

                            <div>
                                <span>Email</span>
                                <strong>{profile.email}</strong>
                            </div>

                        </div>


                        <div className="hr-quick-item">

                            <div className="hr-quick-icon">
                                <Phone size={17} />
                            </div>

                            <div>
                                <span>Phone</span>
                                <strong>{profile.phone}</strong>
                            </div>

                        </div>


                        <div className="hr-quick-item">

                            <div className="hr-quick-icon">
                                <Building2 size={17} />
                            </div>

                            <div>
                                <span>Department</span>
                                <strong>{profile.department}</strong>
                            </div>

                        </div>


                        <div className="hr-quick-item">

                            <div className="hr-quick-icon">
                                <MapPin size={17} />
                            </div>

                            <div>
                                <span>Location</span>
                                <strong>{profile.location}</strong>
                            </div>

                        </div>

                    </div>

                </div>


                {/* =================================================
            RIGHT CONTENT
        ================================================= */}

                <div className="hr-profile-right">


                    {/* ===============================================
              PERSONAL INFORMATION
          =============================================== */}

                    <div className="hr-profile-card">

                        <div className="hr-section-header">

                            <div>
                                <h3>Personal Information</h3>

                                <p>
                                    Your basic personal information
                                </p>
                            </div>

                            <div className="hr-section-icon">
                                <User size={18} />
                            </div>

                        </div>


                        <div className="hr-profile-form-grid">

                            {/* First Name */}

                            <div className="hr-form-group">

                                <label>
                                    First Name
                                </label>

                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={profile.firstName}
                                        onChange={handleChange}
                                    />
                                ) : (
                                    <div className="hr-info-value">
                                        {profile.firstName}
                                    </div>
                                )}

                            </div>


                            {/* Last Name */}

                            <div className="hr-form-group">

                                <label>
                                    Last Name
                                </label>

                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={profile.lastName}
                                        onChange={handleChange}
                                    />
                                ) : (
                                    <div className="hr-info-value">
                                        {profile.lastName}
                                    </div>
                                )}

                            </div>


                            {/* Email */}

                            <div className="hr-form-group">

                                <label>
                                    Email Address
                                </label>

                                {isEditing ? (
                                    <input
                                        type="email"
                                        name="email"
                                        value={profile.email}
                                        onChange={handleChange}
                                    />
                                ) : (
                                    <div className="hr-info-value">
                                        {profile.email}
                                    </div>
                                )}

                            </div>


                            {/* Phone */}

                            <div className="hr-form-group">

                                <label>
                                    Phone Number
                                </label>

                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="phone"
                                        value={profile.phone}
                                        onChange={handleChange}
                                    />
                                ) : (
                                    <div className="hr-info-value">
                                        {profile.phone}
                                    </div>
                                )}

                            </div>

                        </div>

                    </div>


                    {/* ===============================================
              PROFESSIONAL INFORMATION
          =============================================== */}

                    <div className="hr-profile-card">

                        <div className="hr-section-header">

                            <div>
                                <h3>Professional Information</h3>

                                <p>
                                    Your HR role and employment details
                                </p>
                            </div>

                            <div className="hr-section-icon">
                                <BriefcaseBusiness size={18} />
                            </div>

                        </div>


                        <div className="hr-profile-form-grid">

                            {/* Employee ID */}

                            <div className="hr-form-group">

                                <label>
                                    Employee ID
                                </label>

                                <div className="hr-info-value hr-disabled-value">
                                    <IdCard size={15} />
                                    {profile.employeeId}
                                </div>

                            </div>


                            {/* Designation */}

                            <div className="hr-form-group">

                                <label>
                                    Designation
                                </label>

                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="designation"
                                        value={profile.designation}
                                        onChange={handleChange}
                                    />
                                ) : (
                                    <div className="hr-info-value">
                                        {profile.designation}
                                    </div>
                                )}

                            </div>


                            {/* Department */}

                            <div className="hr-form-group">

                                <label>
                                    Department
                                </label>

                                <div className="hr-info-value">
                                    <Building2 size={15} />
                                    {profile.department}
                                </div>

                            </div>


                            {/* Joining Date */}

                            <div className="hr-form-group">

                                <label>
                                    Joining Date
                                </label>

                                <div className="hr-info-value">
                                    <CalendarDays size={15} />
                                    {profile.joiningDate}
                                </div>

                            </div>


                            {/* Location */}

                            <div className="hr-form-group hr-form-full">

                                <label>
                                    Work Location
                                </label>

                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="location"
                                        value={profile.location}
                                        onChange={handleChange}
                                    />
                                ) : (
                                    <div className="hr-info-value">
                                        <MapPin size={15} />
                                        {profile.location}
                                    </div>
                                )}

                            </div>

                        </div>

                    </div>


                    {/* ===============================================
              HR ACCESS CARD
          =============================================== */}

                    <div className="hr-profile-access-card">

                        <div className="hr-access-icon">
                            <ShieldCheck size={24} />
                        </div>

                        <div className="hr-access-content">

                            <h3>
                                HR Access
                            </h3>

                            <p>
                                You have HR-level access to manage employees,
                                projects, departments and assigned tasks.
                            </p>

                        </div>

                        <span className="hr-access-badge">
                            HR
                        </span>

                    </div>

                </div>

            </section>

        </div>
    );
};

export default Profile;