
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
import API from "../api";
import "./AdminLogin.css";

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const email = formData.email.trim();
    const password = formData.password;

    // Validate required fields
    if (!email || !password.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Required Fields",
        text: "Please enter your email and password.",
        confirmButtonColor: "#1557f5",
      });
      return;
    }

    // Validate email
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

      // Call employee login API
      const response = await API.post("/employees/login", {
        email,
        password,
      });

      const result = response.data;

      // Check backend response
      if (!result?.success) {
        throw new Error(result?.message || "Invalid email or password.");
      }

      const employee =
        result?.data?.employee ||
        result?.employee ||
        result?.data?.data?.employee ||
        result?.data;

      const employeeId =
        employee?.emp_id ??
        employee?.employee_id ??
        employee?.id;

      if (
        employeeId === undefined ||
        employeeId === null ||
        String(employeeId).trim() === ""
      ) {
        console.error("Unexpected login response:", result);

        throw new Error(
          "Employee ID not found in login response."
        );
      }
      if (!employee || !employee.emp_id) {
        throw new Error("Invalid response received from the server.");
      }

      // Save token only if the backend returns one
      const token = result.token || result.data?.token;

      if (token) {
        localStorage.setItem("token", token);
      }

      // Save employee information
      localStorage.setItem("employeeId", String(employeeId));

      localStorage.setItem(
        "employeeEmail",
        employee?.email || email
      );

      localStorage.setItem(
        "employeeName",
        employee?.emp_name || ""
      );

      localStorage.setItem(
        "employeeImage",
        employee?.image || ""
      );

      console.log("Logged-in employee:", {
        employeeId,
        email: employee?.email || email,
        name: employee?.emp_name || "",
      });

      // Show success message
      await Swal.fire({
        icon: "success",
        title: "Welcome Back!",
        text: "Login successful.",
        showConfirmButton: false,
        timer: 1200,
      });

      // Navigate to employee dashboard
      navigate("/employeedashboard");
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error.response?.data || error.message
      );

      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to login. Please try again.";

      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: message,
        confirmButtonColor: "#1557f5",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-left">
        <div className="admin-login-decoration admin-login-decoration-one" />
        <div className="admin-login-decoration admin-login-decoration-two" />
        <div className="admin-login-decoration admin-login-decoration-three" />
      </div>

      <div className="admin-login-right">
        <div className="admin-login-card">
          <div className="admin-login-mobile-brand">
            <div className="admin-login-mobile-icon">
              <ShieldCheck size={26} />
            </div>

            <div>
              <h3>Employee Management</h3>
              <span>Employee Portal</span>
            </div>
          </div>

          <div className="admin-login-heading">
            <div className="admin-login-welcome">
              Welcome Employee
            </div>

            <h1>Sign in to your account</h1>

            <p>
              Enter your credentials to access your employee dashboard.
            </p>
          </div>

          <form
            className="admin-login-form"
            onSubmit={handleLogin}
          >
            <div className="admin-login-form-group">
              <label htmlFor="email">Email Address</label>

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
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="admin-login-form-group">
              <label htmlFor="password">Password</label>

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
                  required
                />

                <button
                  type="button"
                  className="admin-login-password-toggle"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
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

            <div className="admin-login-options">
              <button
                type="button"
                className="admin-login-forgot"
                onClick={() => navigate("/forgotpassword")}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="admin-login-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="admin-login-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={19} />
                  Sign In
                </>
              )}
            </button>

            <button
              type="button"
              className="hr-login"
              onClick={() => navigate("/adminLogin")}
            >
              HR Login
            </button>
          </form>

          <div className="admin-login-security">
            <ShieldCheck size={18} />

            <div>
              <strong>Secure Login</strong>
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

export default Login;
