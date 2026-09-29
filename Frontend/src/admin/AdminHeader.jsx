// src/admin/Header.jsx

import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  User,
  LogOut,
  Globe,
  ChevronDown,
  UserPlus,
  Settings,
} from "lucide-react";

import "./AdminHeader.css";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  const adminEmail = localStorage.getItem("adminEmail");

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

      <div className="admin-header-left">

        <div className="admin-header-title-wrapper">
          <h1 className="admin-header-title">
            {getPageTitle()}
          </h1>

          <p className="admin-header-subtitle">
            Welcome back, Admin
          </p>
        </div>

      </div>


      {/* =================================================
          RIGHT SIDE
      ================================================= */}


<div className="admin-header-right">

<button
  type="button"
  className="admin-header-globe"
  onClick={() => {
    window.open(
      "https://nirvanzainfotech.co.in/#gsc.tab=0",
      "_blank",
      "noopener,noreferrer"
    );
  }}
  title="Visit Nirvanza Infotech"
>
  <Globe size={20} />
</button>

  {adminEmail && (
    <div
      className={`admin-user-wrapper ${
        dropdownOpen
          ? "admin-user-wrapper-open"
          : ""
      }`}
      ref={dropdownRef}
    >

      {/* USER BUTTON */}

      <button
        type="button"
        className="admin-user-btn"
        onClick={() =>
          setDropdownOpen(!dropdownOpen)
        }
      >

        <div className="admin-user-avatar">
          <User size={18} />
        </div>

        <div className="admin-user-details">

          <span className="admin-user-name">
            Admin
          </span>

          <span className="admin-user-email">
            {adminEmail}
          </span>

        </div>

        <ChevronDown
          size={17}
          className={`admin-user-arrow ${
            dropdownOpen
              ? "admin-user-arrow-open"
              : ""
          }`}
        />

      </button>


      {/* DROPDOWN */}

      {dropdownOpen && (
        <div className="admin-user-dropdown">

          <div className="admin-dropdown-header">

            <div className="admin-dropdown-avatar">
              <User size={20} />
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

          <div className="admin-dropdown-divider" />

          {/* Profile */}

          <button
            type="button"
            className="admin-dropdown-item"
            onClick={handleProfile}
          >
            <span className="admin-dropdown-item-icon">
              <User size={17} />
            </span>

            <span>
              Profile
            </span>
          </button>

          {/* Add User */}

          <button
            type="button"
            className="admin-dropdown-item"
            onClick={handleAddUser}
          >
            <span className="admin-dropdown-item-icon">
              <UserPlus size={17} />
            </span>

            <span>
              Add User
            </span>
          </button>

          {/* Settings */}

          <button
            type="button"
            className="admin-dropdown-item"
            onClick={() => {
              setDropdownOpen(false);
              navigate("/emergency");
            }}
          >
            <span className="admin-dropdown-item-icon">
              <Settings size={17} />
            </span>

            <span>
              Settings
            </span>
          </button>

          <div className="admin-dropdown-divider" />

          {/* Logout */}

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