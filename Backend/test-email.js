import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

const sendTestEmail = async () => {
    try {
        // Check SMTP connection
        await transporter.verify();

        console.log("SMTP connection successful!");

        // Send email
        const info = await transporter.sendMail({
            from: `"Task Management System" <${process.env.SMTP_USER}>`,
            to: process.env.BOSS_EMAIL,
            subject: "Task Management System - Test Email",

            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2>Test Email</h2>

                    <p>Hello,</p>

                    <p>
                        This is a test email from the
                        Task Management System.
                    </p>

                    <p>
                        Gmail SMTP configuration is working successfully.
                    </p>

                    <p>Thank you.</p>
                </div>
            `
        });

        console.log("Email sent successfully!");
        console.log("Message ID:", info.messageId);

    } catch (error) {
        console.error("Email sending failed:");
        console.error(error);
    }
};

sendTestEmail();