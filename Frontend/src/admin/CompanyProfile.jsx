// src/admin/CompanyProfile.jsx

import React, { useEffect, useRef, useState } from "react";

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
        name: "Pratapbhai Thakor",
        role: "Businessman",
        text: "As a owner of Harsiddh Travels I really appreciate the work of Nirvanza Infotech. Nirvanza Infotech is very good company. Customer support and service part is very very strong. All staff is very good. My all digital work manage by Nirvanza Infotech and I am fully satisfied.",
    },
    {
        name: "Shraddha Hospital",
        role: "Doctor",
        text: "Nice work. My website, mobile application etc., all online and digital work done by Nirvanza Infotech. After sales service of Nirvanza Infotech is very good and it is very important part of each and every company. I really appreciate the work. Good going",
    },
    {
        name: "Pragnes Patel",
        role: "Businessman",
        text: "I am very satisfied with service of Nirvanza Infotech. After Sales service and perfect customer support is very strong part of this company Nirvanza Infotech.",
    },
    {
        name: "Ashwin Trivedi",
        role: "Astrologer",
        text: "Very Good. I m very satisfied with this company. My all digital and social media work done by this company. Service is the best part of Nirvanza Infotech",
    },
    {
        name: "Jia admin",
        role: "Businessman",
        text: "Positive: Professionalism, Quality, Responsiveness, Value Nice supportive hardworking team. I had a good experience in developing service for Website. Highly recommend it.",
    },
    {
        name: "Mr Mansuri",
        role: "Businessman",
        text: "Nirvanza Infotech have good experience of web and mobile app development. Personally, I would suggest you to choose the Nirvanza Infotech Top Mobile App Development Company based in Ahmedabad, Gujarat",
    },
    {
        name: "Dr. Nehal Sadhu",
        role: "Doctor",
        text: "Fantastic work done by Nirvanza Infotech. I really appreciate the work of Nirvanza Infotech. My mobile application develop by this company. Very good staff, very strong customer support, very nice infrastructure it's best part of Nirvanza Infotech. Best of luck",
    },
    {
        name: "Dr. Nischal Bhatt",
        role: "Doctor",
        text: "Nirvanza Infotech having very very strong portfolio. My experience with Nirvanza Infotech is very good. Every client need best customer support and after sales service and Nirvanza Infotech is very very strong in both concept.",
    },
    {
        name: "Innova Metals",
        role: "Businessman",
        text: "Fantastic work. I appreciate the work of Nirvanza Infotech. After sales support is very strong.",
    },
    {
        name: "Ankur Institute of Child Health",
        role: "Doctor",
        text: "Nirvanza Infotech is one of the best website development and mobile applications development company in ahmedabad gujarat. fantastic work, well manners staff.",
    },
    {
        name: "Citizen Travels",
        role: "Businessman",
        text: "nice work. my all work done by Nirvanza Infotech",
    },
];

const SLIDE_INTERVAL = 5000;
const SWIPE_THRESHOLD = 50;

// 3 cards on desktop, 2 on tablet, 1 on mobile
const getPerPage = () => {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 1100) return 2;
    return 3;
};

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
    const [perPage, setPerPage] = useState(getPerPage);
    const [page, setPage] = useState(0);
    const [paused, setPaused] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const dragStartX = useRef(null);

    const pageCount = Math.ceil(TESTIMONIALS.length / perPage);

    const handlePointerDown = (e) => {
        dragStartX.current = e.clientX;
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (dragStartX.current === null) return;
        setDragOffset(e.clientX - dragStartX.current);
    };

    const handlePointerUp = (e) => {
        if (dragStartX.current === null) return;
        const delta = e.clientX - dragStartX.current;
        dragStartX.current = null;
        setDragOffset(0);

        if (delta <= -SWIPE_THRESHOLD) {
            setPage((current) => (current + 1) % pageCount);
        } else if (delta >= SWIPE_THRESHOLD) {
            setPage((current) => (current - 1 + pageCount) % pageCount);
        }
    };

    useEffect(() => {
        const handleResize = () => setPerPage(getPerPage());
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        setPage((current) => (current >= pageCount ? 0 : current));
    }, [pageCount]);

    // restarts on manual page change so the next slide gets the full interval
    useEffect(() => {
        if (paused) return undefined;
        const timer = setTimeout(
            () => setPage((current) => (current + 1) % pageCount),
            SLIDE_INTERVAL
        );
        return () => clearTimeout(timer);
    }, [paused, pageCount, page]);

    // last page wraps around to the start so it is always full
    const visibleTestimonials = Array.from(
        { length: perPage },
        (_, i) => TESTIMONIALS[(page * perPage + i) % TESTIMONIALS.length]
    );

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

                    <div
                        className="cp-testimonial-grid"
                        key={`${page}-${perPage}`}
                        onMouseEnter={() => setPaused(true)}
                        onMouseLeave={() => setPaused(false)}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        style={
                            dragOffset
                                ? { transform: `translateX(${dragOffset}px)`, transition: "none" }
                                : undefined
                        }
                    >
                        {visibleTestimonials.map((item) => (
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

                    <div className="cp-testimonial-dots">
                        {Array.from({ length: pageCount }, (_, i) => (
                            <button
                                key={i}
                                type="button"
                                className={i === page ? "active" : ""}
                                aria-label={`Show testimonials page ${i + 1}`}
                                onClick={() => setPage(i)}
                            />
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
