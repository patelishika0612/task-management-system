
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Phone,
  Mail,
  CalendarDays,
  IdCard,
  Building2,
  BriefcaseBusiness,
  FileText,
  ShieldCheck,
  Send,
  X,
  Info,
} from "lucide-react";
import Swal from "sweetalert2";
import "./AdminApprovalRequest.css";
import AdminLayout from "../components/AdminLayout";

const AdminApprovalRequest = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    emailAddress: "",
    dateOfBirth: "",
    employeeId: "",
    department: "",
    designation: "",
    joiningDate: "",
    reason: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Remove error when user starts correcting the field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const trimmedName = formData.fullName.trim();
    const trimmedPhone = formData.phoneNumber.trim();
    const trimmedEmail = formData.emailAddress.trim();
    const trimmedEmployeeId = formData.employeeId.trim();
    const trimmedDesignation = formData.designation.trim();
    const trimmedReason = formData.reason.trim();

    if (!trimmedName) {
      newErrors.fullName = "Full name is required.";
    } else if (trimmedName.length < 3) {
      newErrors.fullName = "Full name must be at least 3 characters.";
    }

    if (!trimmedPhone) {
      newErrors.phoneNumber = "Phone number is required.";
    } else if (!/^[0-9]{10}$/.test(trimmedPhone)) {
      newErrors.phoneNumber = "Enter a valid 10-digit phone number.";
    }

    if (!trimmedEmail) {
      newErrors.emailAddress = "Email address is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
    ) {
      newErrors.emailAddress = "Enter a valid email address.";
    }

    if (!trimmedEmployeeId) {
      newErrors.employeeId = "Employee ID is required.";
    }

    if (!formData.department) {
      newErrors.department = "Please select a department.";
    }

    if (!trimmedDesignation) {
      newErrors.designation = "Designation is required.";
    }

    if (!trimmedReason) {
      newErrors.reason = "Please provide a reason for admin access.";
    } else if (trimmedReason.length < 10) {
      newErrors.reason = "Reason must be at least 10 characters.";
    }

    // Date of birth cannot be in the future
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dob > today) {
        newErrors.dateOfBirth = "Date of birth cannot be in the future.";
      }
    }

    // Joining date cannot be in the future
    if (formData.joiningDate) {
      const joiningDate = new Date(formData.joiningDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (joiningDate > today) {
        newErrors.joiningDate = "Joining date cannot be in the future.";
      }
    }

    // If both dates exist, joining date should not be before DOB
    if (formData.dateOfBirth && formData.joiningDate) {
      const dob = new Date(formData.dateOfBirth);
      const joiningDate = new Date(formData.joiningDate);

      if (joiningDate < dob) {
        newErrors.joiningDate =
          "Joining date cannot be before date of birth.";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      Swal.fire({
        icon: "warning",
        title: "Check Your Details",
        text: "Please correct the highlighted fields before submitting.",
        confirmButtonColor: "#1687d9",
      });
      return;
    }

    const payload = {
      fullName: formData.fullName.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      emailAddress: formData.emailAddress.trim(),
      dateOfBirth: formData.dateOfBirth || null,
      employeeId: formData.employeeId.trim(),
      department: formData.department,
      designation: formData.designation.trim(),
      joiningDate: formData.joiningDate || null,
      reason: formData.reason.trim(),
      id: Date.now().toString(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem("approvalRequests") || "[]");
    localStorage.setItem("approvalRequests", JSON.stringify([...existing, payload]));

    await Swal.fire({
      icon: "success",
      title: "Request Submitted!",
      text: "Your admin access request has been submitted for review.",
      confirmButtonColor: "#1687d9",
    });

    navigate("/review-requests");
  };

  const handleCancel = () => {
    const hasData = Object.values(formData).some(
      (value) => value.trim() !== ""
    );

    if (!hasData) {
      navigate(-1);
      return;
    }

    Swal.fire({
      icon: "warning",
      title: "Discard Request?",
      text: "All entered information will be lost.",
      showCancelButton: true,
      confirmButtonText: "Yes, Cancel",
      cancelButtonText: "Continue Editing",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#1687d9",
    }).then((result) => {
      if (result.isConfirmed) {
        navigate(-1);
      }
    });
  };

  return (
<>
<AdminLayout>
    <div className="admin-approval-page">
      <div className="admin-approval-container">

        {/* Page Header */}
        <div className="admin-approval-header">
          <div className="admin-approval-header-icon">
            <ShieldCheck size={28} />
          </div>

          <div>
            <h1>Request Admin Access</h1>
            <p>
              Submit your details to request administrator access to the
              Task Management System.
            </p>
          </div>
        </div>

        {/* Approval Notice */}
        <div className="admin-approval-notice">
          <div className="admin-approval-notice-icon">
            <Info size={20} />
          </div>

          <div className="admin-approval-notice-content">
            <h3>Approval Required</h3>
            <p>
              Your account will not be activated immediately. After
              submitting this request, the authorized company approver
              will review your information. You will receive an email
              after your request is approved.
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          className="admin-approval-form-card"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* Personal Information */}
          <div className="admin-approval-section">
            <div className="admin-approval-section-header">
              <div className="admin-approval-section-icon">
                <User size={18} />
              </div>

              <div>
                <h2>Personal Information</h2>
                <p>Enter your basic personal information.</p>
              </div>
            </div>

            <div className="admin-approval-form-grid">

              {/* Full Name */}
              <div className="admin-approval-form-group">
                <label htmlFor="fullName">
                  Full Name <span>*</span>
                </label>

                <div
                  className={`admin-approval-input-wrapper ${
                    errors.fullName ? "has-error" : ""
                  }`}
                >
                  <User size={17} />

                  <input
                    id="fullName"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    autoComplete="name"
                  />
                </div>

                {errors.fullName && (
                  <small className="admin-approval-error">
                    {errors.fullName}
                  </small>
                )}
              </div>

              {/* Phone */}
              <div className="admin-approval-form-group">
                <label htmlFor="phoneNumber">
                  Phone Number <span>*</span>
                </label>

                <div
                  className={`admin-approval-input-wrapper ${
                    errors.phoneNumber ? "has-error" : ""
                  }`}
                >
                  <Phone size={17} />

                  <input
                    id="phoneNumber"
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);

                      setFormData((prev) => ({
                        ...prev,
                        phoneNumber: value,
                      }));

                      if (errors.phoneNumber) {
                        setErrors((prev) => ({
                          ...prev,
                          phoneNumber: "",
                        }));
                      }
                    }}
                    placeholder="Enter 10-digit phone number"
                    inputMode="numeric"
                    autoComplete="tel"
                  />
                </div>

                {errors.phoneNumber && (
                  <small className="admin-approval-error">
                    {errors.phoneNumber}
                  </small>
                )}
              </div>

              {/* Email */}
              <div className="admin-approval-form-group">
                <label htmlFor="emailAddress">
                  Email Address <span>*</span>
                </label>

                <div
                  className={`admin-approval-input-wrapper ${
                    errors.emailAddress ? "has-error" : ""
                  }`}
                >
                  <Mail size={17} />

                  <input
                    id="emailAddress"
                    type="email"
                    name="emailAddress"
                    value={formData.emailAddress}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    autoComplete="email"
                  />
                </div>

                {errors.emailAddress && (
                  <small className="admin-approval-error">
                    {errors.emailAddress}
                  </small>
                )}
              </div>

              {/* DOB */}
              <div className="admin-approval-form-group">
                <label htmlFor="dateOfBirth">Date of Birth</label>

                <div
                  className={`admin-approval-input-wrapper ${
                    errors.dateOfBirth ? "has-error" : ""
                  }`}
                >
                  <CalendarDays size={17} />

                  <input
                    id="dateOfBirth"
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                  />
                </div>

                {errors.dateOfBirth && (
                  <small className="admin-approval-error">
                    {errors.dateOfBirth}
                  </small>
                )}
              </div>
            </div>
          </div>

          {/* Employee Information */}
          <div className="admin-approval-section">
            <div className="admin-approval-section-header">
              <div className="admin-approval-section-icon">
                <BriefcaseBusiness size={18} />
              </div>

              <div>
                <h2>Employee Information</h2>
                <p>Provide your company employment details.</p>
              </div>
            </div>

            <div className="admin-approval-form-grid">

              {/* Employee ID */}
              <div className="admin-approval-form-group">
                <label htmlFor="employeeId">
                  Employee ID <span>*</span>
                </label>

                <div
                  className={`admin-approval-input-wrapper ${
                    errors.employeeId ? "has-error" : ""
                  }`}
                >
                  <IdCard size={17} />

                  <input
                    id="employeeId"
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    placeholder="Enter employee ID"
                  />
                </div>

                {errors.employeeId && (
                  <small className="admin-approval-error">
                    {errors.employeeId}
                  </small>
                )}
              </div>

              {/* Department */}
              <div className="admin-approval-form-group">
                <label htmlFor="department">
                  Department <span>*</span>
                </label>

                <div
                  className={`admin-approval-input-wrapper ${
                    errors.department ? "has-error" : ""
                  }`}
                >
                  <Building2 size={17} />

                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                  >
                    <option value="">Select Department</option>
                    <option value="HR">HR</option>
                    <option value="Administration">
                      Administration
                    </option>
                    <option value="Management">Management</option>
                  </select>
                </div>

                {errors.department && (
                  <small className="admin-approval-error">
                    {errors.department}
                  </small>
                )}
              </div>

              {/* Designation */}
              <div className="admin-approval-form-group">
                <label htmlFor="designation">
                  Designation <span>*</span>
                </label>

                <div
                  className={`admin-approval-input-wrapper ${
                    errors.designation ? "has-error" : ""
                  }`}
                >
                  <BriefcaseBusiness size={17} />

                  <input
                    id="designation"
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="Enter designation"
                  />
                </div>

                {errors.designation && (
                  <small className="admin-approval-error">
                    {errors.designation}
                  </small>
                )}
              </div>

              {/* Joining Date */}
              <div className="admin-approval-form-group">
                <label htmlFor="joiningDate">Joining Date</label>

                <div
                  className={`admin-approval-input-wrapper ${
                    errors.joiningDate ? "has-error" : ""
                  }`}
                >
                  <CalendarDays size={17} />

                  <input
                    id="joiningDate"
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleChange}
                  />
                </div>

                {errors.joiningDate && (
                  <small className="admin-approval-error">
                    {errors.joiningDate}
                  </small>
                )}
              </div>
            </div>
          </div>

          {/* Access Request */}
          <div className="admin-approval-section admin-approval-last-section">
            <div className="admin-approval-section-header">
              <div className="admin-approval-section-icon">
                <ShieldCheck size={18} />
              </div>

              <div>
                <h2>Access Request</h2>
                <p>Tell the approver why administrator access is required.</p>
              </div>
            </div>

            <div className="admin-approval-form-group">
              <label htmlFor="reason">
                Reason for Admin Access <span>*</span>
              </label>

              <div
                className={`admin-approval-textarea-wrapper ${
                  errors.reason ? "has-error" : ""
                }`}
              >
                <FileText size={17} />

                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Explain why you need administrator access..."
                  rows="5"
                  maxLength="500"
                />
              </div>

              <div className="admin-approval-textarea-footer">
                {errors.reason ? (
                  <small className="admin-approval-error">
                    {errors.reason}
                  </small>
                ) : (
                  <small>
                    Please provide a clear business reason for the request.
                  </small>
                )}

                <span>{formData.reason.length}/500</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="admin-approval-actions">
            <button
              type="button"
              className="admin-approval-cancel-btn"
              onClick={handleCancel}
            >
              <X size={17} />
              Cancel
            </button>

            <button
              type="submit"
              className="admin-approval-submit-btn"
            >
              <Send size={17} />
              Send Approval Request
            </button>
          </div>
        </form>

        {/* Bottom Security Note */}
        <div className="admin-approval-security-note">
          <ShieldCheck size={16} />
          <span>
            Your information will be reviewed only by an authorized
            company approver.
          </span>
        </div>
      </div>
    </div>
    </AdminLayout>
    </>

  );
};

export default AdminApprovalRequest;



