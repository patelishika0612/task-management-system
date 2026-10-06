import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

import API from "../api";

const AdminLogin = () => {

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // =====================================================
    // GET EMAIL FROM APPROVAL EMAIL LINK
    // =====================================================
    const emailFromMail = searchParams.get("email") || "";

    const [email, setEmail] = useState(emailFromMail);
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    // =====================================================
    // ADMIN LOGIN
    // =====================================================

    const handleLogin = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        // =================================================
        // VALIDATION
        // =================================================

        if (!email.trim()) {
            setError("Email is required.");
            return;
        }

        if (!password.trim()) {
            setError("Password is required.");
            return;
        }

        try {

            setLoading(true);

            // =================================================
            // LOGIN API
            // =================================================

            const response = await API.post(
                "/admin-login/login",
                {
                    email: email.trim().toLowerCase(),
                    password: password
                }
            );

            const result = response.data;

            // =================================================
            // CHECK RESPONSE
            // =================================================

            if (!result.success) {

                setError(
                    result.message ||
                    "Invalid email or password."
                );

                return;
            }

            // =================================================
            // SAVE JWT TOKEN
            // =================================================

            localStorage.setItem(
                "adminToken",
                result.data.token
            );

            // =================================================
            // SAVE ADMIN DATA
            // =================================================

            localStorage.setItem(
                "adminData",
                JSON.stringify({
                    adminId: result.data.adminId,
                    email: result.data.email
                })
            );

            // =================================================
            // SUCCESS
            // =================================================

            setSuccess("Login successful!");

            // =================================================
            // REDIRECT TO PROFILE
            // =================================================

            setTimeout(() => {

                navigate(`/?email=${encodeURIComponent(email)}`);

            }, 500);

        } catch (error) {

            console.error(
                "Admin login error:",
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

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="admin-login-page">

            <div className="admin-login-card">

                <h2>
                    Admin Login
                </h2>

                <p className="login-subtitle">
                    Login to access your admin account
                </p>

                {/* ERROR */}

                {error && (
                    <div className="login-error">
                        {error}
                    </div>
                )}

                {/* SUCCESS */}

                {success && (
                    <div className="login-success">
                        {success}
                    </div>
                )}

                {/* LOGIN FORM */}

                <form onSubmit={handleLogin}>

                    {/* =================================================
                        EMAIL
                    ================================================= */}

                    <div className="form-group">

                        <label htmlFor="email">
                            Email
                        </label>

                        <div className="input-wrapper">

                            <Mail
                                size={18}
                                className="input-icon"
                            />

                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                                required
                            />
                        </div>

                    </div>

                    {/* =================================================
                        PASSWORD
                    ================================================= */}

                    <div className="form-group">

                        <label htmlFor="password">
                            Password
                        </label>

                        <div className="input-wrapper">

                            <Lock
                                size={18}
                                className="input-icon"
                            />

                            <input
                                id="password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                placeholder="Enter password"
                                required
                            />

                            {/* SHOW / HIDE PASSWORD */}

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowPassword(
                                        !showPassword
                                    )
                                }
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showPassword ? (
                                    <EyeOff size={19} />
                                ) : (
                                    <Eye size={19} />
                                )}
                            </button>

                        </div>

                    </div>

                    {/* =================================================
                        LOGIN BUTTON
                    ================================================= */}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Logging in..."
                            : "Login"
                        }
                    </button>

                </form>

            </div>

        </div>
    );
};

export default AdminLogin;
