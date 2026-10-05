import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  User,
  Phone,
  Mail,
  CalendarDays,
  IdCard,
  Building2,
  BriefcaseBusiness,
  FileText,
  Clock3,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Eye,
  Trash2,
  MapPin,
} from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "../components/AdminLayout";
import "./AdminReviewRequests.css";

const AdminReviewRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("approvalRequests") || "[]");
    setRequests(data);
  }, []);

  const updateStatus = (id, status, reason = "") => {
    const updated = requests.map((r) =>
      r.id === id
        ? { ...r, status, rejectionReason: reason, updatedAt: new Date().toISOString() }
        : r
    );
    setRequests(updated);
    localStorage.setItem("approvalRequests", JSON.stringify(updated));
    setSelected((prev) => prev?.id === id ? { ...prev, status, rejectionReason: reason } : prev);
  };

  const handleAccept = async (req) => {
    const result = await Swal.fire({
      title: "Accept Request?",
      text: `Grant admin access to ${req.fullName}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Accept",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#16a34a",
    });
    if (!result.isConfirmed) return;
    updateStatus(req.id, "approved");
    Swal.fire({ icon: "success", title: "Accepted!", text: `${req.fullName} has been granted admin access.`, confirmButtonColor: "#16a34a" });
  };

  const handleReject = async (req) => {
    if (!rejectReason.trim()) {
      Swal.fire({ icon: "warning", title: "Reason Required", text: "Please enter a rejection reason.", confirmButtonColor: "#dc2626" });
      return;
    }
    const result = await Swal.fire({
      title: "Reject Request?",
      text: `Reject admin access for ${req.fullName}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Reject",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;
    updateStatus(req.id, "rejected", rejectReason.trim());
    setShowRejectInput(false);
    setRejectReason("");
    Swal.fire({ icon: "info", title: "Rejected", text: `Request from ${req.fullName} has been rejected.`, confirmButtonColor: "#dc2626" });
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Request?",
      text: "This will permanently remove the request.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;
    const updated = requests.filter((r) => r.id !== id);
    setRequests(updated);
    localStorage.setItem("approvalRequests", JSON.stringify(updated));
    if (selected?.id === id) setSelected(null);
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const statusBadge = (status) => {
    if (status === "approved") return <span className="arv-badge arv-badge-approved"><CheckCircle2 size={13} />Approved</span>;
    if (status === "rejected") return <span className="arv-badge arv-badge-rejected"><XCircle size={13} />Rejected</span>;
    return <span className="arv-badge arv-badge-pending"><Clock3 size={13} />Pending</span>;
  };

  const pending = requests.filter((r) => r.status === "pending").length;
  const approved = requests.filter((r) => r.status === "approved").length;
  const rejected = requests.filter((r) => r.status === "rejected").length;

  return (
    <AdminLayout>
      <div className="arv-page">

        {/* HEADER */}
        <div className="arv-header">
          <div className="arv-header-left">
            <div className="arv-header-icon"><ShieldCheck size={22} /></div>
            <div>
              <h1>Access Requests</h1>
              <p>Review and manage admin access requests</p>
            </div>
          </div>
          <button className="arv-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        {/* STATS */}
        <div className="arv-stats">
          <div className="arv-stat arv-stat-total">
            <span>{requests.length}</span>
            <p>Total</p>
          </div>
          <div className="arv-stat arv-stat-pending">
            <span>{pending}</span>
            <p>Pending</p>
          </div>
          <div className="arv-stat arv-stat-approved">
            <span>{approved}</span>
            <p>Approved</p>
          </div>
          <div className="arv-stat arv-stat-rejected">
            <span>{rejected}</span>
            <p>Rejected</p>
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className={`arv-layout ${selected ? "arv-layout-split" : ""}`}>

          {/* LIST */}
          <div className="arv-list-panel">
            <div className="arv-panel-title">
              <h3>All Requests</h3>
              <span>{requests.length} total</span>
            </div>

            {requests.length === 0 ? (
              <div className="arv-empty">
                <ShieldCheck size={40} />
                <p>No requests yet</p>
              </div>
            ) : (
              <div className="arv-list">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className={`arv-list-item ${selected?.id === req.id ? "arv-list-item-active" : ""}`}
                    onClick={() => { setSelected(req); setShowRejectInput(false); setRejectReason(""); }}
                  >
                    <div className="arv-list-avatar">
                      {req.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="arv-list-info">
                      <strong>{req.fullName}</strong>
                      <span>{req.designation} · {req.department}</span>
                      <span className="arv-list-date">{formatDate(req.createdAt)}</span>
                    </div>
                    <div className="arv-list-right">
                      {statusBadge(req.status)}
                      <button className="arv-delete-icon" onClick={(e) => { e.stopPropagation(); handleDelete(req.id); }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DETAIL PANEL */}
          {selected && (
            <div className="arv-detail-panel">

              <div className="arv-detail-header">
                <div className="arv-detail-avatar">{selected.fullName?.charAt(0).toUpperCase()}</div>
                <div>
                  <h2>{selected.fullName}</h2>
                  <p>{selected.designation} · {selected.department}</p>
                </div>
                <div className="arv-detail-status">{statusBadge(selected.status)}</div>
              </div>

              {/* INFO SECTIONS */}
              <div className="arv-detail-sections">

                <div className="arv-detail-section">
                  <h4><User size={15} /> Personal Info</h4>
                  <div className="arv-detail-grid">
                    <InfoRow icon={<Mail size={15} />} label="Email" value={selected.emailAddress} />
                    <InfoRow icon={<Phone size={15} />} label="Phone" value={selected.phoneNumber} />
                    <InfoRow icon={<CalendarDays size={15} />} label="Date of Birth" value={formatDate(selected.dateOfBirth)} />
                  </div>
                </div>

                <div className="arv-detail-section">
                  <h4><BriefcaseBusiness size={15} /> Employment</h4>
                  <div className="arv-detail-grid">
                    <InfoRow icon={<IdCard size={15} />} label="Employee ID" value={selected.employeeId} />
                    <InfoRow icon={<Building2 size={15} />} label="Department" value={selected.department} />
                    <InfoRow icon={<BriefcaseBusiness size={15} />} label="Designation" value={selected.designation} />
                    <InfoRow icon={<CalendarDays size={15} />} label="Joining Date" value={formatDate(selected.joiningDate)} />
                  </div>
                </div>

                <div className="arv-detail-section">
                  <h4><FileText size={15} /> Reason for Access</h4>
                  <div className="arv-reason-box">{selected.reason || "No reason provided."}</div>
                </div>

                {selected.status === "rejected" && selected.rejectionReason && (
                  <div className="arv-rejection-note">
                    <XCircle size={15} />
                    <div>
                      <strong>Rejection Reason</strong>
                      <p>{selected.rejectionReason}</p>
                    </div>
                  </div>
                )}

                <div className="arv-detail-section">
                  <h4><Clock3 size={15} /> Request Info</h4>
                  <div className="arv-detail-grid">
                    <InfoRow icon={<CalendarDays size={15} />} label="Submitted" value={formatDate(selected.createdAt)} />
                    <InfoRow icon={<Clock3 size={15} />} label="Status" value={selected.status?.charAt(0).toUpperCase() + selected.status?.slice(1)} />
                  </div>
                </div>

              </div>

              {/* ACTIONS */}
              {selected.status === "pending" && (
                <div className="arv-actions">
                  <div className="arv-actions-top">
                    <button className="arv-accept-btn" onClick={() => handleAccept(selected)}>
                      <CheckCircle2 size={17} /> Accept
                    </button>
                    <button
                      className="arv-reject-btn"
                      onClick={() => setShowRejectInput(!showRejectInput)}
                    >
                      <XCircle size={17} /> Reject
                    </button>
                  </div>

                  {showRejectInput && (
                    <div className="arv-reject-input-wrap">
                      <textarea
                        placeholder="Enter rejection reason..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                      />
                      <div className="arv-reject-input-btns">
                        <button className="arv-cancel-reason-btn" onClick={() => { setShowRejectInput(false); setRejectReason(""); }}>Cancel</button>
                        <button className="arv-confirm-reject-btn" onClick={() => handleReject(selected)}>
                          <XCircle size={15} /> Confirm Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selected.status === "approved" && (
                <div className="arv-approved-banner">
                  <CheckCircle2 size={20} />
                  <span>Admin access has been <strong>approved</strong> for this user.</span>
                </div>
              )}

              {selected.status === "rejected" && (
                <div className="arv-rejected-banner">
                  <XCircle size={20} />
                  <span>This request has been <strong>rejected</strong>.</span>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="arv-info-row">
    <div className="arv-info-icon">{icon}</div>
    <div>
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  </div>
);

export default AdminReviewRequests;
