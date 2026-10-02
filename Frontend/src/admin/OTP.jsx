import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LogIn,
  CheckCircle2,
} from "lucide-react";
import Swal from "sweetalert2";
import "./AdminLogin.css";

const OTP = () => {
  const navigate = useNavigate();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef([]);

  // ==================================================
  // HANDLE OTP CHANGE
  // ==================================================
  const handleOtpChange = (value, index) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      return;
    }

    // Only one digit
    const digit = value.slice(-1);

    const newOtp = [...otp];
    newOtp[index] = digit;

    setOtp(newOtp);

    // Move to next box
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // ==================================================
  // HANDLE BACKSPACE
  // ==================================================
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Move previous with ArrowLeft
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Move next with ArrowRight
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // ==================================================
  // HANDLE OTP PASTE
  // ==================================================
  const handlePaste = (e) => {
    e.preventDefault();

    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pastedData) {
      return;
    }

    const newOtp = ["", "", "", "", "", ""];

    pastedData.split("").forEach((digit, index) => {
      newOtp[index] = digit;
    });

    setOtp(newOtp);

    const nextIndex = Math.min(pastedData.length, 5);

    inputRefs.current[nextIndex]?.focus();
  };

  // ==================================================
  // VERIFY OTP
  // ==================================================
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    const enteredOTP = otp.join("");

    // ================================
    // BASIC VALIDATION
    // ================================
    if (enteredOTP.length !== 6) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete OTP",
        text: "Please enter the complete 6-digit OTP.",
        confirmButtonColor: "#1557f5",
      });

      return;
    }

    try {
      setLoading(true);

      // ==================================================
      // DEMO OTP VERIFICATION
      // ==================================================
      // Replace this section with your backend API call.
      //
      // Example:
      //
      // const response = await axios.post(
      //   "YOUR_API_URL/api/admin/verify-otp",
      //   {
      //     otp: enteredOTP,
      //   }
      // );

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Demo OTP
      if (enteredOTP !== "123456") {
        Swal.fire({
          icon: "error",
          title: "Invalid OTP",
          text: "The OTP you entered is incorrect.",
          confirmButtonColor: "#1557f5",
        });

        setLoading(false);
        return;
      }

      // ==================================================
      // SUCCESS
      // ==================================================

      await Swal.fire({
        icon: "success",
        title: "OTP Verified",
        text: "Your OTP has been verified successfully.",
        showConfirmButton: false,
        timer: 1200,
      });

      // Navigate to reset password page
      navigate("/reset-password");

    } catch (error) {
      console.error("OTP VERIFY ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Something Went Wrong",
        text: "Unable to verify OTP. Please try again.",
        confirmButtonColor: "#1557f5",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">

      {/* ==================================================
          LEFT SIDE
      ================================================== */}
      <div className="admin-login-left">

        {/* Decorative Shapes */}
        <div className="admin-login-decoration admin-login-decoration-one"></div>
        <div className="admin-login-decoration admin-login-decoration-two"></div>
        <div className="admin-login-decoration admin-login-decoration-three"></div>

      </div>

      {/* ==================================================
          RIGHT SIDE
      ================================================== */}
      <div className="admin-login-right">

        <div className="admin-login-card">

          {/* Mobile Logo */}
          <div className="admin-login-mobile-brand">

            <div className="admin-login-mobile-icon">
              <ShieldCheck size={26} />
            </div>

            <div>
              <h3>HR Management</h3>
              <span>Admin Portal</span>
            </div>

          </div>

          {/* Heading */}
          <div className="admin-login-heading">

            <div className="admin-login-welcome">
              Verify OTP
            </div>

            <h1>Enter verification code</h1>

            <p>
              Enter the 6-digit OTP sent to your registered
              email address.
            </p>

          </div>

          {/* OTP Form */}
          <form
            className="admin-login-form"
            onSubmit={handleVerifyOTP}
          >

            {/* OTP */}
            <div className="admin-login-form-group">

              <label>
                Verification Code
              </label>

              <div
                className="admin-otp-container"
                onPaste={handlePaste}
              >

                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) =>
                      handleOtpChange(
                        e.target.value,
                        index
                      )
                    }
                    onKeyDown={(e) =>
                      handleKeyDown(e, index)
                    }
                    className="admin-otp-input"
                    aria-label={`OTP digit ${index + 1}`}
                  />
                ))}

              </div>

              <div className="admin-otp-helper">
                <span>
                  Enter all 6 digits
                </span>

                <button
                  type="button"
                  className="admin-login-forgot"
                  onClick={() => {
                    Swal.fire({
                      icon: "success",
                      title: "OTP Sent",
                      text: "A new OTP has been sent to your email.",
                      confirmButtonColor: "#1557f5",
                    });
                  }}
                >
                  Resend OTP
                </button>
              </div>

            </div>

            {/* Verify Button */}
            <button
              type="submit"
              className="admin-login-submit mt-4"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="admin-login-spinner"></span>
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 size={19} />
                  Verify OTP
                </>
              )}

            </button>

            {/* Back To Login */}
            <button
              type="button"
              className="admin-login-forgot"
              onClick={() => navigate("/login")}
              style={{
                width: "100%",
                marginTop: "14px",
              }}
            >
              <LogIn size={16} />
              Back to Login
            </button>

          </form>

          {/* Security Information */}
          <div className="admin-login-security">

            <ShieldCheck size={18} />

            <div>
              <strong>Secure Verification</strong>

              <span>
                Never share your OTP with anyone.
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default OTP;