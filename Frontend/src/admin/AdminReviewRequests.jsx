import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    CheckCircle2,
    XCircle,
    ArrowLeft,
    Clock3,
    RefreshCw
} from "lucide-react";

import Swal from "sweetalert2";
import "./AdminReviewRequests.css";

const API_BASE_URL = "http://localhost:5000/api";

const AdminReviewRequests = () => {
    const navigate = useNavigate();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedRequest, setSelectedRequest] =
        useState(null);

    // =====================================================
    // LOAD REQUESTS
    // =====================================================

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);

            const response = await fetch(
                `${API_BASE_URL}/admin-access-requests`
            );

            const data = await response.json();

            console.log("Access requests:", data);

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Failed to load requests."
                );
            }

            setRequests(data.data || []);

        } catch (error) {
            console.error(
                "Fetch requests error:",
                error
            );

            Swal.fire({
                icon: "error",
                title: "Unable to Load Requests",
                text:
                    error.message ||
                    "Something went wrong.",
                confirmButtonColor: "#2f3387"
            });

        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // GET VALUE
    // =====================================================

    const getValue = (obj, ...keys) => {
        for (const key of keys) {
            if (
                obj?.[key] !== undefined &&
                obj?.[key] !== null
            ) {
                return obj[key];
            }
        }

        return "";
    };

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (date) => {
        if (!date) return "—";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "—";
        }

        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };

    // =====================================================
    // STATUS
    // =====================================================

    const getStatus = (request) => {
        return String(
            getValue(
                request,
                "Request_Status",
                "request_status",
                "status"
            ) || "Pending"
        ).toLowerCase();
    };

    // =====================================================
    // OPEN REQUEST
    // =====================================================

    const openRequest = (request) => {
        setSelectedRequest(request);
    };

    // =====================================================
    // CLOSE REQUEST
    // =====================================================

    const closeRequest = () => {
        setSelectedRequest(null);
    };


    // =====================================================
// ACCEPT REQUEST
// =====================================================

const handleApprove = async () => {
    if (!selectedRequest) return;

    const requestId = getValue(
        selectedRequest,
        "Request_ID",
        "request_id"
    );

    const fullName = getValue(
        selectedRequest,
        "Full_Name",
        "full_name"
    );

    const result = await Swal.fire({
        title: "Approve Request?",
        text: `Are you sure you want to approve ${fullName}'s request?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, Approve",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#16a34a"
    });

    if (!result.isConfirmed) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/admin-approval-requests/approve-request/${requestId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Approval failed."
            );
        }

        await Swal.fire({
            icon: "success",
            title: "Approved!",
            text:
                data.message ||
                "Request approved successfully.",
            confirmButtonColor: "#16a34a"
        });

        setSelectedRequest(null);

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
                "Something went wrong.",
            confirmButtonColor: "#dc2626"
        });
    }
};


// =====================================================
// REJECT REQUEST
// =====================================================

const handleReject = async () => {
    if (!selectedRequest) return;

    const requestId = getValue(
        selectedRequest,
        "Request_ID",
        "request_id"
    );

    const fullName = getValue(
        selectedRequest,
        "Full_Name",
        "full_name"
    );

    const result = await Swal.fire({
        title: "Reject Request?",
        text: `Reject ${fullName}'s request?`,
        icon: "warning",
        input: "textarea",
        inputLabel: "Rejection Reason",
        inputPlaceholder:
            "Enter rejection reason...",
        inputAttributes: {
            "aria-label":
                "Enter rejection reason"
        },
        showCancelButton: true,
        confirmButtonText: "Reject",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#dc2626",

        inputValidator: (value) => {
            if (!value || !value.trim()) {
                return "Rejection reason is required.";
            }

            return null;
        }
    });

    if (!result.isConfirmed) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/admin-approval-requests/reject-request/${requestId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    rejectionReason:
                        result.value.trim()
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Rejection failed."
            );
        }

        await Swal.fire({
            icon: "success",
            title: "Request Rejected",
            text:
                data.message ||
                "Request rejected successfully.",
            confirmButtonColor: "#dc2626"
        });

        setSelectedRequest(null);

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
                "Something went wrong.",
            confirmButtonColor: "#dc2626"
        });
    }
};

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="arv-page">

                <div className="arv-header">

                    <strong>
                        Admin Access Review
                    </strong>

                    <button
                        className="arv-back"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft size={14} />
                        Back
                    </button>

                </div>

                <div className="arv-content">

                    <div className="arv-empty">

                        <h3>
                            Loading Requests...
                        </h3>

                        <p>
                            Please wait while requests
                            are being loaded.
                        </p>

                    </div>

                </div>

            </div>
        );
    }

    // =====================================================
    // MAIN UI
    // =====================================================

    return (
        <div className="arv-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="arv-header">

                <strong>
                    Admin Access Review
                </strong>

                <div
                    style={{
                        display: "flex",
                        gap: "8px"
                    }}
                >

                    <button
                        className="arv-back"
                        onClick={fetchRequests}
                    >
                        <RefreshCw size={14} />
                        Refresh
                    </button>

                    <button
                        className="arv-back"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft size={14} />
                        Back
                    </button>

                </div>

            </div>

            {/* =================================================
                CONTENT
            ================================================= */}

            <div className="arv-content">

                {/* NO REQUEST */}
                {requests.length === 0 ? (

                    <div className="arv-empty">

                        <h3>
                            No Request Found
                        </h3>

                        <p>
                            No admin access request
                            has been submitted yet.
                        </p>

                    </div>

                ) : (

                    <div className="arv-container">

                        {/* TITLE */}

                        <div className="arv-title">

                            <div>

                                <h1>
                                    Admin Access Requests
                                </h1>

                                <p>
                                    Review registration
                                    requests and check their
                                    current approval status.
                                </p>

                            </div>

                        </div>

                        {/* REQUEST LIST */}

                        <div className="arv-list">

                            {requests.map((item) => {

                                const requestId =
                                    getValue(
                                        item,
                                        "Request_ID",
                                        "request_id"
                                    );

                                const fullName =
                                    getValue(
                                        item,
                                        "Full_Name",
                                        "full_name"
                                    );

                                const employeeCode =
                                    getValue(
                                        item,
                                        "employee_code",
                                        "Employee_Code"
                                    );

                                const department =
                                    getValue(
                                        item,
                                        "department_name",
                                        "Department_Name"
                                    );

                                const status =
                                    getStatus(item);

                                return (

                                    <div
                                        key={requestId}
                                        className="arv-row"
                                        style={{
                                            cursor:
                                                "pointer"
                                        }}
                                        onClick={() =>
                                            openRequest(item)
                                        }
                                    >

                                        <span>
                                            #{requestId}
                                        </span>

                                        <strong>
                                            {fullName || "—"}
                                        </strong>

                                        <strong>
                                            {employeeCode || "—"}
                                        </strong>

                                        <strong>
                                            {department || "—"}
                                        </strong>

                                        <strong>
                                            {status}
                                        </strong>

                                    </div>

                                );
                            })}

                        </div>

                    </div>
                )}

            </div>

            {/* =================================================
                REQUEST DETAILS MODAL
            ================================================= */}

            {selectedRequest && (

                <div className="arv-modal-overlay">

                    <div className="arv-modal">

                        {/* TITLE */}

                        <div className="arv-title">

                            <div>

                                <h1>
                                    Admin Access Request
                                </h1>

                                <p>
                                    Review request details
                                    and approval status.
                                </p>

                            </div>

                        </div>

                        {/* USER */}

                        <div className="arv-user">

                            <h2>
                                {getValue(
                                    selectedRequest,
                                    "Full_Name",
                                    "full_name"
                                )}
                            </h2>

                            <span>
                                Employee Code:{" "}
                                {getValue(
                                    selectedRequest,
                                    "employee_code",
                                    "Employee_Code"
                                ) || "—"}
                            </span>

                        </div>

                        {/* DETAILS */}

                        <div className="arv-list">

                            <InfoRow
                                label="Full Name"
                                value={getValue(
                                    selectedRequest,
                                    "Full_Name",
                                    "full_name"
                                )}
                            />

                            <InfoRow
                                label="Email"
                                value={getValue(
                                    selectedRequest,
                                    "Email",
                                    "email"
                                )}
                            />

                            <InfoRow
                                label="Phone"
                                value={getValue(
                                    selectedRequest,
                                    "Phone",
                                    "phone"
                                )}
                            />

                            <InfoRow
                                label="Date of Birth"
                                value={formatDate(
                                    getValue(
                                        selectedRequest,
                                        "DOB",
                                        "dob"
                                    )
                                )}
                            />

                            <InfoRow
                                label="Employee Code"
                                value={getValue(
                                    selectedRequest,
                                    "employee_code",
                                    "Employee_Code"
                                )}
                            />

                            <InfoRow
                                label="Department"
                                value={getValue(
                                    selectedRequest,
                                    "department_name",
                                    "Department_Name"
                                )}
                            />

                            <InfoRow
                                label="Joining Date"
                                value={formatDate(
                                    getValue(
                                        selectedRequest,
                                        "Joining_Date",
                                        "joining_date"
                                    )
                                )}
                            />

                            <InfoRow
                                label="Submitted On"
                                value={formatDate(
                                    getValue(
                                        selectedRequest,
                                        "Created_At",
                                        "created_at"
                                    )
                                )}
                            />

                            <div className="arv-row arv-reason-row">

                                <span>
                                    Reason
                                </span>

                                <strong>
                                    {getValue(
                                        selectedRequest,
                                        "Reason",
                                        "reason"
                                    ) ||
                                        "No reason provided."}
                                </strong>

                            </div>

                        </div>

                        {/* =================================================
                            STATUS
                        ================================================= */}

                        {getStatus(selectedRequest) ===
                            "approved" && (

                            <div className="arv-message success">

                                <CheckCircle2 size={16} />

                                <span>
                                    Admin access has
                                    been approved.
                                </span>

                            </div>
                        )}

                        {getStatus(selectedRequest) ===
                            "rejected" && (

                            <div className="arv-message danger">

                                <XCircle size={16} />

                                <span>
                                    Request has been
                                    rejected.
                                </span>

                            </div>
                        )}

                      {getStatus(selectedRequest) === "pending" && (

    <>
        <div className="arv-message">

            <Clock3 size={16} />

            <span>
                This request is waiting for approval.
            </span>

        </div>

        {/* ==========================================
            ACCEPT / REJECT BUTTONS
        ========================================== */}

        <div className="arv-action-buttons">

            <button
                type="button"
                className="arv-approve-btn"
                onClick={handleApprove}
            >
                <CheckCircle2 size={16} />
                Accept
            </button>

            <button
                type="button"
                className="arv-reject-btn"
                onClick={handleReject}
            >
                <XCircle size={16} />
                Reject
            </button>

        </div>
    </>
)}

                        {/* =================================================
                            CLOSE
                        ================================================= */}

                        <div
                            style={{
                                marginTop: "20px",
                                textAlign: "right"
                            }}
                        >

                            <button
                                className="arv-cancel"
                                onClick={closeRequest}
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
};

// =====================================================
// INFO ROW
// =====================================================

const InfoRow = ({ label, value }) => {

    return (

        <div className="arv-row">

            <span>
                {label}
            </span>

            <strong>
                {value || "—"}
            </strong>

        </div>
    );
};

export default AdminReviewRequests;