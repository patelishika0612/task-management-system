import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  ShieldCheck,
  LogIn,
  Send,
} from "lucide-react";
import Swal from "sweetalert2";
import "./AdminLogin.css";
// Form validation helpers
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

const handleForgotPassword = async (e) => {
  e.preventDefault();

  const trimmedEmail = email.trim();

  // ================================
  // VALIDATION
  // ================================
  if (!trimmedEmail) {
    Swal.fire({
      icon: "warning",
      title: "Required Field",
      text: "Please enter your email address.",
      confirmButtonColor: "#1557f5",
    });

    return;
  }

  if (!isValidEmail(trimmedEmail)) {
    Swal.fire({
      icon: "warning",
      title: "Invalid Email",
      text: "Please enter a valid email address.",
      confirmButtonColor: "#1557f5",
    });

    return;
  }

  try {
    setLoading(true);

    // OTP sending API will come here later

    // Directly open OTP page
    navigate("/otp");

  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    Swal.fire({
      icon: "error",
      title: "Something Went Wrong",
      text: "Unable to send OTP. Please try again.",
      confirmButtonColor: "#1557f5",
    });
  } finally {
    setLoading(false);
  }
};

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

          {/* Mobile Logo */}
          <div className="admin-login-mobile-brand">

            <div className="admin-login-mobile-icon">
              <ShieldCheck size={26} />
            </div>

            <div>
              <h3>HR Management</h3>
              <span>Admin Portal</span>
            </div>

          </div>

          {/* Heading */}
          <div className="admin-login-heading">

            <div className="admin-login-welcome">
              Forgot Password
            </div>

            <h1>Reset your password</h1>

            <p>
              Enter your registered email address and we’ll
              send you a password reset link.
            </p>

          </div>

          {/* Forgot Password Form */}
          <form
            className="admin-login-form"
            onSubmit={handleForgotPassword}
          >

            {/* Email */}
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
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />

              </div>

            </div>

            {/* Send Reset Link */}
            <button
              type="submit"
              className="admin-login-submit mt-4"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="admin-login-spinner"></span>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={19} />
                  Send OTP
                </>
              )}

            </button>

            {/* Back To Login */}
            <button
              type="button"
              className="admin-login-forgot"
              onClick={() => navigate("/login")}
              style={{
                width: "100%",
                marginTop: "14px",
              }}
            >
              <LogIn size={16} />
              Back to Login
            </button>

          </form>

          {/* Security Information */}
          <div className="admin-login-security">

            <ShieldCheck size={18} />

            <div>
              <strong>Secure Password Reset</strong>

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

export default ForgotPassword;