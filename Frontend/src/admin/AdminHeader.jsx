// src/admin/Header.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import "./AdminHeader.css";
import Logo from "../img/logo.png";
import { Globe } from "lucide-react"; // make sure to import

const Header = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const adminEmail = localStorage.getItem("adminEmail");
  const dropdownRef = useRef();

  const handleLogout = () => {
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("token");
    localStorage.removeItem("keepLogged");
    navigate("/adminLogin");
  };

  const handleAddUser = () => {
    navigate("/adduser");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="admin-header">
      {/* Left side: Logo */}
      <div className="header-left">
        <a href="/dashboard" target="_blank" rel="noopener noreferrer">
          <img src={Logo} alt="Logo" className="logo-img" />
        </a>

      </div>

      {/* Right side: Visit + Logout */}
      <div className="header-right">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="visit-btn"
        >
          <Globe size={16} style={{ marginRight: "6px" }} /> Visit Website
        </a>

        {adminEmail && (
          <div
            className="user-info"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            ref={dropdownRef}
          >
            <User size={18} className="user-icon" />
            <span className="user-email">{adminEmail}</span>

            {dropdownOpen && (
              <div className="user-dropdown">
                <button className="dropdown-btn" onClick={handleAddUser}>
                  ➕ Add User
                </button>
                <button className="dropdown-btn logout-btn" onClick={handleLogout}>
                  <LogOut size={16} style={{ marginRight: "6px" }} /> Logout
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

