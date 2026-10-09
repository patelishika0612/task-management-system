import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// =====================================================
// SMTP TRANSPORTER
// =====================================================

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

// =====================================================
// 1. SEND APPROVAL REQUEST EMAIL TO BOSS
// =====================================================

export const sendApprovalEmail = async ({
    to,
    employeeName,
    employeeCode,
    departmentName,
    email,
    joiningDate,
    reason,
    approvalLink
}) => {
    const mailOptions = {
        from: `"Task Management System" <${process.env.SMTP_USER}>`,

        to,

        subject: "Admin Access Approval Request",

        html: `
            <div style="
                font-family: Arial, sans-serif;
                line-height: 1.6;
                max-width: 650px;
                margin: auto;
            ">

                <h2 style="color:#2563eb;">
                    Admin Access Approval Request
                </h2>

                <p>
                    A new admin access request has been submitted.
                </p>

                <p>
                    <strong>Employee Name:</strong>
                    ${employeeName}
                </p>

                <p>
                    <strong>Employee Code:</strong>
                    ${employeeCode}
                </p>

                <p>
                    <strong>Department:</strong>
                    ${departmentName}
                </p>

                <p>
                    <strong>Email:</strong>
                    ${email}
                </p>

                <p>
                    <strong>Joining Date:</strong>
                    ${joiningDate}
                </p>

                <p>
                    <strong>Reason:</strong>
                    ${reason}
                </p>

                <br />

                <a
                    href="${approvalLink}"
                    style="
                        display:inline-block;
                        padding:12px 20px;
                        background:#2563eb;
                        color:white;
                        text-decoration:none;
                        border-radius:6px;
                        font-weight:bold;
                    "
                >
                    Review Request
                </a>

                <p style="color:#666;">
                    This approval link is valid for 1 hour.
                </p>

            </div>
        `
    };

    return await transporter.sendMail(mailOptions);
};

// =====================================================
// 2. SEND APPROVED EMAIL
// =====================================================

export const sendApprovalSuccessEmail = async ({
    to,
    employeeName,
    employeeCode,
    departmentName
}) => {

    const adminLoginLink =
        `${process.env.FRONTEND_URL}/set-password?email=${encodeURIComponent(to)}`;

    const mailOptions = {
        from: `"Task Management System" <${process.env.SMTP_USER}>`,

        to,

        subject: "Admin Access Approved",

        html: `
            <div style="
                font-family: Arial, sans-serif;
                line-height: 1.6;
                max-width: 650px;
                margin: auto;
                padding: 20px;
            ">

                <h2 style="color:#16a34a;">
                    Admin Access Approved
                </h2>

                <p>
                    Hello <strong>${employeeName}</strong>,
                </p>

                <p>
                    Your admin access request has been
                    <strong style="color:#16a34a;">
                        APPROVED
                    </strong>.
                </p>

                <hr />

                <p>
                    <strong>Employee Name:</strong>
                    ${employeeName}
                </p>

                <p>
                    <strong>Employee Code:</strong>
                    ${employeeCode}
                </p>

                <p>
                    <strong>Department:</strong>
                    ${departmentName}
                </p>

                <br />

                <p>
                    Your admin access has been successfully approved.
                </p>

                <p>
                    Click the button below to access the Admin Login page.
                </p>

                <br />

                <a
                    href="${adminLoginLink}"
                    style="
                        display:inline-block;
                        padding:12px 22px;
                        background:#2563eb;
                        color:white;
                        text-decoration:none;
                        border-radius:6px;
                        font-weight:bold;
                    "
                >
                    Admin Login
                </a>

                <p style="
                    margin-top:25px;
                    color:#666;
                    font-size:13px;
                ">
                    Your email address will be automatically filled
                    on the login page.
                </p>

                <p>
                    Regards,<br />
                    <strong>Task Management System</strong>
                </p>

            </div>
        `
    };

    return await transporter.sendMail(mailOptions);
};

// =====================================================
// 3. SEND REJECTED EMAIL
// =====================================================

export const sendRejectionEmail = async ({
    to,
    employeeName,
    employeeCode,
    departmentName,
    rejectionReason
}) => {
    const mailOptions = {
        from: `"Task Management System" <${process.env.SMTP_USER}>`,

        to,

        subject: "Admin Access Request Rejected",

        html: `
            <div style="
                font-family: Arial, sans-serif;
                line-height: 1.6;
                max-width: 650px;
                margin: auto;
            ">

                <h2 style="color:#dc2626;">
                    Admin Access Request Rejected
                </h2>

                <p>
                    Hello <strong>${employeeName}</strong>,
                </p>

                <p>
                    Your admin access request has been
                    <strong style="color:#dc2626;">
                        REJECTED
                    </strong>.
                </p>

                <hr />

                <p>
                    <strong>Employee Name:</strong>
                    ${employeeName}
                </p>

                <p>
                    <strong>Employee Code:</strong>
                    ${employeeCode}
                </p>

                <p>
                    <strong>Department:</strong>
                    ${departmentName}
                </p>

                <br />

                <h3>
                    Rejection Reason
                </h3>

                <p>
                    ${rejectionReason || "No reason provided."}
                </p>

                <br />

                <p>
                    If you believe this was a mistake,
                    please contact your administrator.
                </p>

                <p>
                    Regards,<br />
                    <strong>Task Management System</strong>
                </p>

            </div>
        `
    };

    return await transporter.sendMail(mailOptions);
};