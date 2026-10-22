
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  LogOut,
  Globe,
  ChevronDown,
  BriefcaseBusiness,
  Bell,
} from "lucide-react";

import API from "../api";
import UserImg from "../img/user.png";
import "./EmployeeHeader.css";

const getImageUrl = (image) => {
  if (!image) return "";

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  const apiBase = String(
    API.defaults.baseURL || ""
  ).replace(/\/api\/?$/, "");

  const uploadsBase = String(
    import.meta.env.VITE_UPLOADS_URL ||
      `${apiBase}/uploads`
  ).replace(/\/$/, "");

  if (image.startsWith("/uploads/")) {
    return `${apiBase}${image}`;
  }

  if (image.startsWith("uploads/")) {
    return `${uploadsBase}/${image.slice(8)}`;
  }

  return `${uploadsBase}/${image.replace(/^\/+/, "")}`;
};

const EmployeeHeader = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [employeeName, setEmployeeName] = useState(
    localStorage.getItem("employeeName") || ""
  );

  const [employeeEmail, setEmployeeEmail] = useState(
    localStorage.getItem("employeeEmail") || ""
  );

  const [profileImage, setProfileImage] = useState(() =>
    getImageUrl(localStorage.getItem("employeeImage") || "")
  );

  // Fetch logged-in employee profile
  useEffect(() => {
    let cancelled = false;

    const fetchEmployeeProfile = async () => {
      const email = localStorage.getItem("employeeEmail") || "";
      const savedName = localStorage.getItem("employeeName") || "";
      const savedImage = localStorage.getItem("employeeImage") || "";

      setEmployeeEmail(email);
      setEmployeeName(savedName);
      setProfileImage(getImageUrl(savedImage));

      if (!email) return;

      try {
        const response = await API.get(
          `/employees/profile?email=${encodeURIComponent(email)}`
        );

        if (cancelled) return;

        const result = response.data;
        const employee =
          result?.data?.employee ||
          result?.data ||
          result?.employee ||
          null;

        if (!employee) {
          setProfileImage(getImageUrl(savedImage));
          return;
        }

        const name = employee.emp_name || savedName;
        const actualEmail = employee.email || email;
        const image = employee.image || savedImage;

        setEmployeeName(name);
        setEmployeeEmail(actualEmail);
        setProfileImage(getImageUrl(image));

        localStorage.setItem("employeeName", name);
        localStorage.setItem("employeeEmail", actualEmail);

        if (image) {
          localStorage.setItem("employeeImage", image);
        }
      } catch (error) {
        console.error("Employee profile error:", error);

        if (!cancelled) {
          setProfileImage(getImageUrl(savedImage));
        }
      }
    };

    fetchEmployeeProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const handleLogout = () => {
    [
      "employeeId",
      "employeeEmail",
      "employeeName",
      "employeeImage",
      "token",
      "keepLogged",
    ].forEach((key) => localStorage.removeItem(key));

    setEmployeeName("");
    setEmployeeEmail("");
    setProfileImage("");
    setDropdownOpen(false);

    navigate("/admin-login");
  };

  const handleProfile = () => {
    setDropdownOpen(false);

    navigate(
      `/profile?email=${encodeURIComponent(employeeEmail)}`
    );
  };

  const handleCompanyProfile = () => {
    setDropdownOpen(false);
    navigate("/company-profile");
  };

  const handleWebsite = () => {
    window.open(
      "https://nirvanzainfotech.co.in/#gsc.tab=0",
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleImageError = (event) => {
    if (event.currentTarget.src !== UserImg) {
      event.currentTarget.src = UserImg;
    }
  };

  return (
    <header className="admin-header">
      <div className="admin-header-right">
        <button
          type="button"
          className="admin-header-globe globe2"
          onClick={handleWebsite}
          title="Visit Nirvanza Infotech"
        >
          <Globe size={20} />
        </button>

        <button
          type="button"
          className="admin-header-globe"
          title="Notifications"
        >
          <Bell size={20} />
        </button>

        {employeeEmail && (
          <div
            className={`admin-user-wrapper ${
              dropdownOpen ? "admin-user-wrapper-open" : ""
            }`}
            ref={dropdownRef}
          >
            <button
              type="button"
              className="admin-user-btn"
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              <div className="admin-user-avatar">
                <img
                  src={profileImage || UserImg}
                  alt="Employee profile"
                  className="admin-avatar-image"
                  onError={handleImageError}
                />
              </div>

              <div className="admin-user-details">
                <span className="admin-user-name">
                  {employeeName || "Employee"}
                </span>

                <span className="admin-user-email">
                  {employeeEmail}
                </span>
              </div>

              <ChevronDown
                size={17}
                className={`admin-user-arrow ${
                  dropdownOpen ? "admin-user-arrow-open" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="admin-user-dropdown">
                <div className="admin-dropdown-header">
                  <div className="admin-dropdown-avatar">
                    <img
                      src={profileImage || UserImg}
                      alt="Employee profile"
                      className="admin-avatar-image"
                      onError={handleImageError}
                    />
                  </div>

                  <div className="admin-dropdown-user">
                    <strong>{employeeName || "Employee"}</strong>
                    <span>{employeeEmail}</span>
                  </div>
                </div>

                <div className="admin-dropdown-divider" />

                <button
                  type="button"
                  className="admin-dropdown-item"
                  onClick={handleProfile}
                >
                  <span className="admin-dropdown-item-icon">
                    <User size={17} />
                  </span>
                  <span>My Profile</span>
                </button>

                <div className="admin-dropdown-divider" />

                <button
                  type="button"
                  className="admin-dropdown-item"
                  onClick={handleCompanyProfile}
                >
                  <span className="admin-dropdown-item-icon">
                    <BriefcaseBusiness size={17} />
                  </span>
                  <span>Company Profile</span>
                </button>

                <div className="admin-dropdown-divider" />

                <button
                  type="button"
                  className="admin-dropdown-item admin-dropdown-logout"
                  onClick={handleLogout}
                >
                  <span className="admin-dropdown-item-icon">
                    <LogOut size={17} />
                  </span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default EmployeeHeader;
