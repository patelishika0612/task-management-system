import React from "react";
import "./FloatingSocial.css";
import Whattsapp from "../img/whattsapp.gif";
import Phone from "../img/phone2.gif";
 
const socials = [
  { icon: Whattsapp, url: "https://api.whatsapp.com/send?phone=919904041187" }, // whatsapp direct link
  { icon: Phone, url: "tel:+91 79 26588096" }              // phone call link
];
 
const FloatingSocial = () => {
  return (
    <div className="floating-social">
      {socials.map((s, i) => (
        <a key={i} href={s.url} target="_blank" rel="noopener noreferrer">
          <img src={s.icon} alt="social" />
        </a>
      ))}
    </div>
  );
};
 
export default FloatingSocial;