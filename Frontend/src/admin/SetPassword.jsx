import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

import API from "../api";

const SetPassword = () => {

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Email from URL
    const emailFromMail = searchParams.get("email") || "";

    const [email] = useState(emailFromMail);

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // =====================================================
    // CREATE PASSWORD
    // =====================================================

    const handleSetPassword = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (!email.trim()) {
            setError("Email is required.");
            return;
        }

        if (!password.trim()) {
            setError("Password is required.");
            return;
        }

        if (!confirmPassword.trim()) {
            setError("Confirm password is required.");
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

            // ---------------------------------------------
            // SET PASSWORD API
            // ---------------------------------------------

            const response = await API.post(
                "/admin-login/set-password",
                {
                    email: email.trim().toLowerCase(),
                    password: password,
                    confirmPassword: confirmPassword
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

            setSuccess(
                "Password created successfully!"
            );

            // ---------------------------------------------
            // GO TO LOGIN PAGE
            // ---------------------------------------------

            setTimeout(() => {

                navigate(
                    `/create-profile?email=${encodeURIComponent(
                        email
                    )}`
                );

            }, 1000);

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

    return (
        <div className="admin-login-page">

            <div className="admin-login-card">

                <h2>
                    Create Password
                </h2>

                <p className="login-subtitle">
                    Create your admin password
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

                <form onSubmit={handleSetPassword}>

                    {/* EMAIL */}

                    <div className="form-group">

                        <label>
                            Email
                        </label>

                        <div className="input-wrapper">

                            <Mail
                                size={18}
                                className="input-icon"
                            />

                            <input
                                type="email"
                                value={email}
                                placeholder="Email"
                                readOnly
                            />

                        </div>

                    </div>

                    {/* PASSWORD */}

                    <div className="form-group">

                        <label>
                            Password
                        </label>

                        <div className="input-wrapper">

                            <Lock
                                size={18}
                                className="input-icon"
                            />

                            <input
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                value={password}
                                onChange={(e) =>
                                    setPassword(
                                        e.target.value
                                    )
                                }
                                placeholder="Enter password"
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowPassword(
                                        !showPassword
                                    )
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

                    {/* CONFIRM PASSWORD */}

                    <div className="form-group">

                        <label>
                            Confirm Password
                        </label>

                        <div className="input-wrapper">

                            <Lock
                                size={18}
                                className="input-icon"
                            />

                            <input
                                type={
                                    showConfirmPassword
                                        ? "text"
                                        : "password"
                                }
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(
                                        e.target.value
                                    )
                                }
                                placeholder="Confirm password"
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowConfirmPassword(
                                        !showConfirmPassword
                                    )
                                }
                            >
                                {showConfirmPassword ? (
                                    <EyeOff size={19} />
                                ) : (
                                    <Eye size={19} />
                                )}
                            </button>

                        </div>

                    </div>

                    {/* BUTTON */}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating Password..."
                            : "Create Password"
                        }
                    </button>

                </form>

            </div>

        </div>
    );
};

export default SetPassword;
