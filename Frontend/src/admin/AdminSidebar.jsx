// src/admin/Sidebar.jsx

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../img/nirvanza-logo.png";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CalendarDays,
  UserRound,
  Building2,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from "lucide-react";

import "./AdminSidebar.css";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // -----------------------------------------
  // RESPONSIVE SIDEBAR
  // -----------------------------------------
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1025) {
        setIsOpen(false);
        setIsMobile(true);
      } else {
        setIsOpen(true);
        setIsMobile(false);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // -----------------------------------------
  // MENU
  // -----------------------------------------
  const menuItems = [
    {
      title: "Dashboard",
      path: "/",
      icon: <LayoutDashboard size={19} strokeWidth={2} />,
    },
    {
      title: "Employee",
      path: "/employees",
      icon: <Users size={19} strokeWidth={2} />,
    },
    {
      title: "Projects",
      path: "/projects",
      icon: <FolderKanban size={19} strokeWidth={2} />,
    },
    {
      title: "Calendar",
      path: "/#",
      icon: <CalendarDays size={19} strokeWidth={2} />,
    },
    {
      title: "Clients",
      path: "/clients",
      icon: <UserRound size={19} strokeWidth={2} />,
    },
    {
      title: "Departments",
      path: "/departments",
      icon: <Building2 size={19} strokeWidth={2} />,
    },
  
  ];

  // -----------------------------------------
  // DASHBOARD
  // -----------------------------------------
  const goToDashboard = () => {
    navigate("/dashboard");

    if (isMobile) {
      setIsOpen(false);
    }
  };

  // -----------------------------------------
  // LOGOUT
  // -----------------------------------------
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <>
      {/* ======================================
          MOBILE MENU BUTTON
      ====================================== */}
      {isMobile && (
        <button
          className="admin-mobile-menu-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle sidebar"
        >
          {isOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      )}

      {/* ======================================
          MOBILE OVERLAY
      ====================================== */}
      {isMobile && isOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

          {/* SIDEBAR */}
      <aside
        className={`admin-sidebar ${isOpen ? "admin-sidebar-open" : "admin-sidebar-closed"
          }`}
      >

        {/* LOGO / BRAND */}

        <div
          className="admin-sidebar-brand"
          onClick={goToDashboard}
        >
          <img
            src={Logo}
            alt="Nirvanza Logo"
            className="admin-brand-full-logo"
          />
        </div>

        {/* MENU */}

        <div className="admin-sidebar-menu-wrapper">

          {/* <p className="admin-sidebar-menu-title">
            MAIN MENU
          </p> */}

          <ul className="admin-sidebar-list">
            {menuItems.map((item) => {
              const isActive =
                location.pathname === item.path;

              return (
                <li
                  key={item.path}
                  className={`admin-sidebar-item ${isActive
                    ? "admin-sidebar-item-active"
                    : ""
                    }`}
                >
                  <Link
                    to={item.path}
                    className="admin-sidebar-link"
                    onClick={() =>
                      isMobile && setIsOpen(false)
                    }
                  >
                    <span className="admin-sidebar-icon">
                      {item.icon}
                    </span>

                    <span className="admin-sidebar-label">
                      {item.title}
                    </span>

                    <span className="admin-sidebar-arrow">
                        <ChevronRight size={16} />
                      </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ====================================
            BOTTOM SECTION
        ==================================== */}

      </aside>
    </>
  );
};

export default Sidebar;