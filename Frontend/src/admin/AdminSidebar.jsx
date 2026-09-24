// src/admin/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Info,
  Stethoscope,
  BookOpen,
  Building2,
  PhoneCall,
  Star,
  Image as ImageIcon,
  Menu,
  User,
  CalendarCheck,
  X,
  Home, Type
} from "lucide-react";
import "./AdminSidebar.css";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Detect screen size
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

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const goToDashboard = () => navigate("/dashboard");

  const menuItems = [
    { title: "Dashboard", path: "/dashboard", icon: <Home size={20} /> },
    //     { 
    //   title: "Hero Slider", 
    //   path: "/admin/hero-slider", 
    //   icon: <Home size={20} /> 
    // },
    // das
    // { title: "Profiles", path: "/adminProfile", icon: <User size={20} /> },
    { title: "Home", path: "/adminhome", icon: <Home size={20} /> },
    { title: "About", path: "/adminabout", icon: <Info size={20} /> },
    { title: "Services", path: "/serviceview", icon: <Stethoscope size={20} /> },
    { title: "Patient Guide", path: "/adminPatientguide", icon: <BookOpen size={20} /> },
    { title: "Hospitals", path: "/hospital", icon: <Building2 size={20} /> },
    { title: "Emergency Contacts", path: "/emergency", icon: <PhoneCall size={20} /> },
    { title: "Reviews", path: "/adminReviews", icon: <Star size={20} /> },
    { title: "Gallery", path: "/addgallery", icon: <ImageIcon size={20} /> },
    { title: "Contact Info", path: "/admincontact", icon: <PhoneCall size={20} /> },
    { title: "Adminappointments", path: "/adminappointments", icon: <CalendarCheck size={20} /> },

  ];

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button className="menu-btn" onClick={toggleSidebar}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <h2 className="sidebar-title" onClick={goToDashboard}>
          Admin Panel
        </h2>

        <ul className="sidebar-list">
          {menuItems.map((item, i) => (
            <li
              key={i}
              className={`sidebar-item ${location.pathname === item.path ? "active" : ""
                }`}
            >
              <Link
                to={item.path}
                className="sidebar-link"
                onClick={() => isMobile && setIsOpen(false)}
              >
                <span className="sidebar-icon">
                  {item.icon}
                </span>

                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;
