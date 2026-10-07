import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Lock,
  Bell,
  Palette,
  Globe,
  Clock3,
  ShieldCheck,
  Save,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import Swal from "sweetalert2";
import "./AdminSettings.css";
import {
  onlyDigits, onlyLetters, isValidEmail, isValidPhone,
  isValidName, phoneInputProps,
} from "../validation";

const warn = (title, text) =>
  Swal.fire({ icon: "warning", title, text, confirmButtonColor: "#1557f5" });

const Settings = () => {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("account");

  const [accountData, setAccountData] = useState({
    name: "HR Admin",
    email: localStorage.getItem("adminEmail") || "admin@gmail.com",
    phone: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState({
    taskAssigned: true,
    taskCompleted: true,
    emailNotification: true,
    systemNotification: true,
  });

  const [appearance, setAppearance] = useState({
    compactMode: false,
  });

  const [systemData, setSystemData] = useState({
    language: "English",
    timezone: "Asia/Kolkata",
  });

  // =====================================================
  // ACCOUNT CHANGE
  // =====================================================

  const handleAccountChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;
    if (name === "phone") value = onlyDigits(value, 10);
    else if (name === "name") value = onlyLetters(value);

    setAccountData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // PASSWORD CHANGE
  // =====================================================

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // SAVE ACCOUNT
  // =====================================================

  const handleSaveAccount = async () => {
    if (!accountData.name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Name Required",
        text: "Please enter your name.",
        confirmButtonColor: "#1557f5",
      });

      return;
    }

    if (!accountData.email.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Email Required",
        text: "Please enter your email address.",
        confirmButtonColor: "#1557f5",
      });

      return;
    }

    if (accountData.name.trim().length < 2 || !isValidName(accountData.name)) {
      warn("Invalid Name", "Name must contain only letters (min 2 characters).");
      return;
    }

    if (!isValidEmail(accountData.email)) {
      warn("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (accountData.phone && !isValidPhone(accountData.phone)) {
      warn("Invalid Phone", "Phone must be a valid 10-digit mobile number.");
      return;
    }

    localStorage.setItem("adminEmail", accountData.email.trim());

    await Swal.fire({
      icon: "success",
      title: "Settings Saved",
      text: "Your account information has been updated.",
      showConfirmButton: false,
      timer: 1400,
    });
  };

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  const handleChangePassword = async (e) => {
    e.preventDefault();

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "Required Fields",
        text: "Please fill all password fields.",
        confirmButtonColor: "#1557f5",
      });

      return;
    }

    if (newPassword.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Password Too Short",
        text: "New password must contain at least 6 characters.",
        confirmButtonColor: "#1557f5",
      });

      return;
    }

    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      warn("Weak Password", "New password must contain at least one letter and one number.");
      return;
    }

    if (newPassword === currentPassword) {
      warn("Same Password", "New password must be different from current password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Password Mismatch",
        text: "New password and confirm password do not match.",
        confirmButtonColor: "#1557f5",
      });

      return;
    }

    await Swal.fire({
      icon: "success",
      title: "Password Updated",
      text: "Your password has been changed successfully.",
      showConfirmButton: false,
      timer: 1400,
    });

    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
    const result = await Swal.fire({
      icon: "question",
      title: "Logout?",
      text: "Are you sure you want to logout?",
      showCancelButton: true,
      confirmButtonText: "Logout",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#1557f5",
    });

    if (result.isConfirmed) {
      localStorage.removeItem("adminEmail");
      localStorage.removeItem("token");
      localStorage.removeItem("keepLogged");

      navigate("/adminLogin");
    }
  };

  // =====================================================
  // SETTINGS MENU
  // =====================================================

  const settingsMenu = [
    {
      id: "account",
      label: "Account",
      description: "Personal information",
      icon: <User size={19} />,
    },
    {
      id: "security",
      label: "Security",
      description: "Password & security",
      icon: <Lock size={19} />,
    },
    {
      id: "notifications",
      label: "Notifications",
      description: "Notification preferences",
      icon: <Bell size={19} />,
    },
    {
      id: "appearance",
      label: "Appearance",
      description: "Display preferences",
      icon: <Palette size={19} />,
    },
    {
      id: "system",
      label: "System",
      description: "Language & timezone",
      icon: <Globe size={19} />,
    },
  ];

  return (
    <div className="hr-settings-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="hr-settings-header">
        <div>
          <div className="hr-settings-breadcrumb">
            <button
              type="button"
              onClick={() => navigate("/")}
            >
              Dashboard
            </button>

            <span>/</span>

            <span>Settings</span>
          </div>

          <h1>Settings</h1>

          <p>
            Manage your account, security and system preferences.
          </p>
        </div>
      </div>

      {/* =================================================
          SETTINGS LAYOUT
      ================================================= */}

      <div className="hr-settings-layout">

        {/* =================================================
            LEFT MENU
        ================================================= */}

        <div className="hr-settings-sidebar">

          <div className="hr-settings-sidebar-title">
            Settings
          </div>

          <div className="hr-settings-menu">

            {settingsMenu.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`hr-settings-menu-item ${
                  activeSection === item.id
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActiveSection(item.id)
                }
              >
                <span className="hr-settings-menu-icon">
                  {item.icon}
                </span>

                <span className="hr-settings-menu-text">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>

                <ChevronRight size={16} />
              </button>
            ))}

          </div>

          {/* Logout */}

          <button
            type="button"
            className="hr-settings-logout"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>

        {/* =================================================
            RIGHT CONTENT
        ================================================= */}

        <div className="hr-settings-content">

          {/* =================================================
              ACCOUNT
          ================================================= */}

          {activeSection === "account" && (
            <div className="hr-settings-card">

              <div className="hr-settings-card-header">
                <div className="hr-settings-card-icon">
                  <User size={21} />
                </div>

                <div>
                  <h2>Account Information</h2>
                  <p>
                    Update your personal and contact information.
                  </p>
                </div>
              </div>

              <div className="hr-settings-profile-box">

                <div className="hr-settings-avatar">
                  HR
                </div>

                <div>
                  <h3>{accountData.name || "HR Admin"}</h3>
                  <span>Human Resources Administrator</span>
                </div>

              </div>

              <div className="hr-settings-form-grid">

                <div className="hr-settings-form-group">
                  <label>Full Name</label>

                  <div className="hr-settings-input">
                    <User size={18} />

                    <input
                      type="text"
                      name="name"
                      value={accountData.name}
                      onChange={handleAccountChange}
                      placeholder="Enter your name"
                    />
                  </div>
                </div>

                <div className="hr-settings-form-group">
                  <label>Email Address</label>

                  <div className="hr-settings-input">
                    <Mail size={18} />

                    <input
                      type="email"
                      name="email"
                      value={accountData.email}
                      onChange={handleAccountChange}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="hr-settings-form-group">
                  <label>Phone Number</label>

                  <div className="hr-settings-input">
                    <Phone size={18} />

                    <input
                      {...phoneInputProps}
                      name="phone"
                      value={accountData.phone}
                      onChange={handleAccountChange}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="hr-settings-form-group">
                  <label>Role</label>

                  <div className="hr-settings-input hr-settings-disabled">
                    <ShieldCheck size={18} />

                    <input
                      type="text"
                      value="HR Administrator"
                      disabled
                    />
                  </div>
                </div>

              </div>

              <div className="hr-settings-card-footer">
                <button
                  type="button"
                  className="hr-settings-save-btn"
                  onClick={handleSaveAccount}
                >
                  <Save size={17} />
                  Save Changes
                </button>
              </div>

            </div>
          )}

          {/* =================================================
              SECURITY
          ================================================= */}

          {activeSection === "security" && (
            <div className="hr-settings-card">

              <div className="hr-settings-card-header">
                <div className="hr-settings-card-icon">
                  <Lock size={21} />
                </div>

                <div>
                  <h2>Security</h2>
                  <p>
                    Keep your account secure by updating your password.
                  </p>
                </div>
              </div>

              <form
                className="hr-settings-password-form"
                onSubmit={handleChangePassword}
              >

                <div className="hr-settings-form-group">
                  <label>Current Password</label>

                  <div className="hr-settings-input">
                    <Lock size={18} />

                    <input
                      type={showPasswords.currentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                    />

                    <button
                      type="button"
                      className="hr-settings-password-toggle"
                      onClick={() => togglePasswordVisibility("currentPassword")}
                      aria-label={showPasswords.currentPassword ? "Hide password" : "Show password"}
                    >
                      {showPasswords.currentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="hr-settings-form-group">
                  <label>New Password</label>

                  <div className="hr-settings-input">
                    <Lock size={18} />

                    <input
                      type={showPasswords.newPassword ? "text" : "password"}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                    />

                    <button
                      type="button"
                      className="hr-settings-password-toggle"
                      onClick={() => togglePasswordVisibility("newPassword")}
                      aria-label={showPasswords.newPassword ? "Hide password" : "Show password"}
                    >
                      {showPasswords.newPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="hr-settings-form-group">
                  <label>Confirm New Password</label>

                  <div className="hr-settings-input">
                    <Lock size={18} />

                    <input
                      type={showPasswords.confirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                    />

                    <button
                      type="button"
                      className="hr-settings-password-toggle"
                      onClick={() => togglePasswordVisibility("confirmPassword")}
                      aria-label={showPasswords.confirmPassword ? "Hide password" : "Show password"}
                    >
                      {showPasswords.confirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="hr-settings-password-note">
                  <ShieldCheck size={17} />

                  <span>
                    Use at least 6 characters for your password.
                  </span>
                </div>

                <button
                  type="submit"
                  className="hr-settings-save-btn"
                >
                  <Save size={17} />
                  Update Password
                </button>

              </form>
            </div>
          )}

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          {activeSection === "notifications" && (
            <div className="hr-settings-card">

              <div className="hr-settings-card-header">
                <div className="hr-settings-card-icon">
                  <Bell size={21} />
                </div>

                <div>
                  <h2>Notifications</h2>
                  <p>
                    Choose which notifications you want to receive.
                  </p>
                </div>
              </div>

              <div className="hr-settings-toggle-list">

                <label className="hr-settings-toggle-row">
                  <div>
                    <strong>Task Assigned</strong>
                    <span>
                      Notify me when a task is assigned.
                    </span>
                  </div>

                  <input
                    type="checkbox"
                    checked={notifications.taskAssigned}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        taskAssigned: e.target.checked,
                      })
                    }
                  />

                  <span className="hr-settings-toggle"></span>
                </label>

                <label className="hr-settings-toggle-row">
                  <div>
                    <strong>Task Completed</strong>
                    <span>
                      Notify me when an employee completes a task.
                    </span>
                  </div>

                  <input
                    type="checkbox"
                    checked={notifications.taskCompleted}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        taskCompleted: e.target.checked,
                      })
                    }
                  />

                  <span className="hr-settings-toggle"></span>
                </label>

                <label className="hr-settings-toggle-row">
                  <div>
                    <strong>Email Notifications</strong>
                    <span>
                      Receive important updates by email.
                    </span>
                  </div>

                  <input
                    type="checkbox"
                    checked={notifications.emailNotification}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        emailNotification: e.target.checked,
                      })
                    }
                  />

                  <span className="hr-settings-toggle"></span>
                </label>

                <label className="hr-settings-toggle-row">
                  <div>
                    <strong>System Notifications</strong>
                    <span>
                      Receive notifications inside the dashboard.
                    </span>
                  </div>

                  <input
                    type="checkbox"
                    checked={notifications.systemNotification}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        systemNotification: e.target.checked,
                      })
                    }
                  />

                  <span className="hr-settings-toggle"></span>
                </label>

              </div>

            </div>
          )}

          {/* =================================================
              APPEARANCE
          ================================================= */}

          {activeSection === "appearance" && (
            <div className="hr-settings-card">

              <div className="hr-settings-card-header">
                <div className="hr-settings-card-icon">
                  <Palette size={21} />
                </div>

                <div>
                  <h2>Appearance</h2>
                  <p>
                    Customize how the admin dashboard looks.
                  </p>
                </div>
              </div>

              <div className="hr-settings-appearance">

                <div className="hr-settings-theme-preview">

                  <div className="hr-settings-preview-sidebar"></div>

                  <div className="hr-settings-preview-main">
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>

                </div>

                <div className="hr-settings-theme-info">
                  <strong>Default Theme</strong>

                  <span>
                    Clean blue and white admin interface.
                  </span>
                </div>

              </div>

              <label className="hr-settings-toggle-row">
                <div>
                  <strong>Compact Mode</strong>

                  <span>
                    Reduce spacing between dashboard elements.
                  </span>
                </div>

                <input
                  type="checkbox"
                  checked={appearance.compactMode}
                  onChange={(e) =>
                    setAppearance({
                      ...appearance,
                      compactMode: e.target.checked,
                    })
                  }
                />

                <span className="hr-settings-toggle"></span>
              </label>

            </div>
          )}

          {/* =================================================
              SYSTEM
          ================================================= */}

          {activeSection === "system" && (
            <div className="hr-settings-card">

              <div className="hr-settings-card-header">
                <div className="hr-settings-card-icon">
                  <Globe size={21} />
                </div>

                <div>
                  <h2>System Preferences</h2>
                  <p>
                    Manage language and timezone settings.
                  </p>
                </div>
              </div>

              <div className="hr-settings-form-grid">

                <div className="hr-settings-form-group">
                  <label>Language</label>

                  <div className="hr-settings-input">
                    <Globe size={18} />

                    <select
                      value={systemData.language}
                      onChange={(e) =>
                        setSystemData({
                          ...systemData,
                          language: e.target.value,
                        })
                      }
                    >
                      <option>English</option>
                      <option>Gujarati</option>
                      <option>Hindi</option>
                    </select>
                  </div>
                </div>

                <div className="hr-settings-form-group">
                  <label>Timezone</label>

                  <div className="hr-settings-input">
                    <Clock3 size={18} />

                    <select
                      value={systemData.timezone}
                      onChange={(e) =>
                        setSystemData({
                          ...systemData,
                          timezone: e.target.value,
                        })
                      }
                    >
                      <option value="Asia/Kolkata">
                        India Standard Time
                      </option>

                      <option value="UTC">
                        UTC
                      </option>

                      <option value="America/New_York">
                        Eastern Time
                      </option>
                    </select>
                  </div>
                </div>

              </div>

              <div className="hr-settings-info-box">
                <CheckCircle2 size={18} />

                <div>
                  <strong>System Ready</strong>

                  <span>
                    Your HR management system is configured
                    and ready to use.
                  </span>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;