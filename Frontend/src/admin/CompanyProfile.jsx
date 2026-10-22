// src/admin/CompanyProfile.jsx

import React from "react";

import {
    User,
    MapPin,
    Mail,
    Phone,
    Globe,
    CheckCircle2,
    Monitor,
    Smartphone,
    ShoppingCart,
    Search,
    Megaphone,
    Palette,
    Code2,
    Server,
} from "lucide-react";

import AdminLayout from "../components/AdminLayout";
import Logo from "../img/nirvanza-logo.png";

import "./CompanyProfile.css";

// =====================================================
// STATIC DATA
// =====================================================

const PLAN_POINTS = [
    "We've been supporting to work in given time-frame.",
    "Perfect for large sites or agencies managing multiple clients.",
    "Our easy-to-use control panel and API let you spend",
];

const SERVICES = [
    { icon: Monitor, label: "Static Website" },
    { icon: Code2, label: "Dynamic Website" },
    { icon: Smartphone, label: "Android App Development" },
    { icon: Smartphone, label: "IOS App Development" },
    { icon: Search, label: "SEO" },
    { icon: Megaphone, label: "PPC" },
    { icon: Megaphone, label: "SMO Service" },
    { icon: ShoppingCart, label: "E-Commerce" },
    { icon: Palette, label: "Graphics Design" },
    { icon: Server, label: "Customize Software Development" },
];

const TESTIMONIALS = [
    {
        name: "Mr Mansuri",
        role: "Businessman",
        text: "Nirvanza Infotech have good experience of web and mobile app development. Personally, I would suggest you to choose the Nirvanza Infotech for Mobile App, Very strong customer support and nice infrastructure, it's best part of Nirvanza Infotech. Best of luck.",
    },
    {
        name: "Dr. Nehal Sadhu",
        role: "Doctor",
        text: "Fantastic work done by Nirvanza Infotech. I really appreciate the work of Nirvanza Infotech. My mobile application was developed by this company. Very good staff, sales service and after sales service is very very strong in both concept.",
    },
    {
        name: "Dr. Nischal Bhatt",
        role: "Doctor",
        text: "Nirvanza Infotech having very very strong portfolio. My experience with Nirvanza Infotech is very good. Every client need best customer support and after sales service and Nirvanza Infotech provides both.",
    },
];

const CONTACT = {
    address:
        "FB, 2nd Floor, Sumeru Complex, Suvidha Cross Road, Opp. Karnavati Pagarkha Bazar, Opp. Shilp Hospital, Nr. Parimal Underbridge, Paldi, Ahmedabad, Gujarat 380007",
    emails: ["nirvanzainfotech@gmail.com", "inquirynirvanza@gmail.com"],
    phones: ["+91 90330 65524", "+91 88660 65524"],
    webs: [
        "www.nirvanzainfotech.in",
        "www.nirvanzainfotech.co.in",
        "www.dnsoftech.in",
    ],
};

// =====================================================
// COMPONENT
// =====================================================

const CompanyProfile = ({ layout: Layout = AdminLayout }) => {
    return (
        <Layout>

            <div className="cp-page">

                {/* =====================================================
                    HERO
                ===================================================== */}

                <section className="cp-hero">
                    <h1>Company Profile</h1>
                </section>

                {/* =====================================================
                    ABOUT US
                ===================================================== */}

                <section className="cp-card">

                    <span className="cp-eyebrow">About Us</span>

                    <h2 className="cp-title">
                        Welcome To Nirvanza Infotech
                    </h2>

                    <p>
                        <strong>Nirvanza Infotech</strong> is a known and
                        reputed name in the IT Industry in Ahmedabad{" "}
                        <strong>Since 2014</strong>. Nirvanza Infotech is a{" "}
                        <strong>Web Development Company in Ahmedabad</strong>{" "}
                        providing Digital Media Solutions/Information
                        Technology services to the Customers. We believe in
                        best services and best qualities.
                    </p>

                    <p>
                        <strong>Nirvanza Infotech</strong> provides complete
                        solutions for different range of Web Designing like
                        Static Website, Flash Website, opensource website
                        (Dynamic Website), E-Commerce Website with shopping
                        cart and Payment gateway Integration, Portal
                        Development, Mobile Application Development, Domain
                        &amp; Hosting service.
                    </p>

                    <p>
                        Also <strong>Nirvanza Infotech</strong> provides
                        complete solutions for Search Engine Promotion
                        (Google, Yahoo, Msn), Social Media marketing, Print
                        Media designing, and other promotional activities.
                    </p>

                </section>

                {/* =====================================================
                    BEST PLANS
                ===================================================== */}

                <section className="cp-card cp-plans">

                    <div className="cp-plans-text">

                        <h2 className="cp-title">
                            Get Best Plans For More Power
                        </h2>

                        <p>
                            We work systematically to integrate corporate
                            responsibility in our core business and make our
                            expertise available for the benefit of the
                            societies where we operate.
                        </p>

                        <ul className="cp-points">
                            {PLAN_POINTS.map((point) => (
                                <li key={point}>
                                    <span className="cp-diamond" />
                                    {point}
                                </li>
                            ))}
                        </ul>

                    </div>

                    <div className="cp-services-grid">
                        {SERVICES.map(({ icon: Icon, label }) => (
                            <div className="cp-service" key={label}>
                                <Icon size={20} />
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>

                </section>

                {/* =====================================================
                    TESTIMONIALS
                ===================================================== */}

                <section className="cp-card cp-testimonials">

                    <span className="cp-eyebrow cp-eyebrow-accent">
                        Testimonial
                    </span>

                    <h2 className="cp-title">
                        What Our Client Are Saying
                    </h2>

                    <p className="cp-subtitle">
                        We enjoy adapting our strategies to offer every
                        client the best solutions that are at the forefront
                        of the industry.
                    </p>

                    <div className="cp-testimonial-grid">
                        {TESTIMONIALS.map((item) => (
                            <div className="cp-testimonial" key={item.name}>

                                <div className="cp-testimonial-head">

                                    <div className="cp-testimonial-avatar">
                                        <User size={26} />
                                    </div>

                                    <div>
                                        <h4>{item.name}</h4>
                                        <span>{item.role}</span>
                                    </div>

                                </div>

                                <p>{item.text}</p>

                            </div>
                        ))}
                    </div>

                </section>

                {/* =====================================================
                    CONTACT
                ===================================================== */}

                <section className="cp-card cp-contact">

                    <div className="cp-contact-brand">
                        <img src={Logo} alt="Nirvanza Infotech" />
                       
                    </div>

                    <div className="cp-contact-grid">

                        <div className="cp-contact-item">
                            <MapPin size={18} />
                            <div>
                                <strong>Address</strong>
                                <span>Nirvanza Infotech</span>
                                <span>{CONTACT.address}</span>
                            </div>
                        </div>

                        <div className="cp-contact-item">
                            <Mail size={18} />
                            <div>
                                <strong>Email</strong>
                                {CONTACT.emails.map((email) => (
                                    <a key={email} href={`mailto:${email}`}>
                                        {email}
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="cp-contact-item">
                            <Phone size={18} />
                            <div>
                                <strong>Phone</strong>
                                {CONTACT.phones.map((phone) => (
                                    <a
                                        key={phone}
                                        href={`tel:${phone.replace(/\s/g, "")}`}
                                    >
                                        {phone}
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="cp-contact-item">
                            <Globe size={18} />
                            <div>
                                <strong>Web</strong>
                                {CONTACT.webs.map((web) => (
                                    <a
                                        key={web}
                                        href={`https://${web}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {web}
                                    </a>
                                ))}
                            </div>
                        </div>

                    </div>

                    <div className="cp-copyright">
                        <CheckCircle2 size={15} />
                        @2014 Nirvanza Infotech. All Rights Reserved
                    </div>

                </section>

            </div>

        </Layout>
    );
};

export default CompanyProfile;
