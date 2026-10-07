import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
    Check,
    ChevronRight,
    LockKeyhole,
    ShieldCheck,
    Eye,
    EyeOff,
    CheckCircle2,
} from "lucide-react";

import Logo from "../img/nirvanza-logo.png";
import API from "../api";

import "./CreatePassword.css";

const SetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // =========================================
    // EMAIL FROM URL
    // =========================================

    const emailFromMail =
        searchParams.get("email") || "";

    const [email] = useState(emailFromMail);

    // =========================================
    // PASSWORD
    // =========================================

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    // =========================================
    // API STATES
    // =========================================

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showSuccess, setShowSuccess] =
        useState(false);

    // =========================================
    // PASSWORD REQUIREMENTS
    // =========================================

    const [requirements, setRequirements] =
        useState({
            length: false,
            upper: false,
            number: false,
            special: false,
        });

    const [strength, setStrength] = useState({
        score: 0,
        text: "—",
    });

    // =========================================
    // PASSWORD CHECK
    // =========================================

    const checkPassword = (value) => {
        const updatedRequirements = {
            length: value.length >= 8,
            upper: /[A-Z]/.test(value),
            number: /[0-9]/.test(value),
            special: /[^A-Za-z0-9]/.test(value),
        };

        setRequirements(updatedRequirements);

        let score = 0;

        if (updatedRequirements.length) score++;
        if (updatedRequirements.upper) score++;
        if (updatedRequirements.number) score++;
        if (updatedRequirements.special) score++;

        let strengthText = "—";

        if (score === 1) {
            strengthText = "Weak";
        } else if (score === 2) {
            strengthText = "Fair";
        } else if (score === 3) {
            strengthText = "Good";
        } else if (score === 4) {
            strengthText = "Strong";
        }

        setStrength({
            score,
            text: strengthText,
        });

        setPassword(value);

        if (error) {
            setError("");
        }
    };

    // =========================================
    // VALIDATION
    // =========================================

    const allRequirements =
        requirements.length &&
        requirements.upper &&
        requirements.number &&
        requirements.special;

    const passwordsMatch =
        password.length > 0 &&
        password === confirmPassword;

    const isFormValid =
        allRequirements &&
        passwordsMatch &&
        email.trim();

    // =========================================
    // SET PASSWORD
    // =========================================

    const handleSetPassword = async () => {
        setError("");
        setSuccess("");

        // -----------------------------------------
        // EMAIL
        // -----------------------------------------

        if (!email.trim()) {
            setError("Email is required.");
            return;
        }

        // -----------------------------------------
        // PASSWORD
        // -----------------------------------------

        if (!password.trim()) {
            setError("Password is required.");
            return;
        }

        if (!allRequirements) {
            setError(
                "Please create a stronger password that meets all requirements."
            );
            return;
        }

        // -----------------------------------------
        // CONFIRM PASSWORD
        // -----------------------------------------

        if (!confirmPassword.trim()) {
            setError(
                "Confirm password is required."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError(
                "Password and confirm password do not match."
            );
            return;
        }

        try {
            setLoading(true);

            // =========================================
            // API
            // =========================================

            const response = await API.post(
                "/admin-login/set-password",
                {
                    email: email
                        .trim()
                        .toLowerCase(),

                    password: password,

                    confirmPassword:
                        confirmPassword,
                }
            );

            const result = response.data;

            if (!result.success) {
                setError(
                    result.message ||
                    "Unable to create password."
                );

                return;
            }

            // =========================================
            // SUCCESS
            // =========================================

            setSuccess(
                "Password created successfully!"
            );

            sessionStorage.setItem(
                "passwordCreated",
                "true"
            );

            // Save email for Create Profile page
            sessionStorage.setItem(
                "accessRequest",
                JSON.stringify({
                    email: email.trim(),
                })
            );

            setShowSuccess(true);

        } catch (error) {
            console.error(
                "Set password error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to connect to server."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================
    // COMPLETE PROFILE
    // =========================================

    const handleCompleteProfile = () => {
        navigate(
            `/create-profile?email=${encodeURIComponent(
                email
            )}`
        );
    };

    return (
        <div className="cp-page-wrapper">

            {/* =========================================
                HEADER
            ========================================= */}

            <header className="cp-top-header">

                <img
                    src={Logo}
                    alt="Nirvanza Infotech"
                    className="cp-logo"
                />

                <div className="cp-header-status">

                    <span className="cp-status-dot"></span>

                    Account approved

                </div>

            </header>


            {/* =========================================
                PAGE
            ========================================= */}

            <main className="cp-page">

                {/* =========================================
                    INTRO
                ========================================= */}

                <section className="cp-intro">

                    <div>

                        <div className="cp-step-label">

                            <span className="cp-step-circle">
                                3
                            </span>

                            Step 3 of 4

                        </div>

                        <h1>
                            Create your password
                        </h1>

                        <p>
                            Your access request has been approved.
                            Create a secure password to continue
                            setting up your account.
                        </p>

                    </div>

                </section>


                {/* =========================================
                    PROGRESS
                ========================================= */}

                <div className="cp-progress-card">

                    <div className="cp-progress-item completed">

                        <div className="cp-progress-circle">
                            <Check size={13} />
                        </div>

                        Access Approved

                    </div>


                    <div className="cp-progress-arrow">
                        <ChevronRight size={15} />
                    </div>


                    <div className="cp-progress-item active">

                        <div className="cp-progress-circle">
                            2
                        </div>

                        Create Password

                    </div>


                    <div className="cp-progress-arrow">
                        <ChevronRight size={15} />
                    </div>


                    <div className="cp-progress-item">

                        <div className="cp-progress-circle">
                            3
                        </div>

                        Complete Profile

                    </div>

                </div>


                {/* =========================================
                    PASSWORD CARD
                ========================================== */}

                <section className="cp-password-card">

                    {/* =====================================
                        LEFT PANEL
                    ====================================== */}

                    <aside className="cp-info-panel">

                        <div className="cp-lock-icon">
                            <LockKeyhole size={27} />
                        </div>

                        <h2>
                            Keep your account secure
                        </h2>

                        <p>
                            Choose a password that only you know.
                            Your password will be securely protected
                            and cannot be viewed by other employees.
                        </p>


                        <div className="cp-security-list">

                            <div className="cp-security-item">

                                <div className="cp-security-check">
                                    <Check size={13} />
                                </div>

                                <div>

                                    <strong>
                                        Use a strong password
                                    </strong>

                                    <span>
                                        Combine letters, numbers and
                                        special characters.
                                    </span>

                                </div>

                            </div>


                            <div className="cp-security-item">

                                <div className="cp-security-check">
                                    <Check size={13} />
                                </div>

                                <div>

                                    <strong>
                                        Keep it private
                                    </strong>

                                    <span>
                                        Never share your password with
                                        another person.
                                    </span>

                                </div>

                            </div>


                            <div className="cp-security-item">

                                <div className="cp-security-check">
                                    <Check size={13} />
                                </div>

                                <div>

                                    <strong>
                                        Easy for you to remember
                                    </strong>

                                    <span>
                                        Use a password you can remember
                                        without writing it down.
                                    </span>

                                </div>

                            </div>

                        </div>


                        <div className="cp-info-footer">

                            <ShieldCheck size={13} />

                            Your password is securely stored
                            and protected.

                        </div>

                    </aside>


                    {/* =====================================
                        FORM
                    ====================================== */}

                    <section className="cp-form-panel">

                        <div className="cp-form-heading">

                            <h2>
                                Set your password
                            </h2>

                            <p>
                                Enter your new password below.
                                You will use it when signing in.
                            </p>

                        </div>


                        {/* =================================
                            ACCOUNT
                        ================================== */}

                        <div className="cp-account-box">

                            <div>

                                <div className="cp-account-label">
                                    Account email
                                </div>

                                <div className="cp-account-email">
                                    {email ||
                                        "Email not available"}
                                </div>

                            </div>


                            <div className="cp-approved-label">

                                <Check size={11} />

                                Approved

                            </div>

                        </div>


                        {/* =================================
                            ERROR
                        ================================== */}

                        {error && (
                            <div className="login-error">
                                {error}
                            </div>
                        )}


                        {/* =================================
                            SUCCESS MESSAGE
                        ================================== */}

                        {success && !showSuccess && (
                            <div className="login-success">
                                {success}
                            </div>
                        )}


                        {/* =================================
                            NEW PASSWORD
                        ================================== */}

                        <div className="cp-form-group">

                            <label
                                className="cp-form-label"
                                htmlFor="setPassword"
                            >
                                New Password
                            </label>


                            <div className="cp-input-wrapper">

                                <input
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    id="setPassword"
                                    className="cp-password-input"
                                    placeholder="Enter your password"
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) =>
                                        checkPassword(
                                            e.target.value
                                        )
                                    }
                                />


                                <button
                                    type="button"
                                    className="cp-toggle-password"
                                    onClick={() =>
                                        setShowPassword(
                                            !showPassword
                                        )
                                    }
                                >

                                    {showPassword ? (
                                        <EyeOff size={16} />
                                    ) : (
                                        <Eye size={16} />
                                    )}

                                    <span>
                                        {showPassword
                                            ? "Hide"
                                            : "Show"}
                                    </span>

                                </button>

                            </div>


                            {/* =================================
                                STRENGTH
                            ================================== */}

                            <div className="cp-strength-row">

                                <div className="cp-strength-bars">

                                    {[1, 2, 3, 4].map(
                                        (bar) => (
                                            <div
                                                key={bar}
                                                className="cp-strength-bar"
                                                style={{
                                                    background:
                                                        bar <=
                                                        strength.score
                                                            ? strength.score === 1
                                                                ? "#d9534f"
                                                                : strength.score === 2
                                                                    ? "#e6a23c"
                                                                    : strength.score === 3
                                                                        ? "#d6a900"
                                                                        : "#15966a"
                                                            : "#e7eaf0",
                                                }}
                                            />
                                        )
                                    )}

                                </div>


                                <div className="cp-strength-text">
                                    {strength.text}
                                </div>

                            </div>


                            {/* =================================
                                REQUIREMENTS
                            ================================== */}

                            <div className="cp-requirements">

                                <Requirement
                                    valid={requirements.length}
                                    text="8 or more characters"
                                />

                                <Requirement
                                    valid={requirements.upper}
                                    text="One uppercase letter"
                                />

                                <Requirement
                                    valid={requirements.number}
                                    text="One number"
                                />

                                <Requirement
                                    valid={requirements.special}
                                    text="One special character"
                                />

                            </div>

                        </div>


                        {/* =================================
                            CONFIRM PASSWORD
                        ================================== */}

                        <div className="cp-form-group">

                            <label
                                className="cp-form-label"
                                htmlFor="setConfirmPassword"
                            >
                                Confirm Password
                            </label>


                            <div className="cp-input-wrapper">

                                <input
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    id="setConfirmPassword"
                                    className="cp-password-input"
                                    placeholder="Enter your password again"
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(
                                            e.target.value
                                        );

                                        if (error) {
                                            setError("");
                                        }
                                    }}
                                />


                                <button
                                    type="button"
                                    className="cp-toggle-password"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
                                >

                                    {showConfirmPassword ? (
                                        <EyeOff size={16} />
                                    ) : (
                                        <Eye size={16} />
                                    )}

                                    <span>
                                        {showConfirmPassword
                                            ? "Hide"
                                            : "Show"}
                                    </span>

                                </button>

                            </div>


                            {confirmPassword.length > 0 && (
                                <div
                                    className={`cp-match-message ${
                                        passwordsMatch
                                            ? "success"
                                            : "error"
                                    }`}
                                >

                                    {passwordsMatch
                                        ? "✓ Passwords match."
                                        : "Passwords do not match."}

                                </div>
                            )}

                        </div>


                        {/* =================================
                            BUTTON
                        ================================== */}

                        <button
                            type="button"
                            className="cp-continue-btn"
                            disabled={
                                !isFormValid ||
                                loading
                            }
                            onClick={
                                handleSetPassword
                            }
                        >

                            {loading
                                ? "Creating Password..."
                                : "Create Password & Continue"}

                            {!loading && (
                                <ChevronRight
                                    size={17}
                                />
                            )}

                        </button>


                        {/* =================================
                            SECURITY NOTE
                        ================================== */}

                        <div className="cp-security-note">

                            <ShieldCheck
                                size={14}
                                className="cp-security-note-icon"
                            />

                            <span>
                                Your password is securely protected.
                                For your security, do not share it
                                with anyone.
                            </span>

                        </div>

                    </section>

                </section>

            </main>


            {/* =========================================
                SUCCESS OVERLAY
            ========================================== */}

            {showSuccess && (
                <div className="cp-success-overlay">

                    <div className="cp-success-box">

                        <div className="cp-success-icon">
                            <CheckCircle2 size={32} />
                        </div>


                        <h2>
                            Password created!
                        </h2>


                        <p>
                            Your password has been created successfully.
                            One more step remains — complete your profile
                            so your account is ready to use.
                        </p>


                        <button
                            className="cp-profile-btn"
                            onClick={
                                handleCompleteProfile
                            }
                        >

                            Complete My Profile

                            <ChevronRight
                                size={17}
                            />

                        </button>

                    </div>

                </div>
            )}

        </div>
    );
};


/* =========================================
   REQUIREMENT COMPONENT
========================================= */

const Requirement = ({
    valid,
    text,
}) => {
    return (
        <div
            className={`cp-requirement ${
                valid ? "valid" : ""
            }`}
        >

            <div className="cp-requirement-icon">

                {valid && (
                    <Check size={10} />
                )}

            </div>

            {text}

        </div>
    );
};


export default SetPassword;