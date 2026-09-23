import React from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import "./Dashboard.css";

import {
  Info,
  Stethoscope,
  BookOpen,
  Building2,
  PhoneCall,
  Star,
  Image as ImageIcon,
  User,
  CalendarCheck,
} from "lucide-react";

const Dashboard = () => {
  const sections = [
    // {
    //   title: "Home",
    //   description: "Add Admin Home",
    //   path: "/adminhome",
    //   icon: <User size={30} />,
    // },
    // {
    //   title: "About",
    //   description: "Add About Content",
    //   path: "/adminabout",
    //   icon: <Info size={30} />,
    // },
    // {
    //   title: "Services",
    //   description: "Add Services",
    //   path: "/serviceview",
    //   icon: <Stethoscope size={30} />,
    // },
    // {
    //   title: "Patient Guide",
    //   description: "Add Patient Guide",
    //   path: "/adminPatientguide",
    //   icon: <BookOpen size={30} />,
    // },
    // {
    //   title: "Hospitals",
    //   description: "Add Hospitals",
    //   path: "/hospital",
    //   icon: <Building2 size={30} />,
    // },
    // {
    //   title: "Emergency Contacts",
    //   description: "Add Emergency Contacts",
    //   path: "/emergency",
    //   icon: <PhoneCall size={30} />,
    // },
    // {
    //   title: "Reviews",
    //   description: "Add Reviews",
    //   path: "/adminReviews",
    //   icon: <Star size={30} />,
    // },
    // {
    //   title: "Gallery",
    //   description: "Add Gallery",
    //   path: "/addgallery",
    //   icon: <ImageIcon size={30} />,
    // },
    // {
    //   title: "Contact",
    //   description: "Add Contact Info",
    //   path: "/admincontact",
    //   icon: <PhoneCall size={30} />,
    // },
    // {
    //   title: "Appointments",
    //   description: "Manage Appointments",
    //   path: "/adminappointments",
    //   icon: <CalendarCheck size={30} />,
    // },
  ];

  return (
    <AdminLayout>
      <div className="dashboard-container">
        <div className="cards-grid">
          {sections.map((item, i) => (
            <Link key={i} to={item.path} className="card-link">
              <div className="admin-card">
                <div className="admin-card-header">
                  <div className="admin-card-icon">{item.icon}</div>
                  <h3>{item.title}</h3>
                </div>

                <p>{item.description}</p>

                <div className="card-shine"></div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;