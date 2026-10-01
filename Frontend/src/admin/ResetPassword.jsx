import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  LogIn,
  CheckCircle2,
} from "lucide-react";
import Swal from "sweetalert2";
import "./AdminLogin.css";

const ResetPassword = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ==================================================
  // HANDLE CHANGE
  // ==================================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==================================================
  // RESET PASSWORD
  // ==================================================
  const handleResetPassword = async (e) => {
    e.preventDefault();

    const newPassword = formData.newPassword.trim();
    const confirmPassword = formData.confirmPassword.trim();

    // ================================
    // REQUIRED VALIDATION
    // ================================
    if (!newPassword || !confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "Required Fields",
        text: "Please enter new password and confirm password.",
        confirmButtonColor: "#1557f5",
      });

      return;
    }

    // ================================
    // PASSWORD LENGTH
    // ================================
    if (newPassword.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Weak Password",
        text: "Password must be at least 6 characters long.",
        confirmButtonColor: "#1557f5",
      });

      return;
    }

    // ================================
    // PASSWORD MATCH
    // ================================
    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Password Mismatch",
        text: "New password and confirm password do not match.",
        confirmButtonColor: "#1557f5",
      });

      return;
    }

    try {
      setLoading(true);

      // ==================================================
      // RESET PASSWORD API
      // ==================================================
      // Replace this section with your backend API call.
      //
      // Example:
      //
      // const response = await axios.post(
      //   "YOUR_API_URL/api/admin/reset-password",
      //   {
      //     password: newPassword,
      //     confirmPassword,
      //   }
      // );

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // ==================================================
      // SUCCESS
      // ==================================================

      await Swal.fire({
        icon: "success",
        title: "Password Reset Successfully",
        text: "Your new password has been created successfully.",
        confirmButtonColor: "#1557f5",
      });

      navigate("/login");

    } catch (error) {
      console.error("RESET PASSWORD ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Something Went Wrong",
        text: "Unable to reset password. Please try again.",
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
              Create New Password
            </div>

            <h1>Set your new password</h1>

            <p>
              Create a strong password for your account.
            </p>

          </div>

          {/* Reset Password Form */}
          <form
            className="admin-login-form"
            onSubmit={handleResetPassword}
          >

            {/* New Password */}
            <div className="admin-login-form-group">

              <label htmlFor="newPassword">
                New Password
              </label>

              <div className="admin-login-input-wrapper">

                <Lock
                  size={19}
                  className="admin-login-input-icon"
                />

                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="admin-login-password-toggle"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
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

            {/* Confirm Password */}
            <div className="admin-login-form-group">

              <label htmlFor="confirmPassword">
                Confirm Password
              </label>

              <div className="admin-login-input-wrapper">

                <Lock
                  size={19}
                  className="admin-login-input-icon"
                />

                <input
                  id="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="admin-login-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword((prev) => !prev)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
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

            {/* Password Information */}
            <div className="admin-login-security">

              <ShieldCheck size={18} />

              <div>
                <strong>Password Requirements</strong>

                <span>
                  Use at least 6 characters for your password.
                </span>
              </div>

            </div>

            {/* Reset Password Button */}
            <button
              type="submit"
              className="admin-login-submit mt-4"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="admin-login-spinner"></span>
                  Resetting...
                </>
              ) : (
                <>
                  <CheckCircle2 size={19} />
                  Reset Password
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

        </div>

      </div>

    </div>
  );
};

export default ResetPassword;