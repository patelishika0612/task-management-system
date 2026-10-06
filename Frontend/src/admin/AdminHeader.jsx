
import React, { useState, useRef, useEffect } from "react";
import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  User,
  LogOut,
  Globe,
  ChevronDown,
  BriefcaseBusiness,
  Settings,
  Bell,
} from "lucide-react";

import API from "../api";
import UserImg from "../img/user.png";

import "./AdminHeader.css";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // =====================================================
  // STATES
  // =====================================================

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [adminEmail, setAdminEmail] = useState("");

  const [profileImage, setProfileImage] = useState("");

  const dropdownRef = useRef(null);

  // =====================================================
  // GET EMAIL FROM URL / LOCAL STORAGE
  // =====================================================

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const emailFromURL = params.get("email");

    const emailFromStorage =
      localStorage.getItem("adminEmail") || "";

    const email =
      emailFromURL ||
      emailFromStorage ||
      "";

    if (email) {
      setAdminEmail(email);

      localStorage.setItem(
        "adminEmail",
        email
      );
    }
  }, [location.search]);


// ====================================================
// GET EMPLOYEE PROFILE
// =====================================================

useEffect(() => {
  const fetchEmployeeProfile = async () => {
    if (!adminEmail) {
      return;
    }

    try {
      const response = await API.get(
        `/employees/profile?email=${encodeURIComponent(
          adminEmail
        )}`
      );

      console.log(
        "Header employee profile:",
        response.data
      );

      if (response.data.success) {
        const employeeData =
          response.data.data;

        // =============================================
        // GET UPLOADED IMAGE
        // =============================================

        if (employeeData?.image) {
          let imageUrl = employeeData.image;

          // API base URL:
          // http://localhost:5000/api
          //
          // Backend URL:
          // http://localhost:5000

          const backendUrl =
            API.defaults.baseURL.replace("/api", "");

          // If database returns:
          // /uploads/employee-image.jpeg

          if (imageUrl.startsWith("/")) {
            imageUrl =
              `${backendUrl}${imageUrl}`;
          }

          // If database returns:
          // uploads/employee-image.jpeg

          else if (
            !imageUrl.startsWith("http")
          ) {
            imageUrl =
              `${backendUrl}/${imageUrl}`;
          }

          // Cache busting
          imageUrl =
            `${imageUrl}${
              imageUrl.includes("?")
                ? "&"
                : "?"
            }t=${Date.now()}`;

          console.log(
            "Header image URL:",
            imageUrl
          );

          setProfileImage(imageUrl);
        } else {
          setProfileImage("");
        }
      }
    } catch (error) {
      console.error(
        "Header profile fetch error:",
        error
      );

      setProfileImage("");
    }
  };

  fetchEmployeeProfile();

}, [adminEmail]);


  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {

    localStorage.removeItem(
      "adminEmail"
    );

    localStorage.removeItem("token");

    localStorage.removeItem(
      "keepLogged"
    );

    setAdminEmail("");

    setProfileImage("");

    setDropdownOpen(false);

    navigate("/admin-login");
  };

  // =====================================================
  // PROFILE
  // =====================================================

  const handleProfile = () => {

    setDropdownOpen(false);

    navigate(
      `/profile?email=${encodeURIComponent(
        adminEmail
      )}`
    );
  };

  // =====================================================
  // COMPANY PROFILE
  // =====================================================

  const handleCompanyProfile = () => {

    setDropdownOpen(false);

    navigate("/adduser");
  };

  // =====================================================
  // SETTINGS
  // =====================================================

  const handleSettings = () => {

    setDropdownOpen(false);

    navigate("/settings");
  };

  // =====================================================
  // WEBSITE
  // =====================================================

  const handleWebsite = () => {

    window.open(
      "https://nirvanzainfotech.co.in/#gsc.tab=0",
      "_blank",
      "noopener,noreferrer"
    );
  };


// =====================================================
// CLICK OUTSIDE DROPDOWN
// =====================================================

useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target)
    ) {
      setDropdownOpen(false);
    }
  };

  document.addEventListener(
    "mousedown",
    handleClickOutside
  );

  return () => {
    document.removeEventListener(
      "mousedown",
      handleClickOutside
    );
  };
}, []);


  // =====================================================
  // IMAGE ERROR
  // =====================================================

  const handleImageError = (event) => {

    console.error(
      "Profile image could not be loaded:",
      event.currentTarget.src
    );

    event.currentTarget.src =
      UserImg;
  };

  // =====================================================
  // RETURN
  // =====================================================

  return (
    <header className="admin-header">

      {/* =================================================
          RIGHT SIDE
      ================================================= */}

      <div className="admin-header-right">

        {/* WEBSITE */}

        <button
          type="button"
          className="admin-header-globe globe2"
          onClick={handleWebsite}
          title="Visit Nirvanza Infotech"
        >
          <Globe size={20} />
        </button>

        {/* NOTIFICATION */}

        <button
          type="button"
          className="admin-header-globe"
          title="Notifications"
        >
          <Bell size={20} />
        </button>

        {/* =================================================
            ADMIN USER
        ================================================= */}

        {adminEmail && (

          <div
            className={`admin-user-wrapper ${dropdownOpen
                ? "admin-user-wrapper-open"
                : ""
              }`}
            ref={dropdownRef}
          >

            {/* =================================================
                USER BUTTON
            ================================================= */}

            <button
              type="button"
              className="admin-user-btn"
              onClick={() =>
                setDropdownOpen(
                  (prev) => !prev
                )
              }
            >

              {/* PROFILE IMAGE */}

              <div className="admin-user-avatar">

                <img
                  src={
                    profileImage || UserImg
                  }
                  alt="Profile"
                  className="admin-avatar-image"
                  onError={handleImageError}
                />

              </div>

              {/* USER DETAILS */}

              <div className="admin-user-details">

                <span className="admin-user-name">
                  Admin
                </span>

                <span className="admin-user-email">
                  {adminEmail}
                </span>

              </div>

              {/* ARROW */}

              <ChevronDown
                size={17}
                className={`admin-user-arrow ${dropdownOpen
                    ? "admin-user-arrow-open"
                    : ""
                  }`}
              />

            </button>

            {/* =================================================
                DROPDOWN
            ================================================= */}

            {dropdownOpen && (

              <div className="admin-user-dropdown">

                {/* DROPDOWN HEADER */}

                <div className="admin-dropdown-header">

                  {/* PROFILE IMAGE */}

                  <div className="admin-dropdown-avatar">

                    <img
                      src={
                        profileImage ||
                        UserImg
                      }
                      alt="Profile"
                      className="admin-avatar-image"
                      onError={handleImageError}
                    />

                  </div>

                  {/* USER DETAILS */}

                  <div className="admin-dropdown-user">

                    <strong>
                      Admin
                    </strong>

                    <span>
                      {adminEmail}
                    </span>

                  </div>

                </div>

                {/* DIVIDER */}

                <div className="admin-dropdown-divider" />

                {/* MY PROFILE */}

                <button
                  type="button"
                  className="admin-dropdown-item"
                  onClick={handleProfile}
                >

                  <span className="admin-dropdown-item-icon">
                    <User size={17} />
                  </span>

                  <span>
                    My Profile
                  </span>

                </button>

                {/* DIVIDER */}

                <div className="admin-dropdown-divider" />

                {/* COMPANY PROFILE */}

                <button
                  type="button"
                  className="admin-dropdown-item"
                  onClick={
                    handleCompanyProfile
                  }
                >

                  <span className="admin-dropdown-item-icon">
                    <BriefcaseBusiness
                      size={17}
                    />
                  </span>

                  <span>
                    Company Profile
                  </span>

                </button>

                {/* SETTINGS */}

                <button
                  type="button"
                  className="admin-dropdown-item"
                  onClick={
                    handleSettings
                  }
                >

                  <span className="admin-dropdown-item-icon">
                    <Settings size={17} />
                  </span>

                  <span>
                    Settings
                  </span>

                </button>

                {/* DIVIDER */}

                <div className="admin-dropdown-divider" />

                {/* LOGOUT */}

                <button
                  type="button"
                  className="admin-dropdown-item admin-dropdown-logout"
                  onClick={handleLogout}
                >

                  <span className="admin-dropdown-item-icon">
                    <LogOut size={17} />
                  </span>

                  <span>
                    Logout
                  </span>

                </button>

              </div>

            )}

          </div>

        )}

      </div>

    </header>
  );
};

export default Header;
