import express from "express";

import adminApprovalRequestController
    from "../controllers/adminApprovalRequestController.js";

const router = express.Router();


// Get all
router.get(
    "/",
    adminApprovalRequestController.getAllApprovals
);


// Get by ID
router.get(
    "/:id",
    adminApprovalRequestController.getApprovalById
);


// Create approval link
router.post(
    "/",
    adminApprovalRequestController.createApproval
);


// Approve using token
router.post(
    "/approve/:token",
    adminApprovalRequestController.approveByToken
);


// Reject using token
router.post(
    "/reject/:token",
    adminApprovalRequestController.rejectByToken
);


// Delete
router.delete(
    "/:id",
    adminApprovalRequestController.deleteApproval
);


export default router;