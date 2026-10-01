// src/admin/Header.jsx

import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UserImg from "../img/user.png";
import {
  User,
  LogOut,
  Globe,
  ChevronDown,
  BriefcaseBusiness ,
  Settings, Bell
} from "lucide-react";

import "./AdminHeader.css";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // =====================================================
  // STATES
  // =====================================================

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [adminEmail, setAdminEmail] = useState(() => {
    return localStorage.getItem("adminEmail") || "";
  });

  const dropdownRef = useRef(null);

  // =====================================================
  // UPDATE EMAIL FROM LOCAL STORAGE
  // =====================================================

  useEffect(() => {
    const updateAdminEmail = () => {
      const email = localStorage.getItem("adminEmail") || "";
      setAdminEmail(email);
    };

    updateAdminEmail();

    // Listen for localStorage changes
    window.addEventListener("storage", updateAdminEmail);

    return () => {
      window.removeEventListener("storage", updateAdminEmail);
    };
  }, []);

  // =====================================================
  // PAGE TITLE
  // =====================================================

  const getPageTitle = () => {
    const path = location.pathname;

    const pageTitles = {
      "/dashboard": "Dashboard",
      "/adminhome": "Employee",
      "/adminabout": "Projects",
      "/serviceview": "Calendar",
      "/adminPatientguide": "Clients",
      "/hospital": "Departments",
      "/emergency": "Settings",
      "/adduser": "Add User",
      "/profile": "Profile",
    };

    return pageTitles[path] || "Admin Dashboard";
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("token");
    localStorage.removeItem("keepLogged");

    setAdminEmail("");
    setDropdownOpen(false);

    navigate("/adminLogin");
  };

  // =====================================================
  // ADD USER
  // =====================================================

  const handleAddUser = () => {
    setDropdownOpen(false);

    navigate("/adduser");
  };

  // =====================================================
  // PROFILE
  // =====================================================

  const handleProfile = () => {
    setDropdownOpen(false);

    navigate("/profile");
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

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // =====================================================
  // RETURN
  // =====================================================

  return (
    <header className="admin-header">

      {/* =================================================
          LEFT SIDE
      ================================================= */}

      {/* <div className="admin-header-left">

        <div className="admin-header-title-wrapper">

          <h1 className="admin-header-title">
            {getPageTitle()}
          </h1>

          <p className="admin-header-subtitle">
            Welcome back, Admin
          </p>

        </div>

      </div> */}


      {/* =================================================
          RIGHT SIDE
      ================================================= */}

      <div className="admin-header-right">

        {/* WEBSITE BUTTON */}


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
          className="admin-header-globe "
      
          title="Visit Nirvanza Infotech"
        >
          <Bell size={20} />
        </button>


        {/* =================================================
            ADMIN PROFILE
        ================================================= */}

        {adminEmail && (
          <div
            className={`admin-user-wrapper ${dropdownOpen
              ? "admin-user-wrapper-open"
              : ""
              }`}
            ref={dropdownRef}
          >

            {/* USER BUTTON */}

            <button
              type="button"
              className="admin-user-btn"
              onClick={() => {
                setDropdownOpen((prev) => !prev);
              }}
            >

              {/* AVATAR */}

              <div className="admin-user-avatar">
                {/* <User size={18} /> */}
                <img
                  src={UserImg}
                  alt="Admin Avatar"
                  className="admin-avatar-image"
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

                  <div className="admin-dropdown-avatar">
                <img
                  src={UserImg}
                  alt="Admin Avatar"
                  className="admin-avatar-image"
                />
                  </div>

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

 <div className="admin-dropdown-divider" />

                <button
                  type="button"
                  className="admin-dropdown-item"
                  onClick={handleAddUser}
                >

                  <span className="admin-dropdown-item-icon">
                    <BriefcaseBusiness   size={17} />
                  </span>

                  <span>
                    Company Profile
                  </span>

                </button>


                {/* =================================================
                    SETTINGS
                ================================================= */}

                <button
                  type="button"
                  className="admin-dropdown-item"
                  onClick={handleSettings}
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


                {/* =================================================
                    LOGOUT
                ================================================= */}

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