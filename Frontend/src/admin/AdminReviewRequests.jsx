
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  MapPin,
  FileText,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock3,
  LockKeyhole,
  BadgeCheck,
  CircleAlert,
} from "lucide-react";
import "./AdminReviewRequests.css";

const API_BASE_URL = "http://localhost:5000/api";

// ==================================================
// APPROVAL TIMEOUT
// 1 = 1 hour
// 24 = 24 hours
// ==================================================

const APPROVAL_TIMEOUT_HOURS = 1;

const AdminReviewRequests = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==================================================
  // LIVE COUNTDOWN
  // ==================================================

  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [requestExpired, setRequestExpired] = useState(false);

  // ==================================================
  // HELPER FUNCTIONS
  // ==================================================

  const getValue = (obj, ...keys) => {
    if (!obj) return "";

    for (const key of keys) {
      if (
        obj[key] !== undefined &&
        obj[key] !== null &&
        obj[key] !== ""
      ) {
        return obj[key];
      }
    }

    return "";
  };

  const formatDate = (date) => {
    if (!date) return "Not provided";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getStatus = (request) => {
    const status = getValue(
      request,
      "Request_Status",
      "request_status",
      "status"
    );

    return String(status || "Pending").toLowerCase();
  };

  const getRequestId = (request) => {
    return getValue(
      request,
      "Request_ID",
      "request_id",
      "RequestId",
      "requestId",
      "id"
    );
  };

  const getFullName = (request) => {
    const fullName = getValue(
      request,
      "Full_Name",
      "full_name",
      "FullName",
      "name",
      "Name"
    );

    if (fullName) return fullName;

    const firstName = getValue(
      request,
      "First_Name",
      "first_name",
      "FirstName",
      "firstName"
    );

    const lastName = getValue(
      request,
      "Last_Name",
      "last_name",
      "LastName",
      "lastName"
    );

    return `${firstName} ${lastName}`.trim() || "Unknown Employee";
  };

  // ==================================================
  // GET REQUEST CREATED DATE
  // ==================================================

  const getCreatedDate = (request) => {
    return getValue(
      request,
      "Created_At",
      "created_at",
      "CreatedAt",
      "createdAt",
      "Requested_At",
      "requested_at",
      "Request_Date",
      "request_date"
    );
  };

  // ==================================================
  // GET EXPIRY TIME
  //
  // If backend already gives expires_at,
  // use that.
  //
  // Otherwise calculate:
  // created_at + APPROVAL_TIMEOUT_HOURS
  // ==================================================

  const getExpiryDate = (request) => {
    const backendExpiry = getValue(
      request,
      "Expires_At",
      "expires_at",
      "ExpiresAt",
      "expiresAt"
    );

    if (backendExpiry) {
      const parsedExpiry = new Date(backendExpiry);

      if (!Number.isNaN(parsedExpiry.getTime())) {
        return parsedExpiry;
      }
    }

    const createdDate = getCreatedDate(request);

    if (!createdDate) {
      return null;
    }

    const parsedCreatedDate = new Date(createdDate);

    if (Number.isNaN(parsedCreatedDate.getTime())) {
      return null;
    }

    return new Date(
      parsedCreatedDate.getTime() +
        APPROVAL_TIMEOUT_HOURS * 60 * 60 * 1000
    );
  };

  // ==================================================
  // FORMAT COUNTDOWN
  // ==================================================

  const formatCountdown = (milliseconds) => {
    if (!milliseconds || milliseconds <= 0) {
      return "00:00:00";
    }

    const totalSeconds = Math.floor(
      milliseconds / 1000
    );

    const hours = Math.floor(totalSeconds / 3600);

    const minutes = Math.floor(
      (totalSeconds % 3600) / 60
    );

    const seconds = totalSeconds % 60;

    return [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(seconds).padStart(2, "0"),
    ].join(":");
  };

  // ==================================================
  // FETCH REQUESTS
  // ==================================================

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/admin-access-requests`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to fetch approval requests."
        );
      }

      const requestData = data.data || [];

      setRequests(requestData);

      // First pending request
      const pendingRequest = requestData.find(
        (request) =>
          getStatus(request) === "pending"
      );

      setSelectedRequest(
        pendingRequest ||
          requestData[0] ||
          null
      );
    } catch (error) {
      console.error(
        "Fetch approval requests error:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Unable to Load Requests",
        text:
          error.message ||
          "Something went wrong while loading approval requests.",
        confirmButtonColor: "#2948e8",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // FETCH REQUESTS ON PAGE LOAD
  // ==================================================

  useEffect(() => {
    fetchRequests();
  }, []);

  // ==================================================
  // LIVE CLOCK
  //
  // Updates every second.
  // ==================================================

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // ==================================================
  // CALCULATE REQUEST COUNTDOWN
  // ==================================================

  useEffect(() => {
    if (!selectedRequest) {
      setTimeRemaining(null);
      setRequestExpired(false);
      return;
    }

    const status = getStatus(selectedRequest);

    // Already approved/rejected
    if (status !== "pending") {
      setTimeRemaining(null);
      setRequestExpired(false);
      return;
    }

    const expiryDate =
      getExpiryDate(selectedRequest);

    if (!expiryDate) {
      setTimeRemaining(null);
      setRequestExpired(false);
      return;
    }

    const difference =
      expiryDate.getTime() -
      currentTime.getTime();

    if (difference <= 0) {
      setTimeRemaining(0);
      setRequestExpired(true);
    } else {
      setTimeRemaining(difference);
      setRequestExpired(false);
    }
  }, [selectedRequest, currentTime]);

  // ==================================================
  // AUTOMATIC EXPIRY
  // ==================================================

  useEffect(() => {
    if (
      !selectedRequest ||
      !requestExpired
    ) {
      return;
    }

    const status = getStatus(selectedRequest);

    if (status !== "pending") {
      return;
    }

    const requestId =
      getRequestId(selectedRequest);

    if (!requestId) {
      return;
    }

    const autoRejectRequest = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/admin-approval-requests/reject-request/${requestId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              rejectionReason:
                "Request automatically rejected because the approval time limit expired.",
              autoRejected: true,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          console.error(
            "Automatic expiry update failed:",
            data.message
          );

          return;
        }

        // Update local selected request
        setSelectedRequest((previous) => {
          if (!previous) return previous;

          return {
            ...previous,
            Request_Status: "rejected",
            request_status: "rejected",
            status: "rejected",
          };
        });

        // Refresh request list
        await fetchRequests();
      } catch (error) {
        console.error(
          "Automatic request expiry error:",
          error
        );
      }
    };

    autoRejectRequest();
  }, [requestExpired]);

  // ==================================================
  // APPROVE REQUEST
  // ==================================================

  const handleApprove = async () => {
    if (!selectedRequest) return;

    if (requestExpired) {
      Swal.fire({
        icon: "warning",
        title: "Request Expired",
        text:
          "This request can no longer be approved because the approval time has expired.",
        confirmButtonColor: "#2948e8",
      });

      return;
    }

    const requestId =
      getRequestId(selectedRequest);

    const fullName =
      getFullName(selectedRequest);

    if (!requestId) {
      Swal.fire({
        icon: "error",
        title: "Request ID Missing",
        text:
          "Unable to identify this approval request.",
        confirmButtonColor: "#2948e8",
      });

      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: "Approve Admin Access?",
      html: `
        <div style="font-size:14px;line-height:1.6;color:#70798d;">
          You are about to approve administrator access for
          <strong style="color:#171c35;">${fullName}</strong>.
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Yes, Approve",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#15966a",
      cancelButtonColor: "#70798d",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({
        title: "Approving Request...",
        text: "Please wait.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await fetch(
        `${API_BASE_URL}/admin-approval-requests/approve-request/${requestId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to approve request."
        );
      }

      await Swal.fire({
        icon: "success",
        title: "Request Approved",
        text: `${fullName} has been approved for administrator access.`,
        confirmButtonColor: "#2948e8",
      });

      await fetchRequests();
    } catch (error) {
      console.error(
        "Approve request error:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Approval Failed",
        text:
          error.message ||
          "Something went wrong while approving the request.",
        confirmButtonColor: "#2948e8",
      });
    }
  };

  // ==================================================
  // REJECT REQUEST
  // ==================================================

  const handleReject = async () => {
    if (!selectedRequest) return;

    if (requestExpired) {
      Swal.fire({
        icon: "warning",
        title: "Request Already Expired",
        text:
          "This request has already passed its approval time.",
        confirmButtonColor: "#2948e8",
      });

      return;
    }

    const requestId =
      getRequestId(selectedRequest);

    const fullName =
      getFullName(selectedRequest);

    if (!requestId) {
      Swal.fire({
        icon: "error",
        title: "Request ID Missing",
        text:
          "Unable to identify this approval request.",
        confirmButtonColor: "#2948e8",
      });

      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "Reject Admin Access?",
      html: `
        <div style="font-size:14px;line-height:1.6;color:#70798d;margin-bottom:12px;">
          Please provide a reason for rejecting
          <strong style="color:#171c35;">${fullName}</strong>'s request.
        </div>
      `,
      input: "textarea",
      inputPlaceholder:
        "Enter rejection reason...",
      inputAttributes: {
        "aria-label": "Rejection reason",
      },
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return "Please enter a rejection reason.";
        }

        return null;
      },
      showCancelButton: true,
      confirmButtonText: "Reject Request",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d9534f",
      cancelButtonColor: "#70798d",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({
        title: "Rejecting Request...",
        text: "Please wait.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await fetch(
        `${API_BASE_URL}/admin-approval-requests/reject-request/${requestId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rejectionReason:
              result.value.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to reject request."
        );
      }

      await Swal.fire({
        icon: "success",
        title: "Request Rejected",
        text: `${fullName}'s admin access request has been rejected.`,
        confirmButtonColor: "#2948e8",
      });

      await fetchRequests();
    } catch (error) {
      console.error(
        "Reject request error:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Rejection Failed",
        text:
          error.message ||
          "Something went wrong while rejecting the request.",
        confirmButtonColor: "#2948e8",
      });
    }
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="arv-page">
        <div className="arv-loading">
          <div className="arv-loading-spinner"></div>
          <p>Loading approval request...</p>
        </div>
      </div>
    );
  }

  // ==================================================
  // NO REQUEST
  // ==================================================

  if (!selectedRequest) {
    return (
      <div className="arv-page">
        <div className="arv-empty">

          <div className="arv-empty-icon">
            <CircleAlert size={30} />
          </div>

          <h2>No Approval Request Found</h2>

          <p>
            There are currently no administrator
            access requests available for review.
          </p>

          <button
            type="button"
            className="arv-refresh-btn"
            onClick={fetchRequests}
          >
            Refresh Requests
          </button>

        </div>
      </div>
    );
  }

  // ==================================================
  // REQUEST DATA
  // ==================================================

  const status = getStatus(selectedRequest);

  const fullName =
    getFullName(selectedRequest);

  const email = getValue(
    selectedRequest,
    "Email",
    "email",
    "Email_Address",
    "email_address"
  );

  const phone = getValue(
    selectedRequest,
    "Phone",
    "phone",
    "Phone_Number",
    "phone_number",
    "Mobile",
    "mobile"
  );

  const employeeId = getValue(
    selectedRequest,
    "Employee_ID",
    "employee_id",
    "EmployeeId",
    "employeeId"
  );

  const department = getValue(
    selectedRequest,
    "Department",
    "department"
  );

  const designation = getValue(
    selectedRequest,
    "Designation",
    "designation",
    "Job_Title",
    "job_title"
  );

  const location = getValue(
    selectedRequest,
    "Location",
    "location"
  );

  const reason = getValue(
    selectedRequest,
    "Reason",
    "reason",
    "Request_Reason",
    "request_reason",
    "Access_Reason",
    "access_reason"
  );

  const requestedDate = getValue(
    selectedRequest,
    "Created_At",
    "created_at",
    "Requested_At",
    "requested_at",
    "Request_Date",
    "request_date"
  );

  const requestedRole = getValue(
    selectedRequest,
    "Requested_Role",
    "requested_role",
    "Role",
    "role"
  );

  const accessLevel = getValue(
    selectedRequest,
    "Access_Level",
    "access_level",
    "Access_Type",
    "access_type"
  );

  // ==================================================
  // EXPIRY DATE
  // ==================================================

  const expiryDate =
    getExpiryDate(selectedRequest);

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="arv-page">

      {/* ============================================
          TOP HEADER
      ============================================ */}

      <header className="arv-top-header">

        <div className="arv-brand">

          <div className="arv-brand-icon">
            <ShieldCheck size={22} />
          </div>

          <div>

            <div className="arv-brand-title">
              Admin Access Approval
            </div>

            <div className="arv-brand-subtitle">
              Secure approval request
            </div>

          </div>

        </div>

        <div className="arv-secure-label">
          <LockKeyhole size={15} />
          Secure Review
        </div>

      </header>

      {/* ============================================
          MAIN PAGE
      ============================================ */}

      <main className="arv-container">

        {/* INTRO */}

        <section className="arv-intro">

          <div className="arv-intro-badge">
            <ShieldCheck size={15} />
            Admin Access Approval
          </div>

          <h1>
            Your request is ready for review
          </h1>

          <p>
            Review the employee information and
            access requirements before making
            your decision.
          </p>

        </section>

        {/* ============================================
            PROCESS STEPS
        ============================================ */}

        <div className="arv-process">

          <div className="arv-process-step arv-completed">

            <div className="arv-step-number">
              <CheckCircle2 size={17} />
            </div>

            <div>
              <span>01</span>
              <strong>Request Submitted</strong>
            </div>

          </div>

          <div className="arv-process-line active"></div>

          <div className="arv-process-step arv-active">

            <div className="arv-step-number">
              <FileText size={17} />
            </div>

            <div>
              <span>02</span>
              <strong>Review Request</strong>
            </div>

          </div>

          <div className="arv-process-line"></div>

          <div className="arv-process-step">

            <div className="arv-step-number">
              <KeyRound size={17} />
            </div>

            <div>
              <span>03</span>
              <strong>Create Password</strong>
            </div>

          </div>

          <div className="arv-process-line"></div>

          <div className="arv-process-step">

            <div className="arv-step-number">
              <BadgeCheck size={17} />
            </div>

            <div>
              <span>04</span>
              <strong>Complete Profile</strong>
            </div>

          </div>

        </div>

        {/* ============================================
            MAIN LAYOUT
        ============================================ */}

        <div className="arv-layout">

          {/* ==========================================
              LEFT REQUEST DETAILS
          ========================================== */}

          <section className="arv-request-card">

            {/* REQUEST HEADER */}

            <div className="arv-request-header">

              <div className="arv-user-info">

                <div className="arv-user-avatar">
                  <User size={26} />
                </div>

                <div>

                  <div className="arv-request-label">
                    Administrator Access Request
                  </div>

                  <h2>{fullName}</h2>

                  <p>
                    {employeeId
                      ? `Employee ID: ${employeeId}`
                      : "Employee details"}
                  </p>

                </div>

              </div>

              <div
                className={`arv-status arv-status-${status}`}
              >

                {status === "approved" ? (
                  <CheckCircle2 size={15} />
                ) : status === "rejected" ? (
                  <XCircle size={15} />
                ) : (
                  <Clock3 size={15} />
                )}

                {status === "approved"
                  ? "Approved"
                  : status === "rejected"
                  ? "Rejected"
                  : "Pending"}

              </div>

            </div>

            {/* EMPLOYEE INFORMATION */}

            <div className="arv-section">

              <div className="arv-section-heading">

                <User size={18} />

                <div>

                  <h3>
                    Employee Information
                  </h3>

                  <p>
                    Basic information of the
                    requesting employee.
                  </p>

                </div>

              </div>

              <div className="arv-info-grid">

                <div className="arv-info-item">

                  <div className="arv-info-icon">
                    <User size={17} />
                  </div>

                  <div>
                    <span>Full Name</span>

                    <strong>
                      {fullName || "Not provided"}
                    </strong>
                  </div>

                </div>

                <div className="arv-info-item">

                  <div className="arv-info-icon">
                    <Mail size={17} />
                  </div>

                  <div>
                    <span>Email Address</span>

                    <strong>
                      {email || "Not provided"}
                    </strong>
                  </div>

                </div>

                <div className="arv-info-item">

                  <div className="arv-info-icon">
                    <Phone size={17} />
                  </div>

                  <div>
                    <span>Phone Number</span>

                    <strong>
                      {phone || "Not provided"}
                    </strong>
                  </div>

                </div>

                <div className="arv-info-item">

                  <div className="arv-info-icon">
                    <BriefcaseBusiness size={17} />
                  </div>

                  <div>
                    <span>Employee ID</span>

                    <strong>
                      {employeeId ||
                        "Not provided"}
                    </strong>
                  </div>

                </div>

                <div className="arv-info-item">

                  <div className="arv-info-icon">
                    <Building2 size={17} />
                  </div>

                  <div>
                    <span>Department</span>

                    <strong>
                      {department ||
                        "Not provided"}
                    </strong>
                  </div>

                </div>

                <div className="arv-info-item">

                  <div className="arv-info-icon">
                    <BriefcaseBusiness size={17} />
                  </div>

                  <div>
                    <span>Designation</span>

                    <strong>
                      {designation ||
                        "Not provided"}
                    </strong>
                  </div>

                </div>

                <div className="arv-info-item">

                  <div className="arv-info-icon">
                    <MapPin size={17} />
                  </div>

                  <div>
                    <span>Location</span>

                    <strong>
                      {location ||
                        "Not provided"}
                    </strong>
                  </div>

                </div>

                <div className="arv-info-item">

                  <div className="arv-info-icon">
                    <CalendarDays size={17} />
                  </div>

                  <div>
                    <span>Requested On</span>

                    <strong>
                      {formatDate(
                        requestedDate
                      )}
                    </strong>
                  </div>

                </div>

              </div>

            </div>

            {/* ACCESS INFORMATION */}

            <div className="arv-section">

              <div className="arv-section-heading">

                <ShieldCheck size={18} />

                <div>

                  <h3>
                    Access Information
                  </h3>

                  <p>
                    Requested administrator
                    permissions and access level.
                  </p>

                </div>

              </div>

              <div className="arv-access-grid">

                <div className="arv-access-box">

                  <span>
                    Requested Role
                  </span>

                  <strong>
                    {requestedRole ||
                      "Administrator"}
                  </strong>

                </div>

                <div className="arv-access-box">

                  <span>
                    Access Level
                  </span>

                  <strong>
                    {accessLevel ||
                      "Administrator Access"}
                  </strong>

                </div>

              </div>

            </div>

            {/* REASON */}

            <div className="arv-section arv-last-section">

              <div className="arv-section-heading">

                <FileText size={18} />

                <div>

                  <h3>
                    Reason for Access
                  </h3>

                  <p>
                    Explanation provided with
                    this request.
                  </p>

                </div>

              </div>

              <div className="arv-reason-box">

                <p>
                  {reason ||
                    "No specific reason was provided with this request."}
                </p>

              </div>

            </div>

          </section>

          {/* ==========================================
              RIGHT SIDEBAR
          ========================================== */}

          <aside className="arv-side-column">

            {/* SECURITY CARD */}

            <div className="arv-side-card arv-security-card">

              <div className="arv-security-icon">
                <ShieldCheck size={22} />
              </div>

              <div>

                <h3>
                  Safe to review
                </h3>

                <p>
                  This request is protected
                  and can be reviewed securely
                  by an authorized administrator.
                </p>

              </div>

            </div>

            {/* ========================================
                DECISION CARD
            ======================================== */}

            {status === "pending" &&
              !requestExpired && (
                <div className="arv-decision-card">

                  <div className="arv-decision-icon">
                    <ShieldCheck size={23} />
                  </div>

                  <div className="arv-decision-content">

                    <span className="arv-decision-label">
                      ADMIN ACCESS
                    </span>

                    <h3>
                      Ready to decide?
                    </h3>

                    <p>
                      Approve the request if all
                      employee information is correct.
                      Otherwise, reject the request
                      with a reason.
                    </p>

                  </div>

                  <div className="arv-decision-actions">

                    <button
                      type="button"
                      className="arv-approve-btn"
                      onClick={
                        handleApprove
                      }
                    >
                      <CheckCircle2 size={18} />
                      Approve Access
                    </button>

                    <button
                      type="button"
                      className="arv-reject-btn"
                      onClick={
                        handleReject
                      }
                    >
                      <XCircle size={18} />
                      Reject Request
                    </button>

                  </div>

                  <div className="arv-decision-note">

                    <LockKeyhole size={14} />

                    Please verify all employee
                    details before approving access.

                  </div>

                </div>
              )}

            {/* ========================================
                EXPIRED STATUS
            ======================================== */}

            {status === "pending" &&
              requestExpired && (
                <div className="arv-status-card arv-rejected-card">

                  <div className="arv-status-card-icon">
                    <Clock3 size={25} />
                  </div>

                  <span>
                    REQUEST EXPIRED
                  </span>

                  <h3>
                    Approval time expired
                  </h3>

                  <p>
                    This request was not approved
                    within the allowed time and has
                    been automatically rejected.
                  </p>

                </div>
              )}

            {/* ========================================
                APPROVED STATUS
            ======================================== */}

            {status === "approved" && (
              <div className="arv-status-card arv-approved-card">

                <div className="arv-status-card-icon">
                  <CheckCircle2 size={25} />
                </div>

                <span>
                  ACCESS APPROVED
                </span>

                <h3>
                  Administrator access approved
                </h3>

                <p>
                  This request has already been
                  approved. No further action
                  is required.
                </p>

              </div>
            )}

            {/* ========================================
                REJECTED STATUS
            ======================================== */}

            {status === "rejected" &&
              !requestExpired && (
                <div className="arv-status-card arv-rejected-card">

                  <div className="arv-status-card-icon">
                    <XCircle size={25} />
                  </div>

                  <span>
                    ACCESS REJECTED
                  </span>

                  <h3>
                    Administrator access rejected
                  </h3>

                  <p>
                    This request has already been
                    rejected. No further action
                    is required.
                  </p>

                </div>
              )}

            {/* ========================================
                REQUEST TIMEOUT CARD
            ======================================== */}

            {status === "pending" && (
              <div
                className={`arv-side-card arv-timeout-card ${
                  requestExpired
                    ? "arv-timeout-expired"
                    : ""
                }`}
              >

                <div className="arv-timeout-icon">
                  <Clock3 size={23} />
                </div>

                <div className="arv-timeout-label">
                  {requestExpired
                    ? "REQUEST EXPIRED"
                    : "TIME REMAINING"}
                </div>

                <div className="arv-timeout-time">

                  {requestExpired
                    ? "00:00:00"
                    : formatCountdown(
                        timeRemaining
                      )}

                </div>

                <div className="arv-timeout-text">

                  {requestExpired
                    ? "Approval time has expired"
                    : `This request must be reviewed within ${APPROVAL_TIMEOUT_HOURS} hour${
                        APPROVAL_TIMEOUT_HOURS >
                        1
                          ? "s"
                          : ""
                      }.`}

                </div>

                {expiryDate &&
                  !requestExpired && (
                    <div className="arv-timeout-deadline">

                      <CalendarDays size={14} />

                      Expires at{" "}
                      {expiryDate.toLocaleTimeString(
                        "en-IN",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: true,
                        }
                      )}

                    </div>
                  )}

              </div>
            )}

          </aside>

        </div>

      </main>

    </div>
  );
};

export default AdminReviewRequests;
