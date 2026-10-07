
import React from "react";
import { useNavigate } from "react-router-dom";
import {
    CheckCircle2,
    Clock3,
    ShieldCheck,
    UserCheck,
    ArrowRight,
    LogIn,
} from "lucide-react";
import "./AdminApprovalPending.css";

const AdminApprovalPending = () => {
    const navigate = useNavigate();

    return (

        <div className="approval-pending-page">
            <div className="approval-pending-wrapper">

                {/* Main Content */}
                <div className="approval-pending-card">

                    {/* Success Icon */}
                    <div className="approval-success-icon">
                        <CheckCircle2 size={58} strokeWidth={1.8} />
                    </div>

                    <div className="approval-success-content">
                        <span className="approval-success-label">
                            REQUEST SUBMITTED
                        </span>

                        <h1>Request Submitted Successfully</h1>

                        <p className="approval-main-text">
                            Your request for administrator access has been submitted
                            successfully and is now waiting for HR approval.
                        </p>

                        <div className="approval-time-message">
                            <div className="approval-time-icon">
                                <Clock3 size={22} />
                            </div>

                            <div>
                                <strong>Please Wait</strong>
                                <p>
                                    Our HR/Admin team will review your request and contact
                                    you within <b>24 hours</b>.
                                </p>
                            </div>
                        </div>
                    </div>



                    {/* Notification */}
                    <div className="approval-notification">
                        <ShieldCheck size={20} />

                        <p>
                            You will be notified once your request has been approved.
                            Please keep your registered email and phone number available.
                        </p>
                    </div>

                    {/* Button */}
                    <button
                        className="approval-login-btn"
                        onClick={() => navigate("/adminLogin")}
                    >
                        <LogIn size={19} />
                        Back to Login
                        <ArrowRight size={18} />
                    </button>

                </div>

                {/* Footer */}
                <p className="approval-footer">
                    © {new Date().getFullYear()} Task Management System. All rights reserved.
                </p>

            </div>
        </div>
    );
};

export default AdminApprovalPending;




