import express from "express";

import adminApprovalRequestController
    from "../controllers/adminApprovalRequestController.js";

const router = express.Router();


// =====================================================
// GET ALL
// =====================================================

router.get(
    "/",
    adminApprovalRequestController.getAllApprovals
);


// =====================================================
// GET BY TOKEN
// =====================================================

router.get(
    "/token/:token",
    adminApprovalRequestController.getApprovalByToken
);


// =====================================================
// APPROVE BY TOKEN
// =====================================================

router.post(
    "/approve/:token",
    adminApprovalRequestController.approveByToken
);


// =====================================================
// REJECT BY TOKEN
// =====================================================

router.post(
    "/reject/:token",
    adminApprovalRequestController.rejectByToken
);


// =====================================================
// APPROVE BY REQUEST ID
// =====================================================

router.post(
    "/approve-request/:requestId",
    adminApprovalRequestController.approveByRequestId
);


// =====================================================
// REJECT BY REQUEST ID
// =====================================================

router.post(
    "/reject-request/:requestId",
    adminApprovalRequestController.rejectByRequestId
);


// =====================================================
// GET BY ID
// =====================================================

router.get(
    "/:id",
    adminApprovalRequestController.getApprovalById
);


// =====================================================
// CREATE
// =====================================================

router.post(
    "/",
    adminApprovalRequestController.createApproval
);


// =====================================================
// DELETE
// =====================================================

router.delete(
    "/:id",
    adminApprovalRequestController.deleteApproval
);

export default router;