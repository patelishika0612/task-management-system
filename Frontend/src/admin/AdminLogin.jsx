import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import Swal from "sweetalert2";
import "./AdminLogin.css";
// Form validation helpers
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());

const AdminLogin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle HR/Admin Login
  const handleLogin = async (e) => {
    e.preventDefault();

    const email = formData.email.trim();
    const password = formData.password.trim();

    // Required validation
    if (!email || !password) {
      Swal.fire({
        icon: "warning",
        title: "Required Fields",
        text: "Please enter your email and password.",
        confirmButtonColor: "#1557f5",
      });

      return;
    }

    // Email validation
    if (!isValidEmail(email)) {
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

      // Demo loading
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Demo HR credentials
      if (
        email !== "admin@gmail.com" ||
        password !== "admin123"
      ) {
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: "Invalid HR email or password.",
          confirmButtonColor: "#1557f5",
        });

        setLoading(false);
        return;
      }

      // Store HR/Admin login data
      localStorage.setItem("adminEmail", email);
      localStorage.setItem("token", "demo-admin-token");
      localStorage.setItem("role", "admin");

      // Success message
      await Swal.fire({
        icon: "success",
        title: "Welcome Back!",
        text: "HR login successful.",
        showConfirmButton: false,
        timer: 1200,
      });

      // Go to HR dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("ADMIN LOGIN ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Something Went Wrong",
        text: "Unable to login. Please try again.",
        confirmButtonColor: "#1557f5",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">

      {/* ================= LEFT SIDE ================= */}
      <div className="admin-login-left">

        <div className="admin-login-decoration admin-login-decoration-one"></div>

        <div className="admin-login-decoration admin-login-decoration-two"></div>

        <div className="admin-login-decoration admin-login-decoration-three"></div>

      </div>

      {/* ================= RIGHT SIDE ================= */}
      <div className="admin-login-right">

        <div className="admin-login-card">

          {/* Mobile Brand */}
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
              Welcome Back
            </div>

            <h1>Sign in to your account</h1>

            <p>
              Enter your credentials to access the HR dashboard.
            </p>

          </div>

          {/* ================= LOGIN FORM ================= */}
          <form
            className="admin-login-form"
            onSubmit={handleLogin}
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
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />

              </div>

            </div>

            {/* Password */}
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
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
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

            {/* Forgot Password */}
            <div className="admin-login-options">

              <button
                type="button"
                className="admin-login-forgot"
                onClick={() => navigate("/forgotpassword")}
              >
                Forgot Password?
              </button>

            </div>

            {/* Login Button */}
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

            {/* Employee Login */}
            <button
              type="button"
              className="hr-login"
              onClick={() => navigate("/login")}
            >
              Employee Login
            </button>

          </form>

          {/* Security Information */}
          <div className="admin-login-security">

            <ShieldCheck size={18} />

            <div>

              <strong>
                Secure HR Login
              </strong>

              <span>
                Your HR account information is protected.
              </span>

            </div>

          </div>

          {/* Demo Credentials */}
          {/* <div
            style={{
              marginTop: "18px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#f5f8ff",
              border: "1px solid #e2e9f7",
              fontSize: "13px",
              color: "#667085",
            }}
          >
            <strong
              style={{
                display: "block",
                marginBottom: "5px",
                color: "#1557f5",
              }}
            >
              Demo HR Login
            </strong>

            <div>
              Email: admin@gmail.com
            </div>

            <div>
              Password: admin123
            </div>
          </div> */}

        </div>

      </div>

    </div>
  );
};

export default AdminLogin;