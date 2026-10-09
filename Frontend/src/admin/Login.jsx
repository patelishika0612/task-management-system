import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  Users,
  ClipboardCheck,
  CheckCircle2,
} from "lucide-react";
import Swal from "sweetalert2";
import "./AdminLogin.css";
// Form validation helpers
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
    const password = formData.password.trim();

    // ================================
    // BASIC VALIDATION
    // ================================
    if (!email || !password) {
      Swal.fire({
        icon: "warning",
        title: "Required Fields",
        text: "Please enter your email and password.",
        confirmButtonColor: "#1557f5",
      });

      return;
    }

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

      // ==================================================
      // DEMO LOGIN
      // ==================================================
      // Replace this section with your backend API call
      // when your login API is ready.
      //
      // Example:
      //
      // const response = await axios.post(
      //   "YOUR_API_URL/api/admin/login",
      //   {
      //     email,
      //     password,
      //   }
      // );
      //
      // const { token, admin } = response.data;
      // localStorage.setItem("token", token);
      // localStorage.setItem("adminEmail", admin.email);

      // Demo delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      /*
       * DEMO CREDENTIALS
       *
       * Email:
       * admin@gmail.com
       *
       * Password:
       * admin123
       *
       * Remove this condition when connecting your backend API.
       */

      if (email !== "admin@gmail.com" || password !== "admin123") {
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: "Invalid email or password.",
          confirmButtonColor: "#1557f5",
        });

        setLoading(false);
        return;
      }

      // ==================================================
      // SAVE LOGIN INFORMATION
      // ==================================================

      localStorage.setItem("adminEmail", email);

      if (rememberMe) {
        localStorage.setItem("keepLogged", "true");
      } else {
        localStorage.removeItem("keepLogged");
      }

      // Demo token
      localStorage.setItem("token", "demo-admin-token");

      // ==================================================
      // SUCCESS
      // ==================================================

      await Swal.fire({
        icon: "success",
        title: "Welcome Back!",
        text: "Login successful.",
        showConfirmButton: false,
        timer: 1200,
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("LOGIN ERROR:", error);

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
    <h3>Employee Management</h3>
    <span>Employee Portal</span>
  </div>
</div>

          {/* Heading */}
          <div className="admin-login-heading">
         <div className="admin-login-welcome">
  Welcome Employee
</div>

<h1>Sign in to your account</h1>

<p>
  Enter your credentials to access your employee dashboard.
</p>
          </div>

          {/* Login Form */}
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

            {/* Remember Me */}
            <div className="admin-login-options">

              {/* <label className="admin-login-checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(e.target.checked)
                  }
                />

                <span className="admin-login-custom-checkbox">
                  <CheckCircle2 size={13} />
                </span>

                <span>Remember me</span>
              </label> */}

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

       <button
  type="button"
  className="hr-login"
  onClick={() => navigate("/adminLogin")}
>
  HR Login
</button>

          </form>

          {/* Security Information */}
          <div className="admin-login-security">
            <ShieldCheck size={18} />

            <div>
              <strong>Secure Login</strong>
              <span>
                Your account information is protected.
              </span>
            </div>
          </div>

          {/* Footer */}
          {/* <div className="admin-login-card-footer">
            <span>© 2026 HR Management System</span>
            <span className="admin-login-footer-dot">•</span>
            <span>Admin Portal</span>
          </div> */}

        </div>
      </div>
    </div>
  );
};

export default Login;