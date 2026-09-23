import React, { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import "./BackToTop.css";
 
const BackToTop = () => {
  const [visible, setVisible] = useState(false);
 
  const toggleVisibility = () => {
    if (window.scrollY > 300) setVisible(true);
    else setVisible(false);
  };
 
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
 
  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);
 
  return (
    <button
      className={`back-to-top ${visible ? "show" : ""}`}
      onClick={scrollToTop}
    >
      <ChevronUp size={24} />
    </button>
  );
};
 
export default BackToTop;