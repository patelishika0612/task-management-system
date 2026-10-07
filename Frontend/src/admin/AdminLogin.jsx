
import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import "./AdminLogin.css";

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
          password: password,
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
          email: result.data.email,
        })
      );

      // =================================================
      // SUCCESS
      // =================================================

      setSuccess("Login successful!");

      // =================================================
      // REDIRECT
      // =================================================

      setTimeout(() => {
        navigate(
          `/?email=${encodeURIComponent(email)}`
        );
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

      {/* ==================================================
          LEFT SIDE
      ================================================== */}

      <div className="admin-login-left">

        {/* Decorative Shapes */}

        <div className="admin-login-decoration admin-login-decoration-one"></div>

        <div className="admin-login-decoration admin-login-decoration-two"></div>

        <div className="admin-login-decoration admin-login-decoration-three"></div>

      </div>

      {/* ==================================================
          RIGHT SIDE
      ================================================== */}

      <div className="admin-login-right">

        <div className="admin-login-card">

          {/* ==================================================
              MOBILE BRAND
          ================================================== */}

          <div className="admin-login-mobile-brand">

            <div className="admin-login-mobile-icon">
              <ShieldCheck size={26} />
            </div>

            <div>
              <h3>Employee Management</h3>
              <span>Admin Portal</span>
            </div>

          </div>

          {/* ==================================================
              HEADING
          ================================================== */}

          <div className="admin-login-heading">

            <div className="admin-login-welcome">
              Welcome Admin
            </div>

            <h1>
              Sign in to your account
            </h1>

            <p>
              Enter your credentials to access
              your admin dashboard.
            </p>

          </div>

          {/* ==================================================
              ERROR MESSAGE
          ================================================== */}

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          {/* ==================================================
              SUCCESS MESSAGE
          ================================================== */}

          {success && (
            <div className="login-success">
              {success}
            </div>
          )}

          {/* ==================================================
              LOGIN FORM
          ================================================== */}

          <form
            className="admin-login-form"
            onSubmit={handleLogin}
          >

            {/* ==================================================
                EMAIL
            ================================================== */}

            <div className="admin-login-form-group">

              <label htmlFor="email">
                Email Address
              </label>

              <div className="admin-login-input-wrapper">

                <Mail
                  size={19}
                  className="admin-login-input-icon"
                />

                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  autoComplete="email"
                  required
                />

              </div>

            </div>

            {/* ==================================================
                PASSWORD
            ================================================== */}

            <div className="admin-login-form-group">

              <label htmlFor="password">
                Password
              </label>

              <div className="admin-login-input-wrapper">

                <Lock
                  size={19}
                  className="admin-login-input-icon"
                />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="admin-login-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (prev) => !prev
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

            {/* ==================================================
                LOGIN OPTIONS
            ================================================== */}

            <div className="admin-login-options">

              <button
                type="button"
                className="admin-login-forgot"
                onClick={() =>
                  navigate("/forgotpassword")
                }
              >
                Forgot Password?
              </button>

            </div>

            {/* ==================================================
                LOGIN BUTTON
            ================================================== */}

            <button
              type="submit"
              className="admin-login-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="admin-login-spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={19} />
                  Sign In
                </>
              )}
            </button>

            {/* ==================================================
                EMPLOYEE LOGIN
            ================================================== */}

            <button
              type="button"
              className="hr-login"
              onClick={() =>
                navigate("/")
              }
            >
              Employee Login
            </button>

          </form>

          {/* ==================================================
              SECURITY INFORMATION
          ================================================== */}

          <div className="admin-login-security">

            <ShieldCheck size={18} />

            <div>

              <strong>
                Secure Login
              </strong>

              <span>
                Your account information is protected.
              </span>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminLogin;
